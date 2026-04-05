"use client";

import dynamic from "next/dynamic";
import { DealerProgramHero } from "@/components/landing/DealerProgramHero";
import { useHeroWebglDisplayMode } from "@/hooks/useHeroWebglDisplayMode";

const VortexHeroScene = dynamic(
  () => import("./ApexHeroScene"),
  {
    ssr: false,
    loading: () => (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: "#0a0a0a" }}
        aria-hidden
      />
    ),
  },
);

/**
 * SSR-safe: resolves WebGL eligibility + `NEXT_PUBLIC_ENABLE_HERO_WEBGL`.
 * **vortex** → `ApexHeroScene` (R3F car, ≤512 particle budget in `@vex/ui`, bloom/god-rays).
 * **legacy** → `DealerProgramHero` (CSS vault sheen + optional video + neon sheen).
 */
export function DynamicHeroShell() {
  const mode = useHeroWebglDisplayMode();

  if (mode === "legacy") {
    return <DealerProgramHero />;
  }

  if (mode === "pending") {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: "#0a0a0a" }}
        aria-hidden
      />
    );
  }

  return <VortexHeroScene />;
}
