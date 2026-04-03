import { z } from "zod";

export const joinRoomMessageSchema = z.object({
  type: z.literal("join_room"),
  roomId: z.string().min(1),
});

export const leaveRoomMessageSchema = z.object({
  type: z.literal("leave_room"),
  roomId: z.string().min(1),
});

export const placeBidMessageSchema = z.object({
  type: z.literal("place_bid"),
  roomId: z.string().min(1),
  amountUsd: z.number().positive(),
});

export const clientMessageSchema = z.discriminatedUnion("type", [
  joinRoomMessageSchema,
  leaveRoomMessageSchema,
  placeBidMessageSchema,
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;

export const serverEnvelopeSchema = z.object({
  type: z.enum(["connected", "snapshot", "bid", "presence", "error"]),
  tenantId: z.string(),
  roomId: z.string().optional(),
  ts: z.string(),
  payload: z.record(z.any()),
});

export type ServerEnvelope = z.infer<typeof serverEnvelopeSchema>;
