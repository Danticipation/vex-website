export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 840, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Privacy Policy</h1>
      <p>
        Vex stores tenant data in isolated records, encrypts data at rest via managed Postgres defaults,
        and logs audit events for compliance and security monitoring.
      </p>
      <p>
        We retain billing and audit records for up to 7 years for operational and compliance purposes.
      </p>
    </main>
  );
}
