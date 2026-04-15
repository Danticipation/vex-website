import Link from "next/link";
import { FEATURED_VEHICLES } from "@/lib/vehicles";
import { VehicleCard } from "@/components/VehicleCard";

const contactPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE || "";
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";
const heroVideoUrl = process.env.NEXT_PUBLIC_HERO_VIDEO_URL || "";

export default function HomePage() {
  return (
    <main>
      <section className="hero-shell">
        {heroVideoUrl ? (
          <video className="hero-video" autoPlay muted loop playsInline src={heroVideoUrl} />
        ) : null}
        <div className="hero-overlay" />
        <div className="hero-inner">
          <p className="hero-eyebrow">Private marketplace</p>
          <h1 className="hero-headline">The Private Market for<br />Exceptional Vehicles</h1>
          <p className="hero-copy">
            Curated exotic and luxury automobiles. Verified sellers. Qualified buyers only.
          </p>
          <div className="hero-actions">
            <Link href="/inventory" className="btn btnPrimary">
              Browse Inventory
            </Link>
            <Link href="/contact" className="btn btnGhost">
              List Your Vehicle
            </Link>
          </div>
          <div className="scroll-indicator">Scroll to discover</div>
        </div>
      </section>

      <section className="trust-bar">
        <span>Verified Sellers</span>
        <span>Private Transactions</span>
        <span>Exotic & Ultra-Luxury</span>
        <span>Invite Only</span>
      </section>

      <section className="section">
        <h2 className="sectionHeading">Featured Collection</h2>
        <p className="sectionIntro">
          A hand-picked selection of the most exclusive vehicles available for private acquisition.
        </p>
        <div className="grid-3">
          {FEATURED_VEHICLES.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      </section>

      <section className="section" id="how-it-works">
        <h2 className="sectionHeading">How It Works</h2>
        <div className="grid-3">
          <article className="feature-card fade-up">
            <p className="feature-number">01</p>
            <h3 className="feature-title">Apply for Access</h3>
            <p className="feature-copy">
              Submit your buyer or seller profile. We verify identity and financial qualification.
            </p>
          </article>
          <article className="feature-card fade-up">
            <p className="feature-number">02</p>
            <h3 className="feature-title">Browse or List</h3>
            <p className="feature-copy">
              Access our private inventory of authenticated exotic and luxury vehicles.
            </p>
          </article>
          <article className="feature-card fade-up">
            <p className="feature-number">03</p>
            <h3 className="feature-title">Close the Deal</h3>
            <p className="feature-copy">
              Our concierge team facilitates inspection, transport, and secure transfer.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="feature-card" style={{ textAlign: "center" }}>
          <h2 className="sectionHeading">Ready to Buy or Sell?</h2>
          <p className="sectionIntro">
            Speak directly with our acquisition team. No bots, no middlemen.
          </p>
          <div style={{ margin: "2rem 0" }}>
            {contactPhone ? (
              <Link href={`tel:${contactPhone.replace(/\D/g, "")}`} className="btn btnGhost" style={{ fontSize: "2rem", fontFamily: "var(--font-display)", padding: "1rem 2rem" }}>
                {contactPhone}
              </Link>
            ) : (
              <p className="feature-copy">Phone contact is not configured.</p>
            )}
          </div>
          {contactEmail ? (
            <p className="feature-copy">
              <Link href={`mailto:${contactEmail}`} className="navLink">
                {contactEmail}
              </Link>
            </p>
          ) : null}
          <Link href="/contact" className="btn btnPrimary">
            Or submit an inquiry
          </Link>
        </div>
      </section>
    </main>
  );
}
