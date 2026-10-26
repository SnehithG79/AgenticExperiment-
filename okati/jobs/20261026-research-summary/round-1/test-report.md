PASS

# Test report: round 1

Worktree: /home/user/.okati/worktrees/20261026-research-summary (branch okati/20261026-research-summary, HEAD 9786046). System folder: systems/research-summary/. The path `.okati/worktrees/...` under `/home/user/okati/` does not exist. The worktree is at `/home/user/.okati/worktrees/`.

Install: skipped. `package.json` has no dependencies.

Command: AGENT_MODE=mock npm test
Totals: 79 tests, 79 pass, 0 fail

Command: AGENT_MODE=mock npm run evals
Totals: 20 cases, 20 pass, 0 fail (T1 to T15, E1, E1b, E2, E2b, E2c)

| Test | Result | Duration |
|------|--------|----------|
| eval T1 in process | pass | 6.997577 ms |
| eval T1 over HTTP | pass | 25.841979 ms |
| eval T2 in process | pass | 0.673349 ms |
| eval T2 over HTTP | pass | 4.432633 ms |
| eval T3 in process | pass | 0.468638 ms |
| eval T3 over HTTP | pass | 7.480197 ms |
| eval T4 in process | pass | 0.548885 ms |
| eval T4 over HTTP | pass | 2.881779 ms |
| eval T5 in process | pass | 0.541831 ms |
| eval T5 over HTTP | pass | 2.991771 ms |
| eval T6 in process | pass | 0.436696 ms |
| eval T6 over HTTP | pass | 2.818233 ms |
| eval T7 in process | pass | 0.266683 ms |
| eval T7 over HTTP | pass | 5.020298 ms |
| eval T8 in process | pass | 0.252607 ms |
| eval T8 over HTTP | pass | 3.265101 ms |
| eval T9 in process | pass | 0.266825 ms |
| eval T9 over HTTP | pass | 4.051428 ms |
| eval T10 in process | pass | 0.293224 ms |
| eval T10 over HTTP | pass | 3.292608 ms |
| eval T11 in process | pass | 0.269765 ms |
| eval T11 over HTTP | pass | 1.940858 ms |
| eval T12 in process | pass | 0.411346 ms |
| eval T12 over HTTP | pass | 3.874394 ms |
| eval T13 in process | pass | 0.306081 ms |
| eval T13 over HTTP | pass | 2.371347 ms |
| eval T14 in process | pass | 0.501538 ms |
| eval T14 over HTTP | pass | 2.35904 ms |
| eval T15 in process | pass | 0.288698 ms |
| eval T15 over HTTP | pass | 2.540759 ms |
| eval E1 in process | pass | 0.104081 ms |
| eval E1 over HTTP | pass | 2.437293 ms |
| eval E1b in process | pass | 0.115061 ms |
| eval E1b over HTTP | pass | 4.649511 ms |
| eval E2 in process | pass | 0.109446 ms |
| eval E2 over HTTP | pass | 2.005635 ms |
| eval E2b in process | pass | 0.099689 ms |
| eval E2b over HTTP | pass | 2.006994 ms |
| eval E2c in process | pass | 0.088348 ms |
| eval E2c over HTTP | pass | 1.579422 ms |
| T15: each case with an output uses 5 model calls or fewer, and no case returns max_turns | pass | 1.624764 ms |
| GET /health returns 200 | pass | 1.616171 ms |
| POST /run refuses bad JSON | pass | 1.945267 ms |
| T14 grounding: What is CRISPR? | pass | 2.640845 ms |
| T14 grounding: How do vaccines train the immune system? | pass | 2.002372 ms |
| T14 grounding: What causes ocean tides? | pass | 0.521267 ms |
| T14 grounding: How does photosynthesis work? | pass | 0.401455 ms |
| T14 grounding: What is a black hole? | pass | 0.484151 ms |
| toOpenAI maps system, tools, tool calls and tool results | pass | 1.273823 ms |
| fromOpenAI maps text and tool calls to content blocks | pass | 0.240315 ms |
| provider picks openai when only OPENAI_API_KEY is set | pass | 1.830001 ms |
| T7: each source item has n equal to index + 1 and a non-empty title, url and source | pass | 8.759018 ms |
| T8 and T9: summary is not empty, has 250 words or fewer, and each sentence has 1 or more markers | pass | 2.470479 ms |
| T10: each [n] in summary is an n in sources | pass | 2.760173 ms |
| E1 and E2: empty or invalid input gives 0 adapter calls and 0 model calls | pass | 0.656334 ms |
| input of exactly 500 letters a is valid and gives no_results | pass | 0.570268 ms |
| the question is trimmed before the search | pass | 0.523726 ms |
| max_turns: a model that always returns a tool_use block stops after 5 calls | pass | 0.797521 ms |
| bad_output: the text not json in turn 2 gives bad_output | pass | 0.574095 ms |
| summary_invalid: a summary with only invalid markers gives summary_invalid | pass | 0.788338 ms |
| no_results also when the agent fails and the registry is empty | pass | 0.964171 ms |
| source_not_searched: a model that calls only search_web names the other sources | pass | 0.597461 ms |
| a tool input with a query is refused by the agent loop and the adapter is not called | pass | 0.539452 ms |
| privacy: after two requests, a third request shows only its own question in search_calls | pass | 0.863881 ms |
| source registry: a duplicate URL gets the existing n and duplicate true and adds no item | pass | 1.161197 ms |
| source registry: source warnings in the fixed sequence | pass | 0.420404 ms |
| clean_summary: a sentence with no marker is removed with sentence_removed | pass | 0.560148 ms |
| clean_summary: an invalid marker is removed with one space, and the sentence stays if it has a valid marker | pass | 0.202509 ms |
| clean_summary: a text of 300 words in 6 sentences is cut to 250 words or fewer with summary_truncated | pass | 0.366151 ms |
| clean_summary: a text with only invalid markers gives an empty result | pass | 0.162328 ms |
| fake search: records calls, returns deep copies, [] for an unknown query and throws on error | pass | 0.64663 ms |
| search_web maps snippet, numbers results from 1 and keeps a maximum of 3 | pass | 3.3942 ms |
| search_encyclopedia maps extract to snippet and returns empty for 0 results | pass | 0.759193 ms |
| search_papers maps abstract to snippet and keeps authors and year | pass | 0.559462 ms |
| a second run({}) returns the same object and the adapter records 1 call only | pass | 0.462933 ms |
| an adapter failure gives status error and source_unavailable, and the tool does not throw | pass | 0.594127 ms |
| the tool input schema refuses a query | pass | 0.453559 ms |
| results without a non-empty title, url or snippet are removed and snippets are cut to 1000 characters | pass | 0.55457 ms |
| a duplicate URL from another tool gets the existing n and duplicate true | pass | 0.717567 ms |

