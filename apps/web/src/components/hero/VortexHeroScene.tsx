"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassKPI, LiquidMetalCTA, MagneticButton } from "@vex/ui";
import { VortexHeroScene as VortexHeroWebGL, type VortexHeroBrand } from "@vex/ui/3d";
import { useWebglEligible } from "@/hooks/useWebglEligible";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useApexHeroOrchestration } from "@/hooks/useApexHeroOrchestration";
import { HeroScrollHint } from "@/components/HeroScrollHint";
import { DEFAULT_PUBLIC_VEHICLE_GLB } from "@/lib/vehicle3d/defaults";
import styles from "../cinematic-hero-v2/CinematicHeroV2.module.css";

function cinematicModeFromEnv(): boolean {
  return (
    process.env.NEXT_PUBLIC_CINEMATIC_MODE === "1" || process.env.NEXT_PUBLIC_CINEMATIC_MODE === "true"
  );
}

function paintModeFromEnv(): "standard" | "cinematicLuxury" {
  const v = process.env.NEXT_PUBLIC_CINEMATIC_SHADERS_V3;
  if (v === "0" || v === "false") return "standard";
  return "cinematicLuxury";
}

function apexModeFromEnv(): boolean {
  const v = process.env.NEXT_PUBLIC_CINEMATIC_APEX;
  if (v === "0" || v === "false") return false;
  return v === "1" || v === "true";
}

/**
 * Elite full-viewport hero: `@vex/ui/3d` WebGL + magnetic CTAs + glass KPIs.
 * Loaded with `dynamic(..., { ssr: false })` from `DynamicHeroShell`.
 */
export default function VortexHeroScene() {
  const webgl = useWebglEligible();
  const reduced = usePrefersReducedMotion();
  const cinematicMode = cinematicModeFromEnv();
  const paintMode = paintModeFromEnv();
  const apexMode = apexModeFromEnv();
  const {
    scrollY,
    apexScrollBoost,
    apexScrollVelocity,
    formationProgress,
    burstFlashRef,
    triggerBurstFlash,
  } = useApexHeroOrchestration({ apexMode, heroId: "universe" });
  const [brand, setBrand] = useState<VortexHeroBrand | undefined>(undefined);

  useEffect(() => {
    const root = document.documentElement;
    const pickHex = (raw: string) => {
      const t = raw.trim();
      return /^#([0-9a-fA-F]{6})$/.test(t) ? t : undefined;
    };
    const bright = pickHex(getComputedStyle(root).getPropertyValue("--accent-bright"));
    const accent = pickHex(getComputedStyle(root).getPropertyValue("--accent"));
    setBrand({
      particleAccent: bright ?? "#e8d5a4",
      paintAccentHex: accent,
      environmentPreset: "city",
    });
  }, []);

  const show3d = webgl === true && !reduced;

  return (
    <section
      className={styles.hero}
      id="universe"
      aria-labelledby="dealer-hero-heading"
      data-apex-hero={apexMode ? "on" : "off"}
    >
      {show3d ? (
        <div className={styles.canvasWrap}>
          <VortexHeroWebGL
            scrollY={scrollY}
            glbUrl={DEFAULT_PUBLIC_VEHICLE_GLB}
            cinematicMode={cinematicMode}
            brand={brand}
            paintMode={paintMode}
            apexMode={apexMode}
            apexScrollBoost={apexScrollBoost}
            apexScrollVelocity={apexMode ? apexScrollVelocity : undefined}
            formationProgress={apexMode ? formationProgress : undefined}
            burstFlashRef={apexMode ? burstFlashRef : undefined}
          />
        </div>
      ) : (
        <div className={styles.fallback} aria-hidden />
      )}
      <div className={styles.overlay} />
      <div className={styles.shell} data-reveal>
        <div className={styles.copy}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>Vortex Exotic Exchange</span>
          </div>
          <p className={styles.kicker}>Elite digital presence · real-time 3D</p>
          <h1 className={styles.headline} id="dealer-hero-heading">
            <span className={styles.headlineAccent}>Configure your Vortex.</span>
            <span className={styles.headlineSecond}>Dealer OS with cinematic marketplace depth.</span>
          </h1>
          <p className={styles.subhead}>
            PBR showroom lighting, luxury motion, and tenant-scoped CRM — built for conversions, not templates.
          </p>
          <div className={styles.ctas}>
            <LiquidMetalCTA strength={0.42} onLiquidFlash={apexMode ? triggerBurstFlash : undefined}>
              <Link href="/build" className={styles.ctaPrimary}>
                Configure your Vortex
              </Link>
            </LiquidMetalCTA>
            <MagneticButton strength={0.35}>
              <Link href="/contact?intent=dealer" className={styles.ctaSecondary}>
                Join as dealer
              </Link>
            </MagneticButton>
          </div>
        </div>
        <div className={styles.cockpit}>
          <p className={styles.cockpitTitle}>Live signals</p>
          <p className={styles.cockpitSubtitle}>Glass KPIs — same token system as CRM dashboards.</p>
          <GlassKPI label="Configurator sessions" value="↑ 3× target" hint="Engagement vs baseline" accent="gold" />
          <GlassKPI label="Time on site" value="40%+" hint="Hero + 3D depth" accent="emerald" />
        </div>
      </div>
      <HeroScrollHint />
    </section>
  );
}
