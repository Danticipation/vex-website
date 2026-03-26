"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { createAppraisal } from "@/lib/api";
import { formatUsd } from "@/lib/formatCurrency";
import styles from "./appraisal.module.css";

export default function AppraisalPage() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [condition, setCondition] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string; estimatedValue: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    const y = Number(year);
    const m = Number(mileage);
    if (!make.trim() || !model.trim() || !year || Number.isNaN(y) || !mileage || Number.isNaN(m)) {
      setError("Please fill in make, model, year, and mileage.");
      return;
    }
    setLoading(true);
    try {
      const data = await createAppraisal({
        make: make.trim(),
        model: model.trim(),
        year: y,
        mileage: m,
        condition: condition.trim() || undefined,
      });
      setResult({ id: data.id, estimatedValue: data.value ?? 0 });
    } catch {
      setError("Failed to get appraisal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main id="main-content" className={styles.main}>
        <h1 className={styles.title}>Trade-in value</h1>
        <p className={styles.subtitle}>Get an estimated value for your vehicle.</p>

        {result ? (
          <div className={styles.result}>
            <p className={styles.estimateLabel}>Estimated value</p>
            <p className={styles.estimateValue}>{formatUsd(result.estimatedValue)}</p>
            <Link href={`/checkout?tradeInId=${result.id}`} className={styles.cta}>Use as trade-in at checkout</Link>
            <Link href="/checkout" className={styles.ctaSecondary}>Back to checkout</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.label}>
              Make
              <input type="text" value={make} onChange={(e) => setMake(e.target.value)} className={styles.input} placeholder="e.g. Ferrari" required />
            </label>
            <label className={styles.label}>
              Model
              <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className={styles.input} placeholder="e.g. 488" required />
            </label>
            <label className={styles.label}>
              Year
              <input type="number" min={1990} max={2030} value={year} onChange={(e) => setYear(e.target.value)} className={styles.input} placeholder="e.g. 2020" required />
            </label>
            <label className={styles.label}>
              Mileage
              <input type="number" min={0} value={mileage} onChange={(e) => setMileage(e.target.value)} className={styles.input} placeholder="e.g. 15000" required />
            </label>
            <label className={styles.label}>
              Condition (optional)
              <input type="text" value={condition} onChange={(e) => setCondition(e.target.value)} className={styles.input} placeholder="e.g. Excellent" />
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" disabled={loading} className={styles.cta}>
              {loading ? "Calculating…" : "Get estimate"}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
