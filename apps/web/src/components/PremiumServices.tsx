import Link from "next/link";
import styles from "./PremiumServices.module.css";

const SERVICES = [
  {
    title: "Instant appraisals",
    description: "Rule-based trade-in estimates in seconds — perfect for showroom conversations and faster closes.",
    href: "/appraisal",
    icon: "◎",
  },
  {
    title: "Tailored financing",
    description: "Structured for exotic collateral — transparent rates, clear terms, and full payment visibility before you commit.",
    href: "/inventory",
    icon: "$",
  },
  {
    title: "VIP concierge",
    description: "Private-office execution: sourcing, negotiation, enclosed transport, and delivery coordinated around your calendar.",
    href: "/portal/subscriptions",
    icon: "◆",
  },
  {
    title: "Worldwide delivery",
    description: "Open or enclosed transport for high-value metal — quotes, insurance, and tracking from collection to your door.",
    href: "/checkout",
    icon: "◈",
  },
  {
    title: "Bespoke upgrades",
    description: "Paint, wrap, interior, and detailing — specified at checkout with live pricing and craft partners you can trust.",
    href: "/build",
    icon: "◇",
  },
];

export function PremiumServices() {
  return (
    <section id="services" className={styles.section}>
      <h2 className={styles.title}>Premium services</h2>
      <p className={styles.subtitle}>Built for exotic ownership — not ordinary retail</p>
      <div className={styles.grid}>
        {SERVICES.map((s) => (
          <div key={s.title} className={styles.card}>
            <span className={styles.icon} aria-hidden>
              {s.icon}
            </span>
            <h3 className={styles.cardTitle}>{s.title}</h3>
            <p className={styles.desc}>{s.description}</p>
            <Link href={s.href} className={styles.link}>
              Learn more →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
