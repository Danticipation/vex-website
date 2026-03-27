import type { AutonomousWorkflow } from "@vex/shared";
import { prisma } from "./tenant.js";

export class AutonomousService {
  async queueWorkflow(tenantId: string, actorId: string | undefined, workflow: AutonomousWorkflow) {
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorId,
        action: "AUTONOMOUS_WORKFLOW_QUEUED",
        entity: "AutonomousWorkflow",
        entityId: workflow.id,
        payload: workflow,
      },
    });
    await prisma.eventLog.create({
      data: {
        tenantId,
        type: "autonomous.workflow_queued",
        payload: workflow,
      },
    });
    return { queued: true };
  }
}
