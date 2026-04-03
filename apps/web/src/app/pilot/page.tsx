"use client";

import { useState } from "react";
import { onboardPilotSelfServe } from "@/lib/api";

export default function PilotPage() {
  const [dealerName, setDealerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tier, setTier] = useState<"STARTER" | "PRO" | "ENTERPRISE">("STARTER");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [phone, setPhone] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMsg("");
    try {
      const out = await onboardPilotSelfServe({
        email,
        dealerName,
        password,
        tier,
        interval,
        captchaToken: "dev-placeholder",
        customDomain: customDomain || undefined,
        enableDemoData: true,
      });
      if (out.checkout?.url) {
        window.location.href = out.checkout.url;
        return;
      }
      setMsg(
        `Pilot tenant created (${out.tenantId}). Stripe checkout is not configured in this environment; continue in CRM login.`
      );
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Self-serve Pilot Onboarding</h1>
      <p>Complete the form, continue to Stripe Checkout, then sign in to CRM.</p>
      <input placeholder="Dealership name" value={dealerName} onChange={(e) => setDealerName(e.target.value)} />
      <input placeholder="Business email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        <select value={tier} onChange={(e) => setTier(e.target.value as "STARTER" | "PRO" | "ENTERPRISE")}>
          <option value="STARTER">Starter</option>
          <option value="PRO">Pro</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
        <select value={interval} onChange={(e) => setInterval(e.target.value as "monthly" | "yearly")}>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input
        placeholder="Custom domain (optional)"
        value={customDomain}
        onChange={(e) => setCustomDomain(e.target.value)}
      />
      <div style={{ marginTop: "1rem" }}>
        <button onClick={submit} disabled={loading}>
          {loading ? "Starting…" : "Start pilot"}
        </button>
      </div>
      {msg && <p style={{ marginTop: "1rem" }}>{msg}</p>}
    </main>
  );
}
