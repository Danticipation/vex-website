"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { listErpInvoices } from "@/lib/api";
import { VexDataTable, VexPageHeader, VexTrustBadge } from "@vex/ui";

export default function InvoicesPage() {
  const { token } = useAuth();
  const [data, setData] = useState<{ items: unknown[] } | null>(null);

  useEffect(() => {
    if (!token) return;
    listErpInvoices(token)
      .then(setData)
      .catch(() => setData({ items: [] }));
  }, [token]);

  const items = (data?.items ?? []) as Array<{
    invoiceNumber: string;
    orderId: string;
    appraisalId: string;
    status: string;
    amountUsd: number | null;
    issuedAt: string;
  }>;

  return (
    <main className="crm-shell">
      <VexPageHeader title="Invoices Ledger" subtitle="Tenant-scoped accounting records from ERP orders." />
      <VexDataTable>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Order</th>
            <th>Appraisal</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Issued</th>
          </tr>
        </thead>
        <tbody>
          {items.map((invoice) => (
            <tr key={invoice.invoiceNumber}>
              <td>{invoice.invoiceNumber}</td>
              <td><Link href={`/orders/${invoice.orderId}`}>{invoice.orderId.slice(0, 8)}…</Link></td>
              <td>{invoice.appraisalId.slice(0, 8)}…</td>
              <td><VexTrustBadge>{invoice.status}</VexTrustBadge></td>
              <td>{invoice.amountUsd != null ? `$${invoice.amountUsd.toLocaleString("en-US")}` : "—"}</td>
              <td>{new Date(invoice.issuedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </VexDataTable>
      {items.length === 0 && <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>No invoices yet.</p>}
    </main>
  );
}
