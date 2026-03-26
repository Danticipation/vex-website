export function captureClientError(error: unknown, context: string): void {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  // Placeholder: wire @sentry/nextjs in production; keep hook to avoid no-op callsites.
  console.error("[monitoring]", context, error);
}
