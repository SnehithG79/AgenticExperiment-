// Unit tests for the source registry, clean_summary and the fake adapter.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createSourceRegistry } from "../steps/source-registry.js";
import { cleanSummary } from "../steps/clean-summary.js";
import { createFakeSearch } from "../adapters/fake-search.js";

function registryWith(count) {
  const registry = createSourceRegistry();
  const sources = ["web", "encyclopedia", "papers"];
  for (let i = 1; i <= count; i++) {
    registry.register(sources[(i - 1) % 3], [{ title: `T${i}`, url: `https://x.example.test/${i}`, snippet: "s" }]);
  }
  return registry;
}

test("source registry: a duplicate URL gets the existing n and duplicate true and adds no item", () => {
  const registry = createSourceRegistry();
  const first = registry.register("web", [{ title: "A", url: "https://a.example.test", snippet: "s" }]);
  const second = registry.register("encyclopedia", [
    { title: "A again", url: "https://a.example.test", snippet: "t" },
    { title: "B", url: "https://b.example.test", snippet: "u" },
  ]);
  assert.equal(first[0].n, 1);
  assert.equal(second[0].n, 1);
  assert.equal(second[0].duplicate, true);
  assert.equal(second[1].n, 2);
  assert.equal(second[1].duplicate, undefined);
  assert.deepEqual(registry.items(), [
    { n: 1, title: "A", url: "https://a.example.test", source: "web" },
    { n: 2, title: "B", url: "https://b.example.test", source: "encyclopedia" },
  ]);
  assert.ok(registry.has(2));
  assert.ok(!registry.has(3));
  assert.equal(registry.get(1).source, "web");
});

test("source registry: source warnings in the fixed sequence", () => {
  const registry = createSourceRegistry();
  registry.setResult("web", { source: "web", status: "empty", results: [] });
  registry.markFailed("papers");
  registry.setResult("papers", { source: "papers", status: "error", error: "source_unavailable", results: [] });
  assert.deepEqual(registry.sourceWarnings(), ["source_empty:web", "source_not_searched:encyclopedia", "source_failed:papers"]);
});

test("clean_summary: a sentence with no marker is removed with sentence_removed", () => {
  const out = cleanSummary("First fact [1]. A sentence with no marker. Third fact [2].", registryWith(2));
  assert.equal(out.summary, "First fact [1]. Third fact [2].");
  assert.deepEqual(out.warnings, ["sentence_removed:2"]);
  assert.deepEqual(out.cited_sources, ["web", "encyclopedia"]);
});

test("clean_summary: an invalid marker is removed with one space, and the sentence stays if it has a valid marker", () => {
  const out = cleanSummary("Fact one [1] [9]. Fact two [9].", registryWith(3));
  assert.equal(out.summary, "Fact one [1].");
  assert.deepEqual(out.warnings, ["citation_removed:9", "citation_removed:9", "sentence_removed:2"]);
});

test("clean_summary: a text of 300 words in 6 sentences is cut to 250 words or fewer with summary_truncated", () => {
  const sentence = n => `${Array.from({ length: 49 }, (_, i) => `w${i}`).join(" ")} [${n}].`;
  const text = [1, 2, 3, 1, 2, 3].map(sentence).join(" ");
  assert.equal(text.split(/\s+/).filter(Boolean).length, 300);
  const out = cleanSummary(text, registryWith(3));
  const words = out.summary.split(/\s+/).filter(Boolean).length;
  assert.ok(words <= 250, `${words} words`);
  assert.equal(words, 250);
  assert.deepEqual(out.warnings, ["summary_truncated"]);
});

test("clean_summary: a text with only invalid markers gives an empty result", () => {
  const out = cleanSummary("One [8]. Two [9].", registryWith(2));
  assert.equal(out.summary, "");
  assert.deepEqual(out.warnings, ["citation_removed:8", "sentence_removed:1", "citation_removed:9", "sentence_removed:2"]);
  assert.deepEqual(out.cited_sources, []);
});

test("fake search: records calls, returns deep copies, [] for an unknown query and throws on error", async () => {
  const fixture = { q: [{ title: "a", url: "u", snippet: "s" }], bad: { error: "source_unavailable" } };
  const api = createFakeSearch(fixture);
  const got = await api.search("q");
  got[0].title = "changed";
  assert.equal(fixture.q[0].title, "a");
  assert.deepEqual(await api.search("unknown"), []);
  await assert.rejects(api.search("bad"), err => err.code === "source_unavailable");
  await assert.rejects(createFakeSearch(fixture, { fail: true }).search("q"), err => err.code === "source_unavailable");
  assert.deepEqual(api.calls, ["q", "unknown", "bad"]);
});
