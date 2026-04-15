export default function HowItWorksPage() {
  return (
    <main className="section">
      <div className="sectionHeading">How It Works</div>
      <p className="sectionIntro">
        Our private marketplace is designed for buyers and sellers who expect discretion, verification, and white-glove service.
      </p>
      <div className="grid-3">
        <article className="feature-card">
          <p className="feature-number">01</p>
          <h2 className="feature-title">Apply for Access</h2>
          <p className="feature-copy">
            Submit your buyer or seller profile. We verify identity and financial qualification before granting entry.
          </p>
        </article>
        <article className="feature-card">
          <p className="feature-number">02</p>
          <h2 className="feature-title">Browse or List</h2>
          <p className="feature-copy">
            Access our private inventory of authenticated exotic and luxury vehicles, or list your own with concierge support.
          </p>
        </article>
        <article className="feature-card">
          <p className="feature-number">03</p>
          <h2 className="feature-title">Close the Deal</h2>
          <p className="feature-copy">
            Our team facilitates inspection, transport, and secure transfer once the right buyer and vehicle connect.
          </p>
        </article>
      </div>
    </main>
  );
}
