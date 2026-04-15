import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="section">
      <h1 className="sectionHeading">Terms</h1>
      <p className="sectionIntro">
        These terms govern your use of VEX Auto’s private marketplace. Please contact us for full contract details and membership terms.
      </p>
      <div className="feature-card">
        <h2 className="feature-title">Private marketplace access</h2>
        <p className="feature-copy">
          Access is granted to verified buyers and sellers only. Membership requires validation of identity and asset credentials.
        </p>
      </div>
      <Link href="/contact" className="btn btnPrimary" style={{ marginTop: "2rem" }}>
        Contact us
      </Link>
    </main>
  );
}
