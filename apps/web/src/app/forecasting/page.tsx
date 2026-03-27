"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { getForecastingMrr } from "@/lib/api";

export default function ForecastingPage() {
  const { token, loading } = useAuth();
  const [data, setData] = useState<Awaited<ReturnType<typeof getForecastingMrr>> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getForecastingMrr(token).then(setData).catch((e) => setErr(e instanceof Error ? e.message : "Failed"));
  }, [token]);

  if (loading) return <main style={{ padding: "2rem" }}>Loading...</main>;
  return (
    <>
      <Header />
      <main style={{ padding: "2rem", maxWidth: 960, margin: "0 auto" }}>
        <h1>Predictive $1M MRR Forecast</h1>
        {err && <p style={{ color: "#f66" }}>{err}</p>}
        {data && (
          <ul>
            <li>Current MRR: ${data.currentMrr.toLocaleString()}</li>
            <li>Projected 90d: ${data.projectedMrr90d.toLocaleString()}</li>
            <li>Projected 180d: ${data.projectedMrr180d.toLocaleString()}</li>
            <li>Confidence: {data.confidence}%</li>
          </ul>
        )}
      </main>
    </>
  );
}
