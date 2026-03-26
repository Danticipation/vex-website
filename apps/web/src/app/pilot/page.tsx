"use client";

import { useState } from "react";
import { applyPilot } from "@/lib/api";

export default function PilotPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dealership, setDealership] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");

  async function submit() {
    try {
      const out = await applyPilot({ name, email, dealership, phone: phone || undefined });
      setMsg(`Application submitted. Lead ${out.leadId} (${out.status}).`);
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>30-day Enterprise Pilot</h1>
      <p>Apply for a free pilot. First 20 qualified applications are auto-approved.</p>
      <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Business email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Dealership name" value={dealership} onChange={(e) => setDealership(e.target.value)} />
      <input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <div style={{ marginTop: "1rem" }}>
        <button onClick={submit}>Apply now</button>
      </div>
      {msg && <p style={{ marginTop: "1rem" }}>{msg}</p>}
    </main>
  );
}
