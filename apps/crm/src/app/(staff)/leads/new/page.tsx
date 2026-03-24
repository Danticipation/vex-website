"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createLead } from "@/lib/api";
import styles from "./new.module.css";

const SOURCES = [
  { value: "SMS", label: "SMS / Text" },
  { value: "EMAIL", label: "Email" },
  { value: "WEBSITE", label: "Website" },
  { value: "PHONE", label: "Phone" },
  { value: "OTHER", label: "Other" },
];

export default function NewLeadPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    source: "SMS",
    name: "",
    email: "",
    phone: "",
    vehicleInterest: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      const lead = await createLead(token, {
        source: form.source,
        name: form.name || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        vehicleInterest: form.vehicleInterest || undefined,
        notes: form.notes || undefined,
      });
      router.push(`/leads/${lead.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create lead");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <Link href="/leads" className={styles.back}>← Leads</Link>
        <h1 className={styles.title}>Add lead</h1>
        <p className={styles.subtitle}>Enter details from text or email so the lead appears in the CRM.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Source
          <select
            value={form.source}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
            className={styles.select}
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          Name
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. John Smith"
            className={styles.input}
          />
        </label>

        <label className={styles.label}>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="lead@example.com"
            className={styles.input}
          />
        </label>

        <label className={styles.label}>
          Phone
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="e.g. +44 7700 900000"
            className={styles.input}
          />
        </label>

        <label className={styles.label}>
          Vehicle interest
          <input
            type="text"
            value={form.vehicleInterest}
            onChange={(e) => setForm((f) => ({ ...f, vehicleInterest: e.target.value }))}
            placeholder="e.g. Ferrari 488, budget $250k"
            className={styles.input}
          />
        </label>

        <label className={styles.label}>
          Notes (paste message content here)
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Paste the full text or email body…"
            className={styles.textarea}
            rows={5}
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <button type="submit" disabled={submitting} className={styles.submit}>
            {submitting ? "Creating…" : "Create lead"}
          </button>
          <Link href="/leads" className={styles.cancel}>Cancel</Link>
        </div>
      </form>
    </main>
  );
}
