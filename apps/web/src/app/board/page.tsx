"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { getBoardPack } from "@/lib/api";

export default function BoardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<Awaited<ReturnType<typeof getBoardPack>> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getBoardPack(token).then(setData).catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"));
  }, [token]);

  return (
    <>
      <Header />
      <main style={{ padding: "2rem", maxWidth: 980, margin: "0 auto" }}>
        <h1>Board Portal</h1>
        {err && <p style={{ color: "#f66" }}>{err}</p>}
        {data && (
          <>
            <p>{data.quarter} | MRR ${data.mrr.toLocaleString()} | Burn ${data.burnUsd.toLocaleString()}</p>
            <ul>{data.keyRisks.map((x) => <li key={x}>{x}</li>)}</ul>
          </>
        )}
      </main>
    </>
  );
}
