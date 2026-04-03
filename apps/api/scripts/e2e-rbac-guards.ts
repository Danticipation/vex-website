import type { NextFunction, Request, Response } from "express";
import { requireRole } from "../src/middleware/requireRole.js";

type MockResult = {
  nextCalled: boolean;
  statusCode: number;
  payload: unknown;
};

function makeReq(input: Partial<Request>): Request {
  return {
    params: {},
    headers: {},
    ...input,
  } as Request;
}

function makeRes(result: MockResult): Response {
  return {
    status(code: number) {
      result.statusCode = code;
      return this as Response;
    },
    json(payload: unknown) {
      result.payload = payload;
      return this as Response;
    },
  } as Response;
}

async function runGuard(req: Request, guard: ReturnType<typeof requireRole>): Promise<MockResult> {
  const result: MockResult = {
    nextCalled: false,
    statusCode: 200,
    payload: null,
  };
  const res = makeRes(result);
  const next: NextFunction = () => {
    result.nextCalled = true;
  };
  await Promise.resolve(guard(req, res, next));
  return result;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const unauthorizedRole = await runGuard(
    makeReq({
      user: { userId: "u1", email: "c@x.dev", role: "CUSTOMER", tenantId: "t1" },
    }),
    requireRole("ADMIN")
  );
  assert(unauthorizedRole.statusCode === 403, "E2E FAILED: CUSTOMER should be blocked from ADMIN route");

  const crossTenant = await runGuard(
    makeReq({
      tenantId: "tenant-A",
      params: { tenantId: "tenant-B" },
      user: { userId: "u2", email: "s@x.dev", role: "STAFF", tenantId: "tenant-A" },
    }),
    requireRole("STAFF", "ADMIN", "GROUP_ADMIN")
  );
  assert(crossTenant.statusCode === 403, "E2E FAILED: cross-tenant route access should be blocked");

  const allowed = await runGuard(
    makeReq({
      tenantId: "tenant-A",
      params: { tenantId: "tenant-A" },
      user: { userId: "u3", email: "a@x.dev", role: "ADMIN", tenantId: "tenant-A" },
    }),
    requireRole("STAFF", "ADMIN", "GROUP_ADMIN")
  );
  assert(allowed.nextCalled, "E2E FAILED: ADMIN should pass allowed role/tenant guard");

  console.log("e2e-rbac-guards: OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
