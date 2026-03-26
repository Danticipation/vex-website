import { trace, context, SpanStatusCode } from "@opentelemetry/api";

const tracer = trace.getTracer("vex-api", "1.0.0");

/**
 * Minimal OpenTelemetry hooks — wire a full `NodeSDK` in production via `OTEL_EXPORTER_OTLP_ENDPOINT`.
 */
export function startObservability(): void {
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    console.log(
      JSON.stringify({
        observability: "otel",
        message: "Set OTEL_EXPORTER_OTLP_ENDPOINT — use NodeSDK bootstrap in ops for full traces",
        endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      })
    );
  }
}

export async function withSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const out = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return out;
    } catch (e) {
      span.recordException(e as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw e;
    } finally {
      span.end();
    }
  });
}

export function getActiveContext() {
  return context.active();
}
