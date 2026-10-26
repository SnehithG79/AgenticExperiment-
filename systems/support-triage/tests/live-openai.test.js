// Live OpenAI path with a fetch stub: T12 with T13, T14, E1, E2, E3.
// Each test stubs globalThis.fetch, so no request goes to a real network service.

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { run } = await import("../orchestrator.js");
const { createModel, modelMode, provider } = await import("../lib/llm.js");
const { triager } = await import("../agents/triager.js");
const { loadCases, matches } = await import("../evals/run-evals.js");

const FIXTURE = JSON.parse(readFileSync(new URL("../fixtures/openai_responses.json", import.meta.url), "utf8"));
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const cases = await loadCases();

let savedEnv;
let savedFetch;
let calls;

beforeEach(() => {
  savedEnv = { ...process.env };
  savedFetch = globalThis.fetch;
  calls = [];
  process.env.AGENT_MODE = "live";
  process.env.AGENT_PROVIDER = "openai";
  process.env.OPENAI_API_KEY = "test-key-not-real";
  process.env.OPENAI_MODEL = "test-model-not-real";
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.AGENT_MODEL;
  process.env.TRIAGE_LOG = "off";
  delete process.env.TICKET_ADAPTER;
  delete process.env.TRIAGE_CONFIG;
  delete process.env.TRIAGE_CLOCK;
});

afterEach(() => {
  globalThis.fetch = savedFetch;
  for (const k of Object.keys(process.env)) if (!(k in savedEnv)) delete process.env[k];
  Object.assign(process.env, savedEnv);
});

const respond = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

// Records each call as { url, headers, body } and returns responder(body).
function stubFetch(responder) {
  globalThis.fetch = async (url, init = {}) => {
    const body = JSON.parse(init.body);
    calls.push({ url: String(url), headers: init.headers, body });
    const { status, payload } = responder(body);
    return respond(payload, status);
  };
}

// T12 responder: rules call first, then the final answer for the ticket.
function triageResponder(body) {
  const user = body.messages.find(m => m.role === "user");
  const ticketId = JSON.parse(user.content).ticket_id;
  const hasTool = body.messages.some(m => m.role === "tool");
  return { status: 200, payload: hasTool ? FIXTURE.final[ticketId] : FIXTURE.rules_call };
}

function queueResponder(queue) {
  return () => ({ status: 200, payload: queue.shift() });
}

function assertOnlyOpenAI(expectedCount) {
  assert.equal(calls.length, expectedCount);
  assert.equal(calls.filter(c => c.url.includes("api.anthropic.com")).length, 0);
  for (const c of calls) {
    assert.equal(c.url, OPENAI_URL);
    assert.equal(c.headers.authorization, "Bearer test-key-not-real");
    assert.equal(c.body.model, "test-model-not-real");
  }
}

test("T12 and T13: live OpenAI run of new5_closed3 sends 10 requests to OpenAI only", async () => {
  stubFetch(triageResponder);
  const result = await run({ ticket_set: "new5_closed3" });
  const t5 = cases.find(c => c.id === "T5");
  assert.ok(matches(t5.expected, result), `got ${JSON.stringify(result)}`);
  assert.equal(result.output.update_calls, 5);
  assert.equal(result.output.model_calls, 10);
  assertOnlyOpenAI(10);
});

test("T14: OpenAI HTTP 401 rejects with model_http_401", async () => {
  stubFetch(() => ({ status: FIXTURE.http_401.status, payload: FIXTURE.http_401.body }));
  const model = createModel(triager);
  await assert.rejects(
    model.call({ model: triager.model, max_tokens: 1024, system: triager.system, tools: [], messages: [{ role: "user", content: "test" }] }),
    err => err instanceof Error && err.message === "model_http_401",
  );
  assertOnlyOpenAI(1);
});

test("E1: empty OpenAI key gives mock in auto mode and an error in live mode", () => {
  stubFetch(() => { throw new Error("fetch must not be called"); });
  process.env.OPENAI_API_KEY = "";
  process.env.AGENT_MODE = "auto";
  assert.equal(modelMode(), "mock");
  process.env.AGENT_MODE = "live";
  assert.throws(() => createModel(triager), { message: "AGENT_MODE=live needs OPENAI_API_KEY" });
  assert.equal(calls.length, 0);
});

test("E2: wrong provider name throws", () => {
  process.env.AGENT_PROVIDER = "gpt";
  assert.throws(() => provider(), { message: "AGENT_PROVIDER must be anthropic or openai, got gpt" });
});

test("E3: tool arguments that are not JSON give an invalid_input tool result", async () => {
  stubFetch(queueResponder([FIXTURE.bad_arguments_call, FIXTURE.rules_call, FIXTURE.final["TCK-1001"]]));
  const result = await run({ ticket_ids: ["TCK-1001"] });
  assert.ok(result.output, `got ${JSON.stringify(result)}`);
  const toolMsg = calls[1].body.messages.find(m => m.role === "tool" && m.tool_call_id === "call_bad_1");
  assert.ok(toolMsg, "second request has the tool result for call_bad_1");
  assert.equal(JSON.parse(toolMsg.content).error, "invalid_input");
  assert.deepEqual(result.output.updates, [
    { ticket_id: "TCK-1001", team: "billing", priority: "P2", tags: [], reason: "Duplicate card charge on an invoice. The customer needs a refund." },
  ]);
  assert.equal(result.output.model_calls, 3);
  assertOnlyOpenAI(3);
});
