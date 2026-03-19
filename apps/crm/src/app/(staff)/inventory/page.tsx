"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getInventory, getMarketListings } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";

export default function InventoryPage() {
  const { token } = useAuth();
  const [data, setData] = useState<{ items: unknown[] } | null>(null);
  const [market, setMarket] = useState<{ items: unknown[] } | null>(null);

  useEffect(() => {
    if (!token) return;
    getInventory(token)
      .then(setData)
      .catch(() => setData({ items: [] }));
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
              <td>£{i.listPrice.toLocaleString()}</td>
              <td>{i.location || "—"}</td>
              <td>{i.status}</td>
              <td><a href={`${WEB_URL}/inventory/${i.id}`} target="_blank" rel="noopener noreferrer">View on site</a></td>
            </tr>
          ))}
        </tbody>
      </table>
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
