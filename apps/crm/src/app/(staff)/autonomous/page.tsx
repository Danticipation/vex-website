"use client";

import { useId, useMemo, useState } from "react";
import { VexAnimatedMetric, VexPageHeader, VexPanel } from "@vex/ui";
import { useAuth } from "@/contexts/AuthContext";
import { submitAutonomousWorkflow } from "@/lib/api";
import styles from "./page.module.css";

const WORKFLOWS = [
  { value: "valuation_sweep" as const, label: "Valuation sweep" },
  { value: "lead_nurture" as const, label: "Lead nurture" },
  { value: "appraisal_marketplace_push" as const, label: "Appraisal marketplace push" },
];

export default function AutonomousDashboardPage() {
  const formId = useId();
  const { token, role } = useAuth();
  const [workflowId, setWorkflowId] = useState(`wf_${Date.now()}`);
  const [workflowType, setWorkflowType] = useState<(typeof WORKFLOWS)[number]["value"]>("valuation_sweep");
  const [enabled, setEnabled] = useState(true);
  const [maxParallelRuns, setMaxParallelRuns] = useState(10);
  const [tenantDailyCostCapUsd, setTenantDailyCostCapUsd] = useState(25);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = (role === "ADMIN" || role === "GROUP_ADMIN") && !!token;

  const workflowLabel = useMemo(
    () => WORKFLOWS.find((w) => w.value === workflowType)?.label ?? workflowType,
    [workflowType]
  );

  const statusLabel = busy ? "Queueing…" : result ? "Last request sent" : "Ready";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !canSubmit) return;
    setBusy(true);
    setErr(null);
    setResult(null);
    try {
      const data = await submitAutonomousWorkflow(token, {
        id: workflowId.trim() || `wf_${Date.now()}`,
        workflowType,
        enabled,
        maxParallelRuns,
        tenantDailyCostCapUsd,
      });
      const lines = [
        JSON.stringify(data, null, 2),
        !data.queued
          ? "\nNote: Audit/event records were written but no Redis queue job ran (REDIS_URL unset or unreachable)."
          : "",
      ].filter(Boolean);
      setResult(lines.join("\n"));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="crm-shell">
      <VexPageHeader title="Autonomous Dealer OS v2" subtitle="Workflow orchestration, guardrails, and queue submission." />
      <div className={styles.metrics}>
        <VexAnimatedMetric label="Selected workflow" value={workflowLabel} />
        <VexAnimatedMetric label="Queue status" value={statusLabel} />
        <VexAnimatedMetric label="Parallel runs (max)" value={String(maxParallelRuns)} />
        <VexAnimatedMetric label="Daily cost cap" value={`$${tenantDailyCostCapUsd}`} />
      </div>
      <div className={styles.notice}>
        Tenant-scoped and auditable. Caps and workflow type above match what will be sent when you queue a run.
      </div>

      <VexPanel style={{ padding: "1.15rem 1.25rem" }}>
        <h2 className={styles.sectionTitle}>Queue workflow</h2>
        {!canSubmit && (
          <p className={styles.adminOnly}>Admin or group admin sign-in required to enqueue autonomous jobs.</p>
        )}
        <form id={formId} onSubmit={(e) => void onSubmit(e)} className={styles.form}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Run ID</span>
            <input
              className={styles.input}
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              disabled={!canSubmit}
              autoComplete="off"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Workflow type</span>
            <select
              className={styles.select}
              value={workflowType}
              onChange={(e) => setWorkflowType(e.target.value as (typeof WORKFLOWS)[number]["value"])}
              disabled={!canSubmit}
            >
              {WORKFLOWS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.toggle}>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} disabled={!canSubmit} />
            <span>Enabled</span>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Max parallel runs (1–50)</span>
            <input
              className={styles.input}
              type="number"
              min={1}
              max={50}
              value={maxParallelRuns}
              onChange={(e) => setMaxParallelRuns(Number(e.target.value))}
              disabled={!canSubmit}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Daily cost cap (USD)</span>
            <input
              className={styles.input}
              type="number"
              min={0}
              max={500}
              step={1}
              value={tenantDailyCostCapUsd}
              onChange={(e) => setTenantDailyCostCapUsd(Number(e.target.value))}
              disabled={!canSubmit}
            />
          </label>
          <button type="submit" disabled={!canSubmit || busy} className={styles.submit}>
            {busy ? "Queueing…" : "Queue workflow"}
          </button>
        </form>
        {err && <p className={styles.error}>{err}</p>}
        {result && <pre className={styles.result}>{result}</pre>}
      </VexPanel>
    </main>
  );
}
