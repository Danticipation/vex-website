"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { getInvestorLiveV2, getLiquiditySimulation } from "@/lib/api";

export default function ExitRoomPage() {
  const { token } = useAuth();
  const [live, setLive] = useState<Awaited<ReturnType<typeof getInvestorLiveV2>> | null>(null);
  const [liq, setLiq] = useState<Awaited<ReturnType<typeof getLiquiditySimulation>> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([getInvestorLiveV2(token), getLiquiditySimulation(token)])
      .then(([a, b]) => {
        setLive(a);
        setLiq(b);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load exit room"));
  }, [token]);

  return (
    <>
      <Header />
      <main style={{ padding: "2rem", maxWidth: 980, margin: "0 auto" }}>
        <h1>Investor & Exit Data Room v3</h1>
        {err && <p style={{ color: "#f66" }}>{err}</p>}
        {live && <p>Live MRR: ${live.liveMetrics.mrr.toLocaleString()} | Growth: {live.liveMetrics.growthMoM}%</p>}
        {liq && (
          <ul>
            <li>Acquisition EV: ${liq.acquisition.estimatedEnterpriseValue.toLocaleString()} ({liq.acquisition.monthsToTarget} mo)</li>
            <li>IPO EV: ${liq.ipo.estimatedEnterpriseValue.toLocaleString()} ({liq.ipo.monthsToTarget} mo)</li>
          </ul>
        )}
      </main>
    </>
  );
}
