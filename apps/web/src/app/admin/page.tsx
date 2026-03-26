"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { getOwnerAdminOverview } from "@/lib/api";

type AdminOverview = {
  mrr: number;
  activeTenants: number;
  tenants: Array<{
    id: string;
    name: string;
    billingTier: string;
    stripeSubscriptionStatus: string | null;
    customDomain: string | null;
    createdAt: string;
  }>;
};

export default function AdminPage() {
  const { token, user, loading } = useAuth();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user || user.role !== "ADMIN") return;
    getOwnerAdminOverview(token).then(setData).catch((e) => setErr(e instanceof Error ? e.message : "Failed"));
  }, [token, user]);

  if (loading) return <main style={{ padding: "2rem" }}>Loading…</main>;
  if (!user || user.role !== "ADMIN") {
    return (
      <>
        <Header />
        <main style={{ padding: "2rem" }}>
          <h1>Forbidden</h1>
          <p>Admin role required.</p>
          <Link href="/portal">Back</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <h1 style={{ marginBottom: "1rem" }}>Owner Admin</h1>
        {err && <p style={{ color: "#f66" }}>{err}</p>}
        {data && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(180px,1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ background: "var(--bg-card)", borderRadius: 8, padding: "1rem" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>MRR (estimated)</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>${data.mrr.toLocaleString()}</div>
              </div>
              <div style={{ background: "var(--bg-card)", borderRadius: 8, padding: "1rem" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Active tenants</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{data.activeTenants}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Tenant</th><th>Tier</th><th>Status</th><th>Domain</th><th>Created</th>
                </tr>
              </thead>
              <tbody>
                {data.tenants.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{t.billingTier}</td>
                    <td>{t.stripeSubscriptionStatus ?? "—"}</td>
                    <td>{t.customDomain ?? "—"}</td>
                    <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </main>
    </>
  );
}
