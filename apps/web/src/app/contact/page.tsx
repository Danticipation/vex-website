"use client";

import { Header } from "@/components/Header";

export default function ContactPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.25rem 4rem" }}>
        <h1 style={{ marginBottom: "0.75rem" }}>Contact VEX</h1>
        <p style={{ marginBottom: "1.5rem", color: "var(--text-secondary)" }}>
          Reach our team for sales, partnerships, or support. We typically respond within one business day.
        </p>

        <section
          style={{
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: "1.25rem",
            background: "rgba(255,255,255,0.02)",
            display: "grid",
            gap: "0.75rem",
          }}
        >
          <p>
            <strong>Email:</strong> <a href="mailto:team@vex.example">team@vex.example</a>
          </p>
          <p>
            <strong>Sales:</strong> <a href="mailto:sales@vex.example">sales@vex.example</a>
          </p>
          <p>
            <strong>Partnerships:</strong> <a href="mailto:partners@vex.example">partners@vex.example</a>
          </p>
          <p>
            <strong>Support:</strong> <a href="mailto:support@vex.example">support@vex.example</a>
          </p>
        </section>
      </main>
    </>
  );
}
