"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EnterpriseWidgetCard } from "@vex/ui";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useReveal } from "@/hooks/useReveal";
import { HeroCinematicLayer } from "@/components/HeroCinematicLayer";
import { HeroScrollHint } from "@/components/HeroScrollHint";
import styles from "./DealerProgramHero.module.css";

const HeroParticleField = dynamic(
  () => import("./HeroParticleField").then((m) => ({ default: m.HeroParticleField })),
  { ssr: false, loading: () => null },
);

function VaultNeonCursorSheen() {
  const reduced = usePrefersReducedMotion();
  const [pos, setPos] = useState({ x: 50, y: 42 });
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setPos({
          x: (e.clientX / Math.max(window.innerWidth, 1)) * 100,
          y: (e.clientY / Math.max(window.innerHeight, 1)) * 100,
        });
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, [reduced]);
  if (reduced) return null;
  return (
    <div
      className={styles.neonTrail}
      aria-hidden
      style={{
        background: `radial-gradient(circle 32% at ${pos.x}% ${pos.y}%, rgba(160, 32, 240, 0.12), transparent 58%)`,
      }}
    />
  );
}

export function DealerProgramHero() {
  const revealRef = useReveal<HTMLDivElement>();

  return (
    <section className={styles.hero} id="universe" aria-labelledby="dealer-hero-heading">
      <HeroCinematicLayer />
      <div className={styles.ambient} aria-hidden />
      <VaultNeonCursorSheen />
      <HeroParticleField />
      <div className={styles.overlay} />
      <div className={styles.vignette} aria-hidden />
      <div className={styles.sheen} aria-hidden />
      <div ref={revealRef} className={styles.shell} data-reveal>
        <div className={styles.copy}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>Dealer program</span>
            <span className={styles.lot}>Integrated marketplace</span>
          </div>
          <p className={styles.kicker}>The new operating system for automotive distribution &amp; management</p>
          <h1 className={styles.headline} id="dealer-hero-heading">
            <span className={styles.headlineAccent}>Full-service dealer OS.</span>
            <span className={styles.headlineSecond}>Cinematic marketplace built in.</span>
          </h1>
          <p className={styles.subhead}>
            White-labeled DMS depth — inventory, CRM, payroll, accounting, integrations, and AI-driven operations — with a
            BaT-grade public engine for listings, consignment, and commissioning.
          </p>
          <div className={styles.ctas}>
            <Link href="/contact?intent=dealer" className={styles.ctaPrimary} data-magnetic="true">
              Join as dealer
            </Link>
            <Link href="/inventory" className={styles.ctaSecondary} data-magnetic="true">
              Shop exotic inventory
            </Link>
          </div>
          <p className={styles.caption}>
            Primary value: enterprise program management. Sublet: consumer-grade discovery, auctions, and configurator-led
            deals — routed into your tenant workspace.
          </p>
        </div>
        <div className={styles.cockpit}>
          <div className={styles.cockpitInner}>
            <p className={styles.cockpitTitle}>Live cockpit preview</p>
            <p className={styles.cockpitSubtitle}>Autonomous DMS signals your dealers see inside VEX.</p>
            <EnterpriseWidgetCard label="Payroll run" value="Queued · 06:00 ET" meta="Human approval on exceptions only" accent="gold" />
            <EnterpriseWidgetCard label="GL reconciliation" value="98.4% matched" meta="2 items flagged for review" accent="cyan" />
            <EnterpriseWidgetCard label="Inventory optimizer" value="+14 turn days" meta="Across 3 rooftops" accent="neutral" />
            <EnterpriseWidgetCard label="Integration hub" value="12 connectors" meta="DMS · CRM · accounting · leads" accent="neutral" />
          </div>
        </div>
      </div>
      <HeroScrollHint />
    </section>
  );
}
