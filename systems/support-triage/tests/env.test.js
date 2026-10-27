// .env load at start: T4 (the server reads .env) and T5 (shell values win).
// The fixture .env is written only in a temporary copy of the system under os.tmpdir().

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("..", import.meta.url));
let tmp;

before(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "support-triage-env-"));
  fs.cpSync(SRC, tmp, {
    recursive: true,
    filter: p => !["node_modules", ".env"].includes(path.basename(p)),
  });
  fs.writeFileSync(
    path.join(tmp, ".env"),
    ["AGENT_PROVIDER=openai", "OPENAI_API_KEY=test-key-not-real", "OPENAI_MODEL=test-model-not-real", "TRIAGE_LOG=off"].join("\n") + "\n",
  );
});

after(() => {
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
});

function childEnv(port, extra = {}) {
  const env = { ...process.env };
  for (const k of ["AGENT_MODE", "AGENT_PROVIDER", "OPENAI_API_KEY", "OPENAI_MODEL", "ANTHROPIC_API_KEY", "AGENT_MODEL", "TICKET_ADAPTER", "TRIAGE_INTERVAL_MINUTES"]) {
    delete env[k];
  }
  return { ...env, PORT: String(port), ...extra };
}

async function healthOf(port, extra) {
  const child = spawn(process.execPath, ["server.js"], { cwd: tmp, env: childEnv(port, extra), stdio: "ignore" });
  const exited = new Promise(resolve => child.once("exit", resolve));
  try {
    const end = Date.now() + 10_000;
    while (Date.now() < end) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/health`);
        return await res.json();
      } catch {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    throw new Error(`no /health answer on port ${port} in 10 s`);
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill();
    await exited;
  }
}

test("T4: the server loads .env at start", async () => {
  assert.deepEqual(await healthOf(3944), { status: "ok", mode: "live" });
});

test("T5: a shell value wins over a .env value", async () => {
  assert.deepEqual(await healthOf(3945, { AGENT_MODE: "mock" }), { status: "ok", mode: "mock" });
});
