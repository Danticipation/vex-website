import type { Request, Response, NextFunction } from "express";
import { httpRequestDurationSeconds, httpRequestsTotal } from "../lib/metrics.js";

function routeLabel(req: Request): string {
  const p = req.path || req.url || "/";
  return p.length > 96 ? `${p.slice(0, 93)}...` : p;
}

export function metricsHttpMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  const route = routeLabel(req);
  res.on("finish", () => {
    const elapsed = Number(process.hrtime.bigint() - start) / 1e9;
    const tenantId = req.tenantId ?? "none";
    const labels = {
      method: req.method,
      route,
      status: String(res.statusCode),
      tenant_id: tenantId,
    };
    httpRequestDurationSeconds.observe(labels, elapsed);
    httpRequestsTotal.inc(labels);
  });
  next();
}
