"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getBillingUsage, inviteFirstCustomer, submitPilotNps } from "@/lib/api";

export default function DealerPilotDashboardPage() {
  const { token } = useAuth();
  const [usage, setUsage] = useState<{
    valuation: { dailyCapUsd: number; spentTodayUsd: number; remainingTodayUsd: number; callsToday: number };
    usageMonth: { quantity: number; amountUsd: number };
  } | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [nps, setNps] = useState(8);
  const [npsMessage, setNpsMessage] = useState("");
  const [msg, setMsg] = useState("");

  async function loadUsage() {
    if (!token) return setMsg("Login required");
    try {
      const data = await getBillingUsage(token);
      setUsage({ valuation: data.valuation, usageMonth: data.usageMonth });
      setMsg("Usage meter refreshed.");
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function invite() {
    if (!token) return setMsg("Login required");
    try {
      await inviteFirstCustomer(token, { email: inviteEmail });
      setMsg("First customer invited.");
      setInviteEmail("");
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function submitNps() {
    if (!token) return setMsg("Login required");
    try {
      await submitPilotNps(token, { rating: nps, message: npsMessage || "Dealer pilot feedback" });
      setMsg("NPS feedback submitted.");
      setNpsMessage("");
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Dealer Pilot Dashboard</h1>
      <p>Usage meter, first-customer invite, and NPS check-in.</p>

      <section style={{ marginTop: "1rem", padding: "1rem", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8 }}>
        <h2>Usage meter</h2>
        <button onClick={loadUsage}>Refresh usage</button>
        {usage && (
          <ul>
            <li>Valuation spend today: ${usage.valuation.spentTodayUsd.toFixed(2)} / ${usage.valuation.dailyCapUsd.toFixed(2)}</li>
            <li>Valuation calls today: {usage.valuation.callsToday}</li>
            <li>Usage this month: {usage.usageMonth.quantity} events (${usage.usageMonth.amountUsd.toFixed(2)})</li>
          </ul>
        )}
      </section>

      <section style={{ marginTop: "1rem", padding: "1rem", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8 }}>
        <h2>Invite first customer</h2>
        <input
          placeholder="customer@dealer.com"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
        />
        <button onClick={invite} style={{ marginLeft: "0.5rem" }}>
          Invite
        </button>
      </section>

      <section style={{ marginTop: "1rem", padding: "1rem", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8 }}>
        <h2>Pilot NPS prompt</h2>
        <input type="number" min={0} max={10} value={nps} onChange={(e) => setNps(Number(e.target.value))} />
        <textarea
          placeholder="What would make this indispensable?"
          value={npsMessage}
          onChange={(e) => setNpsMessage(e.target.value)}
          rows={3}
          style={{ display: "block", width: "100%", marginTop: "0.5rem" }}
        />
        <button onClick={submitNps} style={{ marginTop: "0.5rem" }}>
          Submit NPS
        </button>
      </section>

      {msg && <p style={{ marginTop: "1rem" }}>{msg}</p>}
    </main>
  );
}

