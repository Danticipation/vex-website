"use client";

import Link from "next/link";
import { useReveal } from "@/hooks/useReveal";
import styles from "./Hero.module.css";

export function Hero() {
  const revealRef = useReveal<HTMLDivElement>();
  return (
    <section className={styles.hero}>
      <div className={styles.overlay} />
      <div ref={revealRef} className={styles.content} data-reveal>
        <p className={styles.eyebrow}>For The Relentless Few</p>
        <h1 className={styles.headline}>Own The Room Before You Arrive</h1>
        <p className={styles.subhead}>
          The elite marketplace for people who never settle. Build your spec, structure the deal, ship to your door, and move in silence.
        </p>
        <div className={styles.ctas}>
          <Link href="/inventory" className={styles.ctaPrimary}>
            Enter The Vault
          </Link>
          <Link href="/build" className={styles.ctaSecondary}>
            Build A Statement
          </Link>
        </div>
        <div className={styles.metrics}>
          <div><strong>24/7</strong><span>Concierge-level flow</span></div>
          <div><strong>2-Click</strong><span>Deal clarity</span></div>
          <div><strong>End-to-End</strong><span>Self-service power</span></div>
        </div>
      </div>
    </section>
  );
}
