"use client";

import { useWebglEligible } from "./useWebglEligible";

/** Home hero: full R3F vortex vs CSS vault + video — see `DynamicHeroShell`. */
export type HeroWebglDisplayMode = "pending" | "vortex" | "legacy";

/**
 * When `NEXT_PUBLIC_ENABLE_HERO_WEBGL` is `0`/`false`, always **legacy** (no hero Canvas).
 * Otherwise: **vortex** only if `useWebglEligible()` is true (WebGL2/WebGL + motion policy).
 */
export function useHeroWebglDisplayMode(): HeroWebglDisplayMode {
  const eligible = useWebglEligible();
  const disabled =
    typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_ENABLE_HERO_WEBGL === "0" || process.env.NEXT_PUBLIC_ENABLE_HERO_WEBGL === "false");
  if (disabled) return "legacy";
  if (eligible === null) return "pending";
  if (eligible === false) return "legacy";
  return "vortex";
}
