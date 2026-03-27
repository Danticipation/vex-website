import { Router } from "express";
import { AgentOrchestrationSchema, AutonomousWorkflowSchema } from "@vex/shared";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody } from "../middleware/validate.js";
import { AutonomousService } from "../lib/autonomous.js";

export const autonomousRouter: Router = Router();
const service = new AutonomousService();

autonomousRouter.post("/workflow", requireAuth, requireRole("ADMIN", "GROUP_ADMIN"), validateBody(AutonomousWorkflowSchema), async (req, res) => {
  const result = await service.queueWorkflow(req.tenantId!, req.user?.userId, req.body);
  return res.status(201).json({ data: result, error: null });
});

autonomousRouter.get("/runs/:runId", requireAuth, requireRole("ADMIN", "GROUP_ADMIN"), async (req, res) => {
  const run = AgentOrchestrationSchema.parse({
    workflowId: "valuation_sweep",
    runId: req.params.runId,
    status: "running",
    decisionLog: ["Workflow started", "Evaluating tenant caps"],
  });
  return res.json({ data: run, error: null });
});
