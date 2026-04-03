import { randomUUID } from "node:crypto";
import type { WebSocket } from "ws";
import { getRedis } from "../lib/redis.js";
import { systemPrisma } from "../lib/tenant.js";
import {
  wsActiveConnections,
  wsAuctionBroadcastLatencyMs,
  wsMessagesTotal,
} from "../lib/metrics.js";

type PriorityTier = "premium" | "standard";

type WsClient = {
  ws: WebSocket;
  tenantId: string;
  roomId: string;
  tier: PriorityTier;
};

type BidPayload = {
  amountUsd: number;
  bidderUserId: string;
};

type SnapshotPayload = {
  roomId: string;
  tenantId: string;
  highBidUsd: number | null;
  recentBids: Array<{ amountUsd: number; bidderUserId: string; ts: string }>;
  usage: {
    bidsLast24h: number;
  };
};

type StreamEnvelope = {
  type: "bid" | "presence";
  tenantId: string;
  roomId: string;
  ts: string;
  payload: Record<string, unknown>;
};

export class AuctionRoomService {
  private readonly redis = getRedis();
  private readonly instanceId = randomUUID();
  private readonly consumerName = `consumer-${Math.random().toString(36).slice(2)}`;
  private readonly groupName: string;
  private readonly rooms = new Map<string, Set<WsClient>>();
  private readonly consumerStops = new Map<string, () => void>();

  constructor() {
    this.groupName = `vex-ws-${this.instanceId}`;
  }

  async attachClient(client: WsClient): Promise<void> {
    const key = this.roomKey(client.tenantId, client.roomId);
    const roomClients = this.rooms.get(key) ?? new Set<WsClient>();
    roomClients.add(client);
    this.rooms.set(key, roomClients);
    wsActiveConnections.labels(client.tenantId, client.tier).inc();
    if (roomClients.size === 1) {
      await this.startConsumer(client.tenantId, client.roomId);
    }
    const snapshot = await this.loadSnapshot(client.tenantId, client.roomId);
    this.send(client.ws, {
      type: "snapshot",
      tenantId: client.tenantId,
      roomId: client.roomId,
      ts: new Date().toISOString(),
      payload: snapshot,
    });
    await this.broadcastPresence(client.tenantId, client.roomId);
  }

  async detachClient(client: WsClient): Promise<void> {
    const key = this.roomKey(client.tenantId, client.roomId);
    const roomClients = this.rooms.get(key);
    if (!roomClients) return;
    roomClients.delete(client);
    wsActiveConnections.labels(client.tenantId, client.tier).dec();
    if (roomClients.size === 0) {
      const stop = this.consumerStops.get(key);
      stop?.();
      this.consumerStops.delete(key);
      this.rooms.delete(key);
      return;
    }
    await this.broadcastPresence(client.tenantId, client.roomId);
  }

  async publishBid(tenantId: string, roomId: string, payload: BidPayload): Promise<void> {
    const now = new Date().toISOString();
    const envelope: StreamEnvelope = {
      type: "bid",
      tenantId,
      roomId,
      ts: now,
      payload: {
        amountUsd: payload.amountUsd,
        bidderUserId: payload.bidderUserId,
      },
    };

    wsMessagesTotal.labels("out", "bid").inc();
    await this.logBidUsage(tenantId, roomId, payload);

    if (!this.redis) {
      this.broadcastLocal(tenantId, roomId, envelope);
      return;
    }

    const stream = this.streamKey(tenantId, roomId);
    await this.redis.xadd(stream, "*", "payload", JSON.stringify(envelope));
  }

  private async logBidUsage(tenantId: string, roomId: string, payload: BidPayload): Promise<void> {
    await systemPrisma.$transaction([
      systemPrisma.usageLog.create({
        data: {
          tenantId,
          kind: "auction_bid",
          quantity: 1,
          amountUsd: 0,
          meta: {
            amountUsd: payload.amountUsd,
            bidderUserId: payload.bidderUserId,
          },
        },
      }),
      systemPrisma.eventLog.create({
        data: {
          tenantId,
          type: "auction.bid_placed",
          payload: {
            roomId,
            amountUsd: payload.amountUsd,
            bidderUserId: payload.bidderUserId,
          },
        },
      }),
    ]);
  }

