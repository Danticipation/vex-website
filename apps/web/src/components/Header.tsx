"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./Header.module.css";

const NAV_LINKS = [
  { href: "/inventory", label: "Exotics" },
  { href: "/#featured", label: "Featured" },
  { href: "/build", label: "Configure" },
  { href: "/#configure", label: "Spec preview" },
  { href: "/#pillars", label: "Why VEX" },
  { href: "/#services", label: "Services" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <Link href="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
        {!logoError ? (
          <Image
            src="/no-bg-logo.png"
            alt="VEX — Vortex Exotic Exchange"
            width={140}
            height={48}
            priority
            className={styles.logoImage}
            unoptimized
            onError={() => setLogoError(true)}
          />
        ) : null}
        <span className={styles.logoFallback} style={{ visibility: logoError ? "visible" : "hidden" }}>
          VEX
        </span>
      </Link>
      <nav className={styles.navDesktop} aria-label="Main">
        {NAV_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className={styles.navLink}>
            {label}
          </Link>
        ))}
      </nav>
      <div className={styles.actions}>
        <div className={styles.actionsDesktop}>
          {user ? (
            <>
              <Link href="/portal" className={styles.navLink}>
                Portal
              </Link>
              <button type="button" onClick={logout} className={styles.logout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.navLink}>
                Sign in
              </Link>
              <Link href="/register" className={styles.ctaSecondary}>
                Register
              </Link>
            </>
          )}
          <Link href="/#test-drive" className={styles.cta}>
            Book a test drive
          </Link>
        </div>
        <button
          type="button"
          className={styles.menuBtn}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className={menuOpen ? styles.burgerOpen : styles.burger} />
        </button>
      </div>
      {menuOpen ? (
        <>
          <button type="button" className={styles.backdrop} aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <div id="mobile-nav" className={styles.drawer}>
            <nav className={styles.drawerNav} aria-label="Mobile">
              {NAV_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} className={styles.drawerLink} onClick={() => setMenuOpen(false)}>
                  {label}
                </Link>
              ))}
              <Link href="/#test-drive" className={styles.drawerLink} onClick={() => setMenuOpen(false)}>
                Book a test drive
              </Link>
              {user ? (
                <>
                  <Link href="/portal" className={styles.drawerLink} onClick={() => setMenuOpen(false)}>
                    Portal
                  </Link>
                  <button type="button" className={styles.drawerBtn} onClick={() => { logout(); setMenuOpen(false); }}>
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className={styles.drawerLink} onClick={() => setMenuOpen(false)}>
                    Sign in
                  </Link>
                  <Link href="/register" className={styles.drawerCta} onClick={() => setMenuOpen(false)}>
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </>
      ) : null}
    </header>
  );
}
