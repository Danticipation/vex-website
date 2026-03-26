import { NextResponse } from "next/server";

export const runtime = "edge";

/** Zero-latency CSS hook for white-label variables — extend with tenant CSS from KV/CDN in production. */
export async function GET() {
  const body = `:root{--vex-edge-injected:1;}\n`;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
