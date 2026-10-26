// Orchestrator tests: privacy of model messages, log content, confidence limit, body length,
// request errors.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

process.env.AGENT_MODE = "mock";
process.env.TRIAGE_LOG = "off";
delete process.env.TICKET_ADAPTER;
delete process.env.TRIAGE_CONFIG;

const { run, validateTicket, triageRun } = await import("../orchestrator.js");
const { createModel } = await import("../lib/llm.js");
const { triager } = await import("../agents/triager.js");
const { createFakeTicketApi } = await import("../adapters/ticket-api.js");
const { createMemoryStore } = await import("../adapters/state-store.js");
const { fixedClock } = await import("../adapters/clock.js");
const { loadConfig } = await import("../tools/get-triage-rules.js");
const { createFetchNewTicketsTool } = await import("../tools/fetch-new-tickets.js");
const { createUpdateTicketTool } = await import("../tools/update-ticket.js");

const FIXTURE = JSON.parse(readFileSync(new URL("../fixtures/tickets.json", import.meta.url), "utf8"));

// Model wrapper that records each request.
function recordingModel(requests) {
  return agent => {
    const model = createModel(agent);
    return { ...model, async call(request) { requests.push(JSON.parse(JSON.stringify(request))); return model.call(request); } };
  };
}

test("privacy: no model message contains example.test or requester", async () => {
  const requests = [];
  const result = await run({ ticket_set: "all" }, { createModel: recordingModel(requests) });
  assert.ok(result.output);
  assert.equal(requests.length, 42);
  for (const r of requests) {
    const text = JSON.stringify(r.messages);
    assert.ok(!text.includes("example.test"));
    assert.ok(!text.includes("requester"));
    assert.deepEqual(Object.keys(JSON.parse(r.messages[0].content)), ["ticket_id", "subject", "body"]);
  }
});

test("logs: no log line contains a subject or a body from the fixture", async () => {
  const lines = [];
  await run({ ticket_set: "all", fail_update_ids: ["TCK-1002"] }, { log: line => lines.push(line) });
  assert.ok(lines.length > 0);
  const texts = FIXTURE.records.flatMap(r => [r.subject, r.body]).filter(v => typeof v === "string" && v.length > 0);
  for (const line of lines) {
    for (const text of texts) assert.ok(!line.includes(text), `log line has fixture text: ${line}`);
    assert.ok(!line.includes("example.test") && !line.includes("Test User"));
  }
  const events = new Set(lines.map(l => JSON.parse(l).event));
  for (const e of ["ticket_invalid", "model_retry", "ticket_review", "ticket_updated", "update_failed", "run_summary"]) assert.ok(events.has(e), e);
});

test("confidence of exactly 0.6 does not go to review", async () => {
  const fixed = () => ({
    async call({ messages }) {
      if (messages.length === 1) return { content: [{ type: "tool_use", id: "t1", name: "get_triage_rules", input: {} }] };
      return { content: [{ type: "text", text: JSON.stringify({ team: "billing", priority: "P2", reason: "Test reason.", confidence: 0.6, language: "en" }) }] };
    },
  });
  const result = await run({ ticket_ids: ["TCK-1001"] }, { createModel: fixed });
  assert.deepEqual(result.output.updates, [{ ticket_id: "TCK-1001", team: "billing", priority: "P2", tags: [], reason: "Test reason." }]);
  assert.equal(result.output.summaries[0].needs_review, 0);
});

test("a team that is not in the configuration is bad_output and goes to review", async () => {
  const fixed = () => ({
    async call({ messages }) {
      if (messages.length === 1) return { content: [{ type: "tool_use", id: "t1", name: "get_triage_rules", input: {} }] };
      return { content: [{ type: "text", text: JSON.stringify({ team: "hr", priority: "P2", reason: "x", confidence: 0.9, language: "en" }) }] };
    },
  });
  const result = await run({ ticket_ids: ["TCK-1001"] }, { createModel: fixed });
  assert.equal(result.output.updates[0].team, "general");
  assert.equal(result.output.updates[0].reason, "Model output was not valid two times. Sent to review.");
  assert.equal(result.output.model_calls, 4);
});

test("the body sent to the model has a maximum of 8000 characters", async () => {
  const requests = [];
  const api = createFakeTicketApi([{ ...FIXTURE.records[0], body: "a".repeat(9000) }]);
  const config = loadConfig();
  const make = recordingModel(requests);
  const { summary } = await triageRun({
    store: createMemoryStore(), clock: fixedClock(), config, log: () => {},
    fetchTool: createFetchNewTicketsTool(api), updateTool: createUpdateTicketTool(api, config),
    countingModel: () => make(triager),
  });
  assert.equal(summary.updated, 1);
  assert.equal(JSON.parse(requests[0].messages[0].content).body.length, 8000);
});

test("validateTicket codes", () => {
  assert.equal(validateTicket({ body: "x" }), "missing_ticket_id");
  assert.equal(validateTicket({ id: "", body: "x" }), "missing_ticket_id");
  assert.equal(validateTicket({ id: "A", body: null }), "missing_body");
  assert.equal(validateTicket({ id: "A", body: "  " }), "missing_body");
  assert.equal(validateTicket({ id: "A", body: 5 }), "invalid_body_type");
  assert.equal(validateTicket({ id: "A", body: "x", subject: 5 }), "invalid_subject_type");
  assert.equal(validateTicket({ id: "A", body: "x" }), null);
});

test("request errors", async () => {
  assert.deepEqual(await run(undefined), { error: "invalid_input" });
  assert.deepEqual(await run({ runs: 4 }), { error: "invalid_input" });
  assert.deepEqual(await run({ extra: 1 }), { error: "invalid_input" });
  assert.deepEqual(await run({ ticket_ids: ["NOPE"] }), { error: "unknown_ticket_id" });
});

test("config_unavailable when the configuration path does not exist", async () => {
  process.env.TRIAGE_CONFIG = "/nonexistent/triage_config.json";
  try {
    assert.deepEqual(await run({ ticket_set: "new5_closed3" }), { error: "config_unavailable" });
  } finally {
    delete process.env.TRIAGE_CONFIG;
  }
});
