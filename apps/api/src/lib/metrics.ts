import { Registry, Counter, Gauge, Histogram, collectDefaultMetrics } from "prom-client";

export const metricsRegistry = new Registry();

collectDefaultMetrics({ register: metricsRegistry, prefix: "vex_node_" });

export const httpRequestDurationSeconds = new Histogram({
  name: "vex_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status", "tenant_id"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
});

export const httpRequestsTotal = new Counter({
  name: "vex_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status", "tenant_id"],
  registers: [metricsRegistry],
});

export const valuationCallsTotal = new Counter({
  name: "vex_valuation_calls_total",
  help: "Valuation provider calls (after cache miss)",
  labelNames: ["tenant_id", "source", "outcome"],
  registers: [metricsRegistry],
});

export const tenantDailyCostUsd = new Counter({
  name: "vex_tenant_estimated_cost_usd_total",
  help: "Estimated API cost attributed to tenants (counter for alerting; reset via external billing)",
  labelNames: ["tenant_id", "kind"],
  registers: [metricsRegistry],
});

export const wsActiveConnections = new Gauge({
  name: "vex_ws_active_connections",
  help: "Current active websocket connections per tenant and tier",
  labelNames: ["tenant_id", "tier"],
  registers: [metricsRegistry],
});

export const wsAuctionBroadcastLatencyMs = new Histogram({
  name: "vex_auction_broadcast_latency_ms",
  help: "Latency in milliseconds to fan out auction events to connected clients",
  labelNames: ["tenant_id", "room_id"],
  buckets: [1, 2, 5, 10, 25, 50, 100, 250, 500],
  registers: [metricsRegistry],
});

export const wsMessagesTotal = new Counter({
  name: "vex_ws_messages_total",
  help: "Total websocket messages processed by direction/type",
  labelNames: ["direction", "type"],
  registers: [metricsRegistry],
});
