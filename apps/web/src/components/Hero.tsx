"use client";

import Link from "next/link";
import { useReveal } from "@/hooks/useReveal";
import { ExoticVisualization } from "@/components/ExoticVisualization";
import styles from "./Hero.module.css";

export function Hero() {
  const revealRef = useReveal<HTMLDivElement>();
  return (
    <section className={styles.hero}>
      <div className={styles.ambient} aria-hidden />
      <div className={styles.overlay} />
      <div ref={revealRef} className={styles.shell} data-reveal>
        <div className={styles.copy}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>The Exchange</span>
            <span className={styles.lot}>LOT SERIES · 2026</span>
          </div>
          <h1 className={styles.headline}>
            <span className={styles.headlineGradient}>Rare metal.</span>
            <br />
            <span className={styles.headlineSolid}>No compromise.</span>
          </h1>
          <p className={styles.subhead}>
            A luxury auction-grade platform for exotic vehicles — curated lots, transparent bids, and delivery handled like the asset
            depends on it. Because it does.
          </p>
          <div className={styles.ctas}>
            <Link href="/inventory" className={styles.ctaPrimary}>
              View catalog
            </Link>
            <Link href="/#configure" className={styles.ctaSecondary}>
              Configure a build
            </Link>
          </div>
          <dl className={styles.stats}>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Reserve</dt>
              <dd className={styles.statValue}>Private</dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Provenance</dt>
              <dd className={styles.statValue}>Verified</dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>Logistics</dt>
              <dd className={styles.statValue}>Enclosed</dd>
            </div>
          </dl>
        </div>
        <div className={styles.visualWrap}>
          <div className={styles.visualFrame} aria-hidden />
          <div className={styles.visualInner}>
            <ExoticVisualization />
          </div>
        </div>
      </div>
    </section>
  );
}
