"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { listErpOrders } from "@/lib/api";
import { VexDataTable, VexPageHeader, VexPanel, VexTrustBadge } from "@vex/ui";

export default function OrdersPage() {
  const { token } = useAuth();
  const [data, setData] = useState<{ items: unknown[] } | null>(null);

  useEffect(() => {
    if (!token) return;
    listErpOrders(token)
      .then(setData)
      .catch(() => setData({ items: [] }));
  }, [token]);

  const items = (data?.items ?? []) as {
    id: string;
    appraisalId: string;
    status: string;
    totalAmount: number | null;
    createdAt: string;
  }[];
  const closedDeals = items.filter((o) => o.status === "CONFIRMED" || o.status === "FULFILLED");

  return (
    <main className="crm-shell">
      <VexPageHeader title="Orders & Invoices" subtitle="Closed deals and invoice-ready records." />
      <VexPanel style={{ marginBottom: "1rem", padding: "0.8rem", color: "var(--text-muted)" }}>
        Create ERP orders from the Deal Desk appraisal detail page using the <strong>Create Order</strong> action.
      </VexPanel>
      <VexDataTable>
        <thead>
          <tr>
            <th>ID</th>
            <th>Invoice</th>
            <th>Appraisal</th>
            <th>Status</th>
            <th>Total</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {closedDeals.map((o) => (
            <tr key={o.id}>
              <td>{o.id.slice(0, 8)}…</td>
              <td>INV-{o.id.slice(0, 8).toUpperCase()}</td>
              <td>{o.appraisalId.slice(0, 8)}…</td>
              <td><VexTrustBadge>{o.status}</VexTrustBadge></td>
              <td>{o.totalAmount != null ? `$${o.totalAmount.toLocaleString("en-US")}` : "—"}</td>
              <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              <td><Link href={`/orders/${o.id}`}>View</Link></td>
            </tr>
          ))}
        </tbody>
      </VexDataTable>
      {closedDeals.length === 0 && <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>No closed deals yet.</p>}
    </main>
  );
}
