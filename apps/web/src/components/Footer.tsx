import Link from "next/link";
import styles from "./Footer.module.css";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.left}>VEX</div>
        <p className={styles.center}>© {year} VEX Auto. All rights reserved. Private marketplace.</p>
        <div className={styles.right}>
          <Link href="/privacy" className={styles.link}>
            Privacy
          </Link>
          <Link href="/terms" className={styles.link}>
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
