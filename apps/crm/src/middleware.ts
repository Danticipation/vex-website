import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Edge: short CDN cache for HTML shell; theme tokens still come from TenantThemeProvider + `/public/branding`. */
export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
