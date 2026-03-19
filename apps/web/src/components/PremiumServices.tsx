import Link from "next/link";
import styles from "./PremiumServices.module.css";

const SERVICES = [
  {
    title: "Tailored financing",
    description: "Transparent rates, monthly payment calculator, and full cost breakdown before you commit.",
    href: "/inventory",
    icon: "£",
  },
  {
    title: "VIP concierge",
    description: "Full-service deal execution: vehicle selection, negotiation, shipping, and delivery handled for you.",
    href: "/portal/subscriptions",
    icon: "◆",
  },
  {
    title: "Worldwide delivery",
    description: "Open or enclosed transport, real-time quotes, and live tracking from pickup to your door.",
    href: "/checkout",
    icon: "◈",
  },
  {
    title: "Custom upgrades",
    description: "Styling, restyling, paint, wrap, interior, and detailing—add at checkout with live pricing.",
    href: "/build",
    icon: "◇",
  },
];

export function PremiumServices() {
  return (
    <section id="services" className={styles.section}>
      <h2 className={styles.title}>Our premium services</h2>
      <div className={styles.grid}>
        {SERVICES.map((s) => (
          <div key={s.title} className={styles.card}>
            <span className={styles.icon} aria-hidden>{s.icon}</span>
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
