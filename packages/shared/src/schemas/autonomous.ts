import { z } from "zod";

export const AutonomousWorkflowSchema = z.object({
  id: z.string().min(1),
  workflowType: z.enum(["valuation_sweep", "lead_nurture", "appraisal_marketplace_push"]),
  enabled: z.boolean().default(true),
  maxParallelRuns: z.number().int().min(1).max(50).default(10),
  tenantDailyCostCapUsd: z.number().min(0).max(500).default(25),
});

export const AgentOrchestrationSchema = z.object({
  workflowId: z.string().min(1),
  runId: z.string().min(1),
  status: z.enum(["queued", "running", "completed", "failed", "paused"]),
  decisionLog: z.array(z.string()).default([]),
});

export type AutonomousWorkflow = z.infer<typeof AutonomousWorkflowSchema>;
export type AgentOrchestration = z.infer<typeof AgentOrchestrationSchema>;