## Failures

None.

| Test | File:line | Root cause | Suggested correction |
|------|-----------|------------|----------------------|
| (none) | | | |

## Missing tests

None.

Evaluation cases: all 20 cases in `design.md` (T1 to T15, E1, E1b, E2, E2b, E2c) are in `evals/cases.json`. Each has one in-process test and one HTTP test in `tests/evals.test.js` (`eval <id> in process`, `eval <id> over HTTP`). E2 has no `input` key. E2c has 501 letters `a`. Expected values match the design (checked T10 and E2c by hand). T14 also has `tests/grounding.test.js` (Q1 to Q5), and T15 has the extra model-call test.

Tools: each tool has one unit test in `tests/tools.test.js`: `search_web`, `search_encyclopedia` and `search_papers` (map, numbering, cap of 3). There are also factory tests (cache with 1 adapter call, adapter failure, input schema refuses `query`, filtering and 1000-character cut, duplicate URL).

Other required unit tests from design.md are present: E1/E2 with 0 adapter and 0 model calls, 500-letter input gives `no_results`, `max_turns`, `bad_output`, `summary_invalid`, registry duplicate URL, `clean_summary` (no marker, truncation, only invalid markers), privacy across requests.

Notes (not failures):
- `lib/agent-loop.js`, `lib/llm.js`, `lib/schema.js` and `evals/run-evals.js` are identical to the template (`diff -q`).
- The localhost run (port 3217) was not part of this step. `tests/evals.test.js` uses port 3917 (inside 3000 to 3999).
- `adapters/http-search.js` has no test, as the design requires (guardrail 9).