  private async loadSnapshot(tenantId: string, roomId: string): Promise<SnapshotPayload> {
    const cacheKey = `vex:auction:snapshot:${tenantId}:${roomId}`;
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached) as SnapshotPayload;
        } catch {
          // fall through
        }
      }
    }

    const [usageAgg, recentEvents] = await Promise.all([
      systemPrisma.usageLog.aggregate({
        where: {
          tenantId,
          kind: "auction_bid",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        _sum: { quantity: true },
      }),
      systemPrisma.eventLog.findMany({
        where: {
          tenantId,
          type: "auction.bid_placed",
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    const roomEvents = recentEvents
      .map((event) => ({ createdAt: event.createdAt, payload: event.payload as Record<string, unknown> }))
      .filter((event) => event.payload.roomId === roomId)
      .slice(0, 10)
      .map((event) => ({
        amountUsd: Number(event.payload.amountUsd ?? 0),
        bidderUserId: String(event.payload.bidderUserId ?? "unknown"),
        ts: event.createdAt.toISOString(),
      }));

    const snapshot: SnapshotPayload = {
      roomId,
      tenantId,
      highBidUsd: roomEvents[0]?.amountUsd ?? null,
      recentBids: roomEvents,
      usage: {
        bidsLast24h: usageAgg._sum.quantity ?? 0,
      },
    };

    if (this.redis) {
      await this.redis.set(cacheKey, JSON.stringify(snapshot), "EX", 15);
    }
    return snapshot;
  }

  private async broadcastPresence(tenantId: string, roomId: string): Promise<void> {
    const key = this.roomKey(tenantId, roomId);
    const clients = this.rooms.get(key);
    const count = clients?.size ?? 0;
    this.broadcastLocal(tenantId, roomId, {
      type: "presence",
      tenantId,
      roomId,
      ts: new Date().toISOString(),
      payload: { liveBidderCount: count },
    });
  }

  private broadcastLocal(
    tenantId: string,
    roomId: string,
    message: StreamEnvelope
  ): void {
    const key = this.roomKey(tenantId, roomId);
    const roomClients = this.rooms.get(key);
    if (!roomClients || roomClients.size === 0) return;

    const start = performance.now();
    const serialized = JSON.stringify(message);

    // Premium users are always sent first during bursts.
    const sorted = [...roomClients].sort((a, b) => (a.tier === b.tier ? 0 : a.tier === "premium" ? -1 : 1));
    for (const client of sorted) {
      if (client.ws.readyState === 1) {
        client.ws.send(serialized);
      }
    }

    wsAuctionBroadcastLatencyMs.labels(tenantId, roomId).observe(performance.now() - start);
  }

  private async startConsumer(tenantId: string, roomId: string): Promise<void> {
    if (!this.redis) return;
    const key = this.roomKey(tenantId, roomId);
    if (this.consumerStops.has(key)) return;
    const stream = this.streamKey(tenantId, roomId);

    try {
      await this.redis.xgroup("CREATE", stream, this.groupName, "0", "MKSTREAM");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes("BUSYGROUP")) {
        throw err;
      }
    }

    let stopped = false;
    this.consumerStops.set(key, () => {
      stopped = true;
    });

    const loop = async () => {
      while (!stopped) {
        const result = (await this.redis?.xreadgroup(
          "GROUP",
          this.groupName,
          this.consumerName,
          "COUNT",
          "50",
          "BLOCK",
          "5000",
          "STREAMS",
          stream,
          ">"
        )) as Array<[string, Array<[string, string[]]>]> | null;
        if (!result || stopped) continue;
        for (const [, entries] of result) {
          for (const [entryId, values] of entries) {
            const payloadIdx = values.findIndex((v) => v === "payload");
            const raw = payloadIdx >= 0 ? values[payloadIdx + 1] : null;
            if (!raw) {
              await this.redis?.xack(stream, this.groupName, entryId);
              continue;
            }
            try {
              const envelope = JSON.parse(raw) as StreamEnvelope;
              this.broadcastLocal(envelope.tenantId, envelope.roomId, envelope);
            } catch {
              // ignore malformed payloads; keep stream moving
            }
            await this.redis?.xack(stream, this.groupName, entryId);
          }
        }
      }
    };

    void loop().catch((err) => {
      console.error(JSON.stringify({ ws: "consumer_error", roomId, tenantId, err: String(err) }));
      this.consumerStops.delete(key);
    });
  }

  private roomKey(tenantId: string, roomId: string): string {
    return `${tenantId}:${roomId}`;
  }

  private streamKey(tenantId: string, roomId: string): string {
    return `vex:auction:${tenantId}:${roomId}:events`;
  }

  private send(
    ws: WebSocket,
    payload: {
      type: "connected" | "snapshot" | "error";
      tenantId: string;
      roomId?: string;
      ts: string;
      payload: Record<string, unknown>;
    }
  ): void {
    if (ws.readyState !== 1) return;
    ws.send(JSON.stringify(payload));
  }
}

export function getPriorityTier(role: string | undefined): PriorityTier {
  if (role === "STAFF" || role === "ADMIN" || role === "GROUP_ADMIN") {
    return "premium";
  }
  return "standard";
}
