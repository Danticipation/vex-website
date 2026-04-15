import Link from "next/link";

export default function SellPage() {
  return (
    <main className="section">
      <div className="sectionHeading">Sell Your Car</div>
      <p className="sectionIntro">
        List your exceptional vehicle with private access, verified buyers, and a dedicated acquisition team.
      </p>
      <div className="grid-2" style={{ gap: "2rem" }}>
        <div className="feature-card">
          <h2 className="feature-title">Exclusive Seller Experience</h2>
          <p className="feature-copy">
            We curate your listing, qualify every buyer, and coordinate secure inspections and delivery.
          </p>
          <ul style={{ color: "var(--color-silver)", marginTop: "1.5rem", lineHeight: 1.9 }}>
            <li>Invite-only listing visibility</li>
            <li>Verified buyers and private negotiations</li>
            <li>Concierge inspection, transport, and escrow</li>
          </ul>
        </div>
        <div className="feature-card">
          <h2 className="feature-title">Start Your Submission</h2>
          <p className="feature-copy">
            Provide your vehicle details and the acquisition team will reach out with a bespoke selling strategy.
          </p>
          <Link href="/contact" className="btn btnPrimary" style={{ display: "inline-flex", marginTop: "1.5rem" }}>
            Submit your vehicle
          </Link>
        </div>
      </div>
    </main>
  );
}
