"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { getSeriesADataRoom, simulateTermSheet } from "@/lib/api";

export default function SeriesAPage() {
  const { token, user, loading } = useAuth();
  const [room, setRoom] = useState<Awaited<ReturnType<typeof getSeriesADataRoom>> | null>(null);
  const [term, setTerm] = useState<Awaited<ReturnType<typeof simulateTermSheet>> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token || (user?.role !== "ADMIN" && user?.role !== "GROUP_ADMIN")) return;
    getSeriesADataRoom(token)
      .then(setRoom)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load Series A room"));
  }, [token, user]);

  async function runSimulation() {
    if (!token) return;
    setErr(null);
    try {
      const result = await simulateTermSheet(
        { valuationPreMoneyUsd: 40000000, raiseAmountUsd: 5000000, optionPoolPct: 10 },
        token
      );
      setTerm(result);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Simulation failed");
    }
  }

  if (loading) return <main style={{ padding: "2rem" }}>Loading...</main>;
  return (
    <>
      <Header />
      <main style={{ padding: "2rem", maxWidth: 980, margin: "0 auto" }}>
        <h1>Series A Closing Machine</h1>
        {err && <p style={{ color: "#f66" }}>{err}</p>}
        {room && (
          <>
            <p>MRR: ${room.mrr.toLocaleString()} | Growth MoM: {room.growthMoM}% | Runway: {room.runwayMonths} months</p>
            <ul>{room.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
          </>
        )}
        <button type="button" onClick={runSimulation} disabled={!token}>
          Simulate Term Sheet
        </button>
        {term && (
          <div style={{ marginTop: "1rem" }}>
            <p>Pre-money: ${term.valuationPreMoneyUsd.toLocaleString()}</p>
            <p>Raise: ${term.raiseAmountUsd.toLocaleString()}</p>
            <p>Investor ownership: {term.investorOwnershipPct}%</p>
            <p>Founder dilution: {term.founderDilutionPct}%</p>
          </div>
        )}
      </main>
    </>
  );
}
