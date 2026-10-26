// T14: each cited sentence agrees with the snippets of the cited source.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

process.env.AGENT_MODE = "mock";
process.env.SEARCH_ADAPTER = "fake";
const { run } = await import("../orchestrator.js");

const load = name => JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8"));
const web = load("web_results.json");
const encyclopedia = load("encyclopedia_results.json");
const papers = load("paper_results.json");
const responses = load("model_responses.json");

const QUESTIONS = [
  "What is CRISPR?",
  "How do vaccines train the immune system?",
  "What causes ocean tides?",
  "How does photosynthesis work?",
  "What is a black hole?",
];

// All snippets for one URL, from the three fixture files, for one question.
function snippetsFor(question, url) {
  const rows = [
    ...[].concat(web[question] || []).map(r => r.url === url && r.snippet),
    ...[].concat(encyclopedia[question] || []).map(r => r.url === url && r.extract),
    ...[].concat(papers[question] || []).map(r => r.url === url && r.abstract),
  ];
  return rows.filter(Boolean);
}

for (const question of QUESTIONS) {
  test(`T14 grounding: ${question}`, async () => {
    const { output } = await run(question);
    assert.ok(output, `got no output for ${question}`);
    const fixtureSentences = responses[question].sentences;
    const sentences = output.summary.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
    assert.ok(sentences.length > 0);
    for (const sentence of sentences) {
      const entry = fixtureSentences.find(s => s.text === sentence);
      assert.ok(entry, `sentence not in fixture: ${sentence}`);
      const snippets = [...sentence.matchAll(/\[(\d+)\]/g)]
        .map(m => output.sources.find(s => s.n === Number(m[1])).url)
        .flatMap(url => snippetsFor(question, url))
        .map(s => s.toLowerCase());
      assert.ok(snippets.length > 0, `no snippet for ${sentence}`);
      for (const term of entry.key_terms) {
        assert.ok(snippets.some(s => s.includes(term.toLowerCase())), `"${term}" not in the cited snippets of: ${sentence}`);
      }
    }
    for (const removed of fixtureSentences.filter(s => s.expect_removed)) {
      assert.ok(!output.summary.includes(removed.text.replace(/\s*\[\d+\]/g, "")), `removed sentence is in the output: ${removed.text}`);
    }
  });
}
