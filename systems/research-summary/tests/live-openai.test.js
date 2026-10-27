// Live OpenAI path with a fetch stub: T12 with T13, T14, E1, E2, E3.
// Each test stubs globalThis.fetch, so no request goes to a real network service.

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { run } = await import("../orchestrator.js");
const { createModel, modelMode, provider } = await import("../lib/llm.js");
const { createResearcher } = await import("../agents/researcher.js");
const { loadCases, matches } = await import("../evals/run-evals.js");

const FIXTURE = JSON.parse(readFileSync(new URL("../fixtures/openai_responses.json", import.meta.url), "utf8"));
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const cases = await loadCases();
const T14 = cases.find(c => c.id === "T14");

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
  delete process.env.SEARCH_ADAPTER;
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

// T12 responder: the three search calls first, then the final summary for the question.
function researchResponder(body) {
  const question = body.messages.find(m => m.role === "user").content;
  const hasTool = body.messages.some(m => m.role === "tool");
  return { status: 200, payload: hasTool ? FIXTURE.final[question] : FIXTURE.search_calls };
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

test("T12 and T13: live OpenAI run of What is CRISPR? sends 2 requests to OpenAI only", async () => {
  stubFetch(researchResponder);
  const result = await run("What is CRISPR?");
  assert.ok(matches(T14.expected, result), `got ${JSON.stringify(result)}`);
  assert.equal(result.output.model_calls, 2);
  assertOnlyOpenAI(2);
});

test("T14: OpenAI HTTP 401 rejects with model_http_401", async () => {
  stubFetch(() => ({ status: FIXTURE.http_401.status, payload: FIXTURE.http_401.body }));
  const agent = createResearcher([]);
  const model = createModel(agent);
  await assert.rejects(
    model.call({ model: agent.model, max_tokens: 1024, system: agent.system, tools: [], messages: [{ role: "user", content: "test" }] }),
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
  assert.throws(() => createModel(createResearcher([])), { message: "AGENT_MODE=live needs OPENAI_API_KEY" });
  assert.equal(calls.length, 0);
});

test("E2: wrong provider name throws", () => {
  process.env.AGENT_PROVIDER = "gpt";
  assert.throws(() => provider(), { message: "AGENT_PROVIDER must be anthropic or openai, got gpt" });
});

test("E3: tool arguments that are not JSON give an invalid_input tool result", async () => {
  stubFetch(queueResponder([FIXTURE.bad_arguments_call, FIXTURE.search_calls, FIXTURE.final["What is CRISPR?"]]));
  const result = await run("What is CRISPR?");
  assert.ok(result.output, `got ${JSON.stringify(result)}`);
  const toolMsg = calls[1].body.messages.find(m => m.role === "tool" && m.tool_call_id === "call_bad_1");
  assert.ok(toolMsg, "second request has the tool result for call_bad_1");
  assert.equal(JSON.parse(toolMsg.content).error, "invalid_input");
  assert.equal(result.output.summary, T14.expected.summary);
  assert.equal(result.output.model_calls, 3);
  assertOnlyOpenAI(3);
});
