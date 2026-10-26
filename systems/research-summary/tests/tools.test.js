// Unit tests for the three search tools and the shared factory.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createSearchTool } from "../tools/search-tool.js";
import { createSearchWeb } from "../tools/search-web.js";
import { createSearchEncyclopedia } from "../tools/search-encyclopedia.js";
import { createSearchPapers } from "../tools/search-papers.js";
import { createSourceRegistry } from "../steps/source-registry.js";
import { createFakeSearch } from "../adapters/fake-search.js";
import { validate } from "../lib/schema.js";

const Q = "test question";

function webRows(count) {
  return Array.from({ length: count }, (_, i) => ({ title: `Page ${i + 1}`, url: `https://web.example.test/p${i + 1}`, snippet: `Snippet ${i + 1}.` }));
}

test("search_web maps snippet, numbers results from 1 and keeps a maximum of 3", async () => {
  const api = createFakeSearch({ [Q]: webRows(10) });
  const registry = createSourceRegistry();
  const tool = createSearchWeb({ api, question: Q, registry });
  assert.equal(tool.name, "search_web");
  const out = await tool.run({});
  assert.equal(out.source, "web");
  assert.equal(out.status, "ok");
  assert.equal(out.results.length, 3);
  assert.deepEqual(out.results.map(r => r.n), [1, 2, 3]);
  assert.deepEqual(out.results[0], { n: 1, title: "Page 1", url: "https://web.example.test/p1", snippet: "Snippet 1." });
  assert.deepEqual(validate(tool.outputSchema, out), []);
  assert.deepEqual(api.calls, [Q]);
});

test("search_encyclopedia maps extract to snippet and returns empty for 0 results", async () => {
  const api = createFakeSearch({
    [Q]: [{ title: "Tide", url: " https://encyclopedia.example.test/wiki/Tide ", extract: "Tides rise and fall." }],
    other: [],
  });
  const registry = createSourceRegistry();
  const tool = createSearchEncyclopedia({ api, question: Q, registry });
  assert.equal(tool.name, "search_encyclopedia");
  const out = await tool.run({});
  assert.deepEqual(out, {
    source: "encyclopedia", status: "ok",
    results: [{ n: 1, title: "Tide", url: "https://encyclopedia.example.test/wiki/Tide", snippet: "Tides rise and fall." }],
  });
  assert.deepEqual(validate(tool.outputSchema, out), []);

  const emptyRegistry = createSourceRegistry();
  const empty = await createSearchEncyclopedia({ api, question: "other", registry: emptyRegistry }).run({});
  assert.deepEqual(empty, { source: "encyclopedia", status: "empty", results: [] });
  assert.deepEqual(emptyRegistry.sourceWarnings(), ["source_not_searched:web", "source_empty:encyclopedia", "source_not_searched:papers"]);
});

test("search_papers maps abstract to snippet and keeps authors and year", async () => {
  const api = createFakeSearch({
    [Q]: [{ title: "Paper", url: "https://papers.example.test/abs/1", authors: ["Test Author A"], year: 2020, abstract: "An abstract." }],
  });
  const registry = createSourceRegistry();
  const tool = createSearchPapers({ api, question: Q, registry });
  assert.equal(tool.name, "search_papers");
  const out = await tool.run({});
  assert.deepEqual(out.results, [{ n: 1, title: "Paper", url: "https://papers.example.test/abs/1", snippet: "An abstract.", authors: ["Test Author A"], year: 2020 }]);
  assert.deepEqual(validate(tool.outputSchema, out), []);
});

test("a second run({}) returns the same object and the adapter records 1 call only", async () => {
  const api = createFakeSearch({ [Q]: webRows(10) });
  const tool = createSearchWeb({ api, question: Q, registry: createSourceRegistry() });
  const first = await tool.run({});
  const second = await tool.run({});
  assert.equal(second, first);
  assert.deepEqual(api.calls, [Q]);
});

test("an adapter failure gives status error and source_unavailable, and the tool does not throw", async () => {
  const api = createFakeSearch({ [Q]: webRows(2) }, { fail: true });
  const registry = createSourceRegistry();
  const tool = createSearchPapers({ api, question: Q, registry });
  const out = await tool.run({});
  assert.deepEqual(out, { source: "papers", status: "error", error: "source_unavailable", results: [] });
  assert.deepEqual(validate(tool.outputSchema, out), []);
  assert.ok(registry.sourceWarnings().includes("source_failed:papers"));
  await tool.run({});
  assert.equal(api.calls.length, 1);
});

test("the tool input schema refuses a query", () => {
  for (const make of [createSearchWeb, createSearchEncyclopedia, createSearchPapers]) {
    const tool = make({ api: createFakeSearch({}), question: Q, registry: createSourceRegistry() });
    assert.ok(validate(tool.inputSchema, { query: "x" }).length > 0);
    assert.deepEqual(validate(tool.inputSchema, {}), []);
  }
});

test("results without a non-empty title, url or snippet are removed and snippets are cut to 1000 characters", async () => {
  const api = createFakeSearch({
    [Q]: [
      { title: "", url: "https://a.example.test", snippet: "x" },
      { title: "No url", snippet: "x" },
      { title: "Blank snippet", url: "https://b.example.test", snippet: "   " },
      { title: "Long", url: "https://c.example.test", snippet: "y".repeat(1500) },
    ],
  });
  const tool = createSearchTool({ name: "search_web", source: "web", description: "d", api, question: Q, registry: createSourceRegistry(), map: x => x });
  const out = await tool.run({});
  assert.equal(out.results.length, 1);
  assert.equal(out.results[0].title, "Long");
  assert.equal(out.results[0].snippet.length, 1000);
});

test("a duplicate URL from another tool gets the existing n and duplicate true", async () => {
  const registry = createSourceRegistry();
  const url = "https://encyclopedia.example.test/wiki/X";
  await createSearchWeb({ api: createFakeSearch({ [Q]: [{ title: "X web", url, snippet: "s" }] }), question: Q, registry }).run({});
  const out = await createSearchEncyclopedia({ api: createFakeSearch({ [Q]: [{ title: "X", url, extract: "e" }, { title: "Y", url: "https://y.example.test", extract: "e" }] }), question: Q, registry }).run({});
  assert.deepEqual(out.results.map(r => [r.n, r.duplicate === true]), [[1, true], [2, false]]);
  assert.deepEqual(registry.items(), [
    { n: 1, title: "X web", url, source: "web" },
    { n: 2, title: "Y", url: "https://y.example.test", source: "encyclopedia" },
  ]);
});
