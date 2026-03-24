"use client";

import { useReveal } from "@/hooks/useReveal";
import styles from "./ExoticPillars.module.css";

const PILLARS = [
  {
    title: "Provenance you can stand behind",
    body: "Company consignment and vetted private listings — documentation, history, and condition surfaced before you wire a deposit.",
  },
  {
    title: "Built for collectors, not crowds",
    body: "From one-off specs to allocation-grade builds — the flow stays quiet, fast, and precise, whether you’re adding or upgrading.",
  },
  {
    title: "Logistics as polished as the paint",
    body: "Enclosed transport, white-glove handoff, and live tracking so your rare metal arrives exactly as promised.",
  },
] as const;

export function ExoticPillars() {
  const ref = useReveal<HTMLElement>();
  return (
    <section id="pillars" ref={ref} className={styles.section} data-reveal>
      <div className={styles.header}>
        <p className={styles.eyebrow}>The exotic standard</p>
        <h2 className={styles.title}>Where rare metal meets real execution</h2>
        <p className={styles.lede}>
          VEX is a digital exchange for exotic vehicles — not mass-market inventory. Every touchpoint is tuned for people who buy on instinct
          and verify on detail.
        </p>
      </div>
      <ul className={styles.grid}>
        {PILLARS.map((p) => (
          <li key={p.title} className={styles.card}>
            <h3 className={styles.cardTitle}>{p.title}</h3>
            <p className={styles.cardBody}>{p.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
