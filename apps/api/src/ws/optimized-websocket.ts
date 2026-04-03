import { type IncomingMessage, type Server as HttpServer } from "node:http";
import type { Duplex } from "node:stream";
import { URL } from "node:url";
import jwt from "jsonwebtoken";
import { WebSocketServer, type WebSocket } from "ws";
import { AuctionRoomService, getPriorityTier } from "./auction-handler.js";
import { clientMessageSchema } from "./websocket-events.js";
import { wsMessagesTotal } from "../lib/metrics.js";

type JwtPayload = {
  userId: string;
  tenantId: string;
  role: string;
};

type ConnectionState = {
  ws: WebSocket;
  userId: string;
  tenantId: string;
  role: string;
  joinedRooms: Set<string>;
  isAlive: boolean;
};

const HEARTBEAT_MS = 15_000;

export function attachRealtimeWebSocket(server: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });
  const auctions = new AuctionRoomService();

  const heartbeat = setInterval(() => {
    for (const client of wss.clients) {
      const state = (client as WebSocket & { _state?: ConnectionState })._state;
      if (!state) continue;
      if (!state.isAlive) {
        client.terminate();
        continue;
      }
      state.isAlive = false;
      client.ping();
    }
  }, HEARTBEAT_MS);

  wss.on("close", () => clearInterval(heartbeat));

  server.on("upgrade", (req, socket, head) => {
    void handleUpgrade(req, socket, head).catch((err) => {
      socket.write(`HTTP/1.1 401 Unauthorized\r\n\r\n${String(err)}`);
      socket.destroy();
    });
  });

  async function handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer) {
    const origin = req.headers.origin ?? "";
    const url = new URL(req.url ?? "", "http://localhost");
    if (url.pathname !== "/ws/auctions") {
      socket.destroy();
      return;
    }
    if (!isOriginAllowed(origin)) {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }

    const auth = parseAuth(req, url);
    if (!auth) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, auth);
    });
  }

  wss.on("connection", (ws, _req, auth: JwtPayload) => {
    const state: ConnectionState = {
      ws,
      userId: auth.userId,
      tenantId: auth.tenantId,
      role: auth.role,
      joinedRooms: new Set<string>(),
      isAlive: true,
    };
    (ws as WebSocket & { _state?: ConnectionState })._state = state;

    wsMessagesTotal.labels("out", "connected").inc();
    ws.send(
      JSON.stringify({
        type: "connected",
        tenantId: state.tenantId,
        ts: new Date().toISOString(),
        payload: { userId: state.userId, role: state.role },
      })
    );

    ws.on("pong", () => {
      state.isAlive = true;
    });

    ws.on("message", (raw) => {
      void handleClientMessage(state, String(raw)).catch((err) => {
        ws.send(
          JSON.stringify({
            type: "error",
            tenantId: state.tenantId,
            ts: new Date().toISOString(),
            payload: { message: err instanceof Error ? err.message : String(err) },
          })
        );
      });
    });

    ws.on("close", () => {
      void (async () => {
        for (const roomId of [...state.joinedRooms]) {
          await auctions.detachClient({
            ws,
            tenantId: state.tenantId,
            roomId,
            tier: getPriorityTier(state.role),
          });
        }
      })();
    });
  });

  async function handleClientMessage(state: ConnectionState, raw: string): Promise<void> {
    wsMessagesTotal.labels("in", "raw").inc();
    const parsed = clientMessageSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      throw new Error("Invalid websocket message payload");
    }
    const msg = parsed.data;

    if (msg.type === "join_room") {
      state.joinedRooms.add(msg.roomId);
      await auctions.attachClient({
        ws: state.ws,
        tenantId: state.tenantId,
        roomId: msg.roomId,
        tier: getPriorityTier(state.role),
      });
      wsMessagesTotal.labels("in", "join_room").inc();
      return;
    }

    if (msg.type === "leave_room") {
      state.joinedRooms.delete(msg.roomId);
      await auctions.detachClient({
        ws: state.ws,
        tenantId: state.tenantId,
        roomId: msg.roomId,
        tier: getPriorityTier(state.role),
      });
      wsMessagesTotal.labels("in", "leave_room").inc();
      return;
    }

    if (msg.type === "place_bid") {
      if (state.role === "CUSTOMER" || state.role === "STAFF" || state.role === "ADMIN" || state.role === "GROUP_ADMIN") {
        await auctions.publishBid(state.tenantId, msg.roomId, {
          amountUsd: msg.amountUsd,
          bidderUserId: state.userId,
        });
        wsMessagesTotal.labels("in", "place_bid").inc();
        return;
      }
      throw new Error("Forbidden role for place_bid");
    }
  }
}

function parseAuth(req: IncomingMessage, url: URL): JwtPayload | null {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  const token = bearer ?? url.searchParams.get("token");
  if (!token) return null;

  const primarySecret = process.env.JWT_SECRET;
  if (!primarySecret) return null;

  try {
    return jwt.verify(token, primarySecret) as JwtPayload;
  } catch {
    const ssoSecret = process.env.SSO_JWT_SECRET;
    if (!ssoSecret) return null;
    try {
      return jwt.verify(token, ssoSecret) as JwtPayload;
    } catch {
      return null;
    }
  }
}

function isOriginAllowed(origin: string): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const allowed = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!origin) return false;
  return allowed.includes(origin);
}
