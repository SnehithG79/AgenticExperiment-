// One test for each evaluation case, in process and over HTTP.
// The mock model is forced, so no credential is used.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";

process.env.AGENT_MODE = "mock";
process.env.TRIAGE_LOG = "off";
delete process.env.TICKET_ADAPTER;
delete process.env.TRIAGE_CONFIG;
const { loadCases, matches } = await import("../evals/run-evals.js");
const { run } = await import("../orchestrator.js");
const { createServer } = await import("../server.js");

const cases = await loadCases();
const PORT = Number(process.env.TEST_PORT || 3942);
let server;

before(() => new Promise(resolve => { server = createServer().listen(PORT, "127.0.0.1", resolve); }));
after(() => new Promise(resolve => server.close(resolve)));

for (const c of cases) {
  test(`eval ${c.id} in process`, async () => {
    const result = await run(c.input);
    assert.ok(matches(c.expected, result), `got ${JSON.stringify(result)}`);
    if (c.id === "T6") {
      for (const u of result.output.updates) {
        assert.ok(typeof u.reason === "string" && u.reason.length >= 1 && u.reason.length <= 200, `reason of ${u.ticket_id}`);
      }
    }
  });
  test(`eval ${c.id} over HTTP`, async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/run`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ input: c.input }),
    });
    assert.ok(matches(c.expected, await res.json()));
  });
}

test("GET /health returns 200", async () => {
  const res = await fetch(`http://127.0.0.1:${PORT}/health`);
  assert.equal(res.status, 200);
});

test("POST /run refuses bad JSON", async () => {
  const res = await fetch(`http://127.0.0.1:${PORT}/run`, { method: "POST", body: "{" });
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: "bad_json" });
});
