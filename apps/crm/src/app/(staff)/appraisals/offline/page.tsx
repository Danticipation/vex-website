"use client";

import { useEffect, useState } from "react";

type OfflineDraft = { id: string; notes: string; createdAt: string };
const KEY = "vex_offline_appraisals";

export default function OfflineAppraisalsPage() {
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OfflineDraft[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) setItems(JSON.parse(raw) as OfflineDraft[]);
  }, []);

  function save() {
    const next = [{ id: crypto.randomUUID(), notes, createdAt: new Date().toISOString() }, ...items];
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    setNotes("");
  }

  return (
    <main style={{ padding: "1.5rem", maxWidth: 900, margin: "0 auto" }}>
      <h1>Offline appraisals</h1>
      <p>Create drafts offline; sync jobs can be queued when back online.</p>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" />
      <div><button onClick={save}>Save offline draft</button></div>
      <ul>
        {items.map((i) => (
          <li key={i.id}>{new Date(i.createdAt).toLocaleString()} - {i.notes}</li>
        ))}
      </ul>
    </main>
  );
}
