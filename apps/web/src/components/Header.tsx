"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import styles from "./Header.module.css";

const NAV_LINKS = [
  { href: "/inventory", label: "Inventory" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/sell", label: "Sell Your Car" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.left}>
        <Link href="/" className={styles.brand} onClick={() => setMenuOpen(false)}>
          VEX
        </Link>
      </div>

      <nav className={styles.navDesktop} aria-label="Primary navigation">
        {NAV_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className={styles.navLink} onClick={() => setMenuOpen(false)}>
            {label}
          </Link>
        ))}
      </nav>

      <div className={styles.right}>
        <Link href="/contact" className={styles.cta} onClick={() => setMenuOpen(false)}>
          Request Access
        </Link>
        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((state) => !state)}
        >
          <span className={menuOpen ? styles.burgerOpen : styles.burger} />
        </button>
      </div>

      {menuOpen ? (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileLinks}>
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                {label}
              </Link>
            ))}
            <Link href="/contact" className={styles.mobileCta} onClick={() => setMenuOpen(false)}>
              Request Access
            </Link>
          </div>
          <button type="button" className={styles.mobileOverlay} onClick={() => setMenuOpen(false)} aria-label="Close menu" />
        </div>
      ) : null}
    </header>
  );
}
