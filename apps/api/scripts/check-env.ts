import { requireEnv } from "../src/lib/env.js";

function readArg(flag: string): string | null {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return null;
  return process.argv[idx + 1] ?? null;
}

const requireArg = readArg("--require") ?? "";
const context = readArg("--context") ?? "env-check";
const keys = requireArg
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

if (keys.length === 0) {
  console.error("env-check: pass --require KEY1,KEY2");
  process.exit(1);
}

requireEnv(keys, context);
console.log(`env-check: OK (${context})`);

