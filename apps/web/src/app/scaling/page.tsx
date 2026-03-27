"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { createMarketingCampaign, getScalingOverview, runMarketingCampaign } from "@/lib/api";

export default function ScalingPage() {
  const { token, user, loading } = useAuth();
  const [data, setData] = useState<Awaited<ReturnType<typeof getScalingOverview>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    if (!token || user?.role !== "GROUP_ADMIN") return;
    getScalingOverview(token).then(setData).catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }, [token, user]);

  async function launchCampaign() {
    if (!token) return;
    setLaunching(true);
    setError(null);
    try {
      const created = await createMarketingCampaign(
        {
          name: "Hypergrowth partner drip",
          audience: "at_risk",
          channels: ["email"],
          seoLandingSlug: "dealer-growth-partner-network",
          variants: [{ id: "v1", name: "Default", channel: "email", weight: 100, subject: "Unlock partner pipeline", body: "Activate partner referrals this week." }],
        },
        token
      );
      await runMarketingCampaign(created.campaignId, token);
      const refreshed = await getScalingOverview(token);
      setData(refreshed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to launch campaign");
    } finally {
      setLaunching(false);
    }
  }

  if (loading) return <main style={{ padding: "2rem" }}>Loading...</main>;
  return (
    <>
      <Header />
      <main style={{ padding: "2rem", maxWidth: 980, margin: "0 auto" }}>
        <h1>$100k Scaling Dashboard</h1>
        <p>Owner/group-admin acquisition and partner economics dashboard.</p>
        {user?.role !== "GROUP_ADMIN" && <p style={{ color: "#f66" }}>GROUP_ADMIN access required.</p>}
        {error && <p style={{ color: "#f66" }}>{error}</p>}
        {data && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(200px,1fr))", gap: "1rem" }}>
            <div>MRR: ${data.mrr.toLocaleString()}</div>
            <div>Target MRR: ${data.targetMrr.toLocaleString()}</div>
            <div>Marketing conversions: ${data.marketingConversionUsd.toFixed(2)}</div>
            <div>Partner spend: ${data.partnerSpendUsd.toFixed(2)} ({data.partnerSpendPctOfMrr.toFixed(2)}%)</div>
            <div>Projection to $100k: {data.projectionTo100kMonths} months</div>
            <div>Generated: {new Date(data.generatedAt).toLocaleString()}</div>
          </div>
        )}
        <button type="button" onClick={launchCampaign} disabled={launching || !token || user?.role !== "GROUP_ADMIN"} style={{ marginTop: "1rem" }}>
          {launching ? "Launching..." : "Launch Campaign"}
        </button>
      </main>
    </>
  );
}
