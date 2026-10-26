// Orchestrator tests: output checks for Q1 to Q6, input validation with no
// adapter or model calls, max_turns, bad_output, summary_invalid and privacy.

import { test } from "node:test";
import assert from "node:assert/strict";

process.env.AGENT_MODE = "mock";
process.env.SEARCH_ADAPTER = "fake";
const { run } = await import("../orchestrator.js");
const { createFakeSearch } = await import("../adapters/fake-search.js");

const QUESTIONS = [
  "What is CRISPR?",
  "How do vaccines train the immune system?",
  "What causes ocean tides?",
  "How does photosynthesis work?",
  "What is a black hole?",
  "How do honeybees communicate?",
];

const sentencesOf = text => text.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
const markersOf = text => [...text.matchAll(/\[(\d+)\]/g)].map(m => Number(m[1]));

function recordingApis() {
  return { web: createFakeSearch({}), encyclopedia: createFakeSearch({}), papers: createFakeSearch({}) };
}

function countingModel(blocksFor) {
  const state = { calls: 0 };
  const modelFor = () => ({
    mode: "mock",
    async call(request) {
      state.calls++;
      const content = blocksFor(state.calls, request);
      return { content, stop_reason: content.some(b => b.type === "tool_use") ? "tool_use" : "end_turn" };
    },
  });
  return { state, modelFor };
}

const toolTurn = [
  { type: "tool_use", id: "t1", name: "search_web", input: {} },
  { type: "tool_use", id: "t2", name: "search_encyclopedia", input: {} },
  { type: "tool_use", id: "t3", name: "search_papers", input: {} },
];

test("T7: each source item has n equal to index + 1 and a non-empty title, url and source", async () => {
  for (const q of QUESTIONS) {
    const { output } = await run(q);
    assert.ok(output, q);
    output.sources.forEach((s, i) => {
      assert.deepEqual(Object.keys(s), ["n", "title", "url", "source"]);
      assert.equal(s.n, i + 1, q);
      assert.ok(s.title && s.url && s.source, q);
    });
    assert.equal(new Set(output.sources.map(s => s.url)).size, output.sources.length, `${q}: duplicate URL`);
    for (const source of ["web", "encyclopedia", "papers"]) {
      assert.ok(output.sources.filter(s => s.source === source).length <= 3, `${q}: more than 3 ${source}`);
    }
  }
});

test("T8 and T9: summary is not empty, has 250 words or fewer, and each sentence has 1 or more markers", async () => {
  for (const q of QUESTIONS) {
    const { output } = await run(q);
    assert.ok(output.summary.length > 0, q);
    assert.ok(output.summary.split(/\s+/).filter(Boolean).length <= 250, q);
    for (const s of sentencesOf(output.summary)) assert.ok(markersOf(s).length >= 1, `${q}: ${s}`);
  }
});

test("T10: each [n] in summary is an n in sources", async () => {
  for (const q of QUESTIONS) {
    const { output } = await run(q);
    const ns = new Set(output.sources.map(s => s.n));
    for (const n of markersOf(output.summary)) assert.ok(ns.has(n), `${q}: [${n}]`);
  }
});

test("E1 and E2: empty or invalid input gives 0 adapter calls and 0 model calls", async () => {
  const cases = [["", "empty_input"], ["   ", "empty_input"], [undefined, "invalid_input"], [42, "invalid_input"], ["a".repeat(501), "invalid_input"]];
  for (const [input, code] of cases) {
    const apis = recordingApis();
    const { state, modelFor } = countingModel(() => toolTurn);
    assert.deepEqual(await run(input, { apis, modelFor }), { error: code });
    assert.equal(apis.web.calls.length + apis.encyclopedia.calls.length + apis.papers.calls.length, 0);
    assert.equal(state.calls, 0);
  }
});

test("input of exactly 500 letters a is valid and gives no_results", async () => {
  assert.deepEqual(await run("a".repeat(500)), { error: "no_results" });
});

test("the question is trimmed before the search", async () => {
  const { output } = await run("  What is CRISPR?  ");
  assert.deepEqual(output.search_calls.web, ["What is CRISPR?"]);
});

test("max_turns: a model that always returns a tool_use block stops after 5 calls", async () => {
  const { state, modelFor } = countingModel(() => [{ type: "tool_use", id: "t", name: "search_web", input: {} }]);
  assert.deepEqual(await run("What is CRISPR?", { modelFor }), { error: "max_turns" });
  assert.equal(state.calls, 5);
});

test("bad_output: the text not json in turn 2 gives bad_output", async () => {
  const { modelFor } = countingModel(turn => (turn === 1 ? toolTurn : [{ type: "text", text: "not json" }]));
  assert.deepEqual(await run("What is CRISPR?", { modelFor }), { error: "bad_output" });
});

test("summary_invalid: a summary with only invalid markers gives summary_invalid", async () => {
  const { modelFor } = countingModel(turn => (turn === 1 ? toolTurn : [{ type: "text", text: JSON.stringify({ summary: "Bad one [42]. Bad two [43]." }) }]));
  assert.deepEqual(await run("What is CRISPR?", { modelFor }), { error: "summary_invalid" });
});

test("no_results also when the agent fails and the registry is empty", async () => {
  const { modelFor } = countingModel(turn => (turn === 1 ? toolTurn : [{ type: "text", text: "not json" }]));
  assert.deepEqual(await run("What is the zorblax protocol?", { modelFor }), { error: "no_results" });
});

test("source_not_searched: a model that calls only search_web names the other sources", async () => {
  const { modelFor } = countingModel(turn => (turn === 1
    ? [{ type: "tool_use", id: "t1", name: "search_web", input: {} }]
    : [{ type: "text", text: JSON.stringify({ summary: "CRISPR changes DNA [1]." }) }]));
  const { output } = await run("What is CRISPR?", { modelFor });
  assert.deepEqual(output.warnings, ["source_not_searched:encyclopedia", "source_not_searched:papers"]);
  assert.deepEqual(output.search_calls, { web: ["What is CRISPR?"], encyclopedia: [], papers: [] });
  assert.equal(output.model_calls, 2);
});

test("a tool input with a query is refused by the agent loop and the adapter is not called", async () => {
  const apis = { web: createFakeSearch({}), encyclopedia: createFakeSearch({}), papers: createFakeSearch({}) };
  const { modelFor } = countingModel(() => [{ type: "tool_use", id: "t", name: "search_web", input: { query: "other" } }]);
  assert.deepEqual(await run("What is CRISPR?", { apis, modelFor }), { error: "no_results" });
  assert.equal(apis.web.calls.length, 0);
});

test("privacy: after two requests, a third request shows only its own question in search_calls", async () => {
  await run("What is CRISPR?");
  await run("What is a black hole?");
  const { output } = await run("How do honeybees communicate?");
  const q = "How do honeybees communicate?";
  assert.deepEqual(output.search_calls, { web: [q], encyclopedia: [q], papers: [q] });
});
