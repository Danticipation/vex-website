import Link from "next/link";
import styles from "./TestDriveStrip.module.css";

export function TestDriveStrip() {
  return (
    <section id="test-drive" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Private access</p>
          <h2 className={styles.title}>Book a private viewing</h2>
          <p className={styles.subhead}>
            See the metal in person or take a guided walkaround — we schedule around your calendar, anywhere in the network.
          </p>
        </div>
        <div className={styles.ctas}>
          <Link href="/#contact" className={styles.primary}>
            Contact concierge
          </Link>
          <Link href="/inventory" className={styles.secondary}>
            Browse exotics
          </Link>
        </div>
      </div>
    </section>
  );
}
