"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { addAppraisalToInventory, createInventoryItem, getInventory, listAppraisals } from "@/lib/api";
import { getInventory, getMarketListings } from "@/lib/api";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";

export default function InventoryPage() {
  const { token } = useAuth();
  const [data, setData] = useState<{ items: unknown[] } | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [location, setLocation] = useState("");
  const [pendingAppraisals, setPendingAppraisals] = useState<
    Array<{ id: string; value: number | null; status: string; createdAt: string }>
  >([]);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [market, setMarket] = useState<{ items: unknown[] } | null>(null);

  useEffect(() => {
    if (!token) return;
    getInventory(token)
      .then(setData)
      .catch(() => setData({ items: [] }));
    listAppraisals(token)
      .then((r) => {
        const items = (r.items ?? []) as Array<{ id: string; value: number | null; status: string; createdAt: string }>;
        setPendingAppraisals(
          items
            .filter((a) => String(a.status).toLowerCase() !== "closed")
            .slice(0, 8)
        );
      })
      .catch(() => setPendingAppraisals([]));
  }, [token]);

  const items = (data?.items ?? []) as {
    id: string;
    vehicleId: string;
    source: string;
    listPrice: number;
    status: string;
    location: string | null;
    vehicle?: { make: string; model: string; year: number };
  }[];

  const refresh = () => {
    if (!token) return;
    getInventory(token)
      .then(setData)
      .catch(() => setData({ items: [] }));
  };

  const onCreate = async () => {
    if (!token || !vehicleId || !listPrice) return;
    await createInventoryItem(token, {
      source: "COMPANY",
      vehicleId,
      listPrice: Number(listPrice),
      location: location || undefined,
    });
    setVehicleId("");
    setListPrice("");
    setLocation("");
    refresh();
  };

  const onAddFromAppraisal = async (appraisalId: string, appraisalValue: number | null) => {
    if (!token) return;
    setActionMsg(null);
    try {
      const result = await addAppraisalToInventory(token, appraisalId, {
        listPrice: appraisalValue ?? undefined,
      });
      setActionMsg(`Added appraisal ${appraisalId.slice(0, 8)}… to inventory (${result.inventoryId.slice(0, 8)}…).`);
      refresh();
      setPendingAppraisals((prev) => prev.filter((a) => a.id !== appraisalId));
    } catch (error) {
      setActionMsg(error instanceof Error ? error.message : "Failed to add appraisal to inventory");
    }
  };

  return (
    <main className="crm-shell">
      <h1 className="crm-title" style={{ marginBottom: "0.4rem" }}>Inventory</h1>
      <p className="crm-subtitle" style={{ marginBottom: "1rem" }}>
        Manage from API or <a href={`${API_BASE.replace(/\/$/, "")}/inventory`} target="_blank" rel="noopener noreferrer">API docs</a>.
    getMarketListings()
      .then(setMarket)
      .catch(() => setMarket({ items: [] }));
  }, [token]);

  const items = (data?.items ?? []) as { id: string; source: string; listPrice: number; status: string; location: string | null; vehicle?: { make: string; model: string; year: number } }[];
  const marketItems = (market?.items ?? []) as { id: string; source: string; price: number | null; location: string | null; make: string; model: string; year: number; externalUrl: string }[];

  return (
    <main style={{ padding: "1.5rem", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>Inventory</h1>
      <p style={{ marginBottom: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
        Manage in-house inventory from the API or upcoming CRM tools. External market listings are read-only.
      </p>
      <div className="crm-panel" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr auto", gap: "0.55rem", marginBottom: "1rem", padding: "0.8rem" }}>
        <input value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} placeholder="Vehicle ID" />
        <input value={listPrice} onChange={(e) => setListPrice(e.target.value)} placeholder="List price" />
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
        <button type="button" onClick={onCreate} className="crm-btn crm-btn-primary">Add</button>
      </div>
      <div className="crm-panel" style={{ marginBottom: "1rem", padding: "0.8rem" }}>
        <h2 style={{ margin: 0, marginBottom: "0.5rem", fontSize: "1rem" }}>Add from Appraisal</h2>
        <p style={{ color: "var(--text-muted)", margin: 0, marginBottom: "0.7rem" }}>
          Turn incoming trade-ins into inventory with one click.
        </p>
        <div style={{ display: "grid", gap: "0.45rem" }}>
          {pendingAppraisals.map((a) => (
            <div key={a.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0.6rem", alignItems: "center" }}>
              <span style={{ color: "var(--text-muted)" }}>
                {a.id.slice(0, 8)}… · {String(a.status).toUpperCase()} · {a.value != null ? `$${a.value.toLocaleString("en-US")}` : "No value"}
              </span>
              <Link href={`/appraisals/${a.id}`}>Open</Link>
              <button type="button" className="crm-btn" onClick={() => void onAddFromAppraisal(a.id, a.value)}>
                Add to inventory
              </button>
            </div>
          ))}
          {pendingAppraisals.length === 0 && <span style={{ color: "var(--text-muted)" }}>No open appraisals to import.</span>}
        </div>
      </div>
      {actionMsg && (
        <p style={{ marginBottom: "0.7rem", color: actionMsg.toLowerCase().includes("failed") ? "#ff6b6b" : "#7fffd4" }}>
          {actionMsg}
        </p>
      )}
      <div className="crm-panel" style={{ padding: "0.45rem 0.8rem 0.8rem" }}>
        <table>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Source</th>
              <th>Price</th>
              <th>Location</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>{i.vehicle ? `${i.vehicle.make} ${i.vehicle.model} ${i.vehicle.year}` : "—"}</td>
                <td>{i.source}</td>
                <td>${i.listPrice.toLocaleString("en-US")}</td>
                <td>{i.location || "—"}</td>
                <td>{i.status}</td>
                <td>
                  <Link href={`/appraisals/new?vehicleId=${encodeURIComponent(i.vehicleId)}`}>Appraise</Link>
                  {" · "}
                  <a href={`${WEB_URL}/inventory/${i.id}`} target="_blank" rel="noopener noreferrer">View on site</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 && <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>No inventory.</p>}

      <h2 style={{ margin: "2rem 0 1rem", color: "var(--text-primary)", fontSize: "1.1rem" }}>Market listings</h2>
      <table>
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Source</th>
            <th>Price</th>
            <th>Location</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {marketItems.map((i) => (
            <tr key={i.id}>
              <td>{`${i.make} ${i.model} ${i.year}`}</td>
              <td>{i.source}</td>
              <td>{i.price != null ? `£${i.price.toLocaleString()}` : "—"}</td>
              <td>{i.location || "—"}</td>
              <td><a href={i.externalUrl} target="_blank" rel="noopener noreferrer">View listing</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
