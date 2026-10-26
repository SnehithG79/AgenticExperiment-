PASS

# Test report: round 2

Worktree used: /home/user/.okati/worktrees/20261026-research-summary (branch okati/20261026-research-summary, HEAD 719bb61). The system folder is systems/research-summary/. The path `.okati/worktrees/...` under /home/user/okati does not exist; the worktree is under /home/user/.okati. `package.json` has no dependencies, so no install was needed.

Command: AGENT_MODE=mock npm test
Totals: 79 tests, 79 pass, 0 fail (0 cancelled, 0 skipped)

Command: AGENT_MODE=mock npm run evals
Totals: 20 cases, 20 pass, 0 fail ("all 20 cases passed")

| Test | Result | Duration |
|------|--------|----------|
| eval T1 in process | pass | 8.2 ms |
| eval T1 over HTTP | pass | 27.8 ms |
| eval T2 in process | pass | 0.6 ms |
| eval T2 over HTTP | pass | 5.4 ms |
| eval T3 in process | pass | 1.4 ms |
| eval T3 over HTTP | pass | 5.4 ms |
| eval T4 in process | pass | 0.6 ms |
| eval T4 over HTTP | pass | 3.3 ms |
| eval T5 in process | pass | 0.7 ms |
| eval T5 over HTTP | pass | 2.8 ms |
| eval T6 in process | pass | 0.4 ms |
| eval T6 over HTTP | pass | 2.9 ms |
| eval T7 in process | pass | 0.3 ms |
| eval T7 over HTTP | pass | 9.6 ms |
| eval T8 in process | pass | 0.4 ms |
| eval T8 over HTTP | pass | 7.4 ms |
| eval T9 in process | pass | 0.3 ms |
| eval T9 over HTTP | pass | 5.9 ms |
| eval T10 in process | pass | 0.3 ms |
| eval T10 over HTTP | pass | 3.3 ms |
| eval T11 in process | pass | 0.3 ms |
| eval T11 over HTTP | pass | 2.5 ms |
| eval T12 in process | pass | 0.6 ms |
| eval T12 over HTTP | pass | 2.9 ms |
| eval T13 in process | pass | 0.4 ms |
| eval T13 over HTTP | pass | 1.9 ms |
| eval T14 in process | pass | 1.1 ms |
| eval T14 over HTTP | pass | 2.1 ms |
| eval T15 in process | pass | 0.3 ms |
| eval T15 over HTTP | pass | 2.0 ms |
| eval E1 in process | pass | 0.1 ms |
| eval E1 over HTTP | pass | 1.8 ms |
| eval E1b in process | pass | 0.1 ms |
| eval E1b over HTTP | pass | 4.5 ms |
| eval E2 in process | pass | 0.1 ms |
| eval E2 over HTTP | pass | 2.0 ms |
| eval E2b in process | pass | 0.1 ms |
| eval E2b over HTTP | pass | 1.7 ms |
| eval E2c in process | pass | 0.1 ms |
| eval E2c over HTTP | pass | 2.6 ms |
| T15: each case with an output uses 5 model calls or fewer, and no case returns max_turns | pass | 2.2 ms |
| GET /health returns 200 | pass | 2.4 ms |
| POST /run refuses bad JSON | pass | 2.2 ms |
| T14 grounding: What is CRISPR? | pass | 3.0 ms |
| T14 grounding: How do vaccines train the immune system? | pass | 1.6 ms |
| T14 grounding: What causes ocean tides? | pass | 0.5 ms |
| T14 grounding: How does photosynthesis work? | pass | 0.5 ms |
| T14 grounding: What is a black hole? | pass | 0.4 ms |
| toOpenAI maps system, tools, tool calls and tool results | pass | 1.4 ms |
| fromOpenAI maps text and tool calls to content blocks | pass | 0.3 ms |
| provider picks openai when only OPENAI_API_KEY is set | pass | 2.5 ms |
| T7: each source item has n equal to index + 1 and a non-empty title, url and source | pass | 6.9 ms |
| T8 and T9: summary is not empty, has 250 words or fewer, and each sentence has 1 or more markers | pass | 1.3 ms |
| T10: each [n] in summary is an n in sources | pass | 1.9 ms |
| E1 and E2: empty or invalid input gives 0 adapter calls and 0 model calls | pass | 0.3 ms |
| input of exactly 500 letters a is valid and gives no_results | pass | 0.2 ms |
| the question is trimmed before the search | pass | 0.3 ms |
| max_turns: a model that always returns a tool_use block stops after 5 calls | pass | 0.5 ms |
| bad_output: the text not json in turn 2 gives bad_output | pass | 0.3 ms |
| summary_invalid: a summary with only invalid markers gives summary_invalid | pass | 0.5 ms |
| no_results also when the agent fails and the registry is empty | pass | 0.6 ms |
| source_not_searched: a model that calls only search_web names the other sources | pass | 0.5 ms |
| a tool input with a query is refused by the agent loop and the adapter is not called | pass | 0.2 ms |
| privacy: after two requests, a third request shows only its own question in search_calls | pass | 0.4 ms |
| source registry: a duplicate URL gets the existing n and duplicate true and adds no item | pass | 1.4 ms |
| source registry: source warnings in the fixed sequence | pass | 0.3 ms |
| clean_summary: a sentence with no marker is removed with sentence_removed | pass | 0.6 ms |
| clean_summary: an invalid marker is removed with one space, and the sentence stays if it has a valid marker | pass | 0.2 ms |
| clean_summary: a text of 300 words in 6 sentences is cut to 250 words or fewer with summary_truncated | pass | 0.6 ms |
| clean_summary: a text with only invalid markers gives an empty result | pass | 0.2 ms |
| fake search: records calls, returns deep copies, [] for an unknown query and throws on error | pass | 0.7 ms |
| search_web maps snippet, numbers results from 1 and keeps a maximum of 3 | pass | 2.2 ms |
| search_encyclopedia maps extract to snippet and returns empty for 0 results | pass | 0.7 ms |
| search_papers maps abstract to snippet and keeps authors and year | pass | 0.4 ms |
| a second run({}) returns the same object and the adapter records 1 call only | pass | 0.4 ms |
| an adapter failure gives status error and source_unavailable, and the tool does not throw | pass | 0.3 ms |
| the tool input schema refuses a query | pass | 0.3 ms |
| results without a non-empty title, url or snippet are removed and snippets are cut to 1000 characters | pass | 0.4 ms |
| a duplicate URL from another tool gets the existing n and duplicate true | pass | 0.3 ms |

## Failures

None.

## Missing tests

None.

Evaluation cases: `evals/cases.json` has 20 cases: T1 to T15, E1, E1b, E2, E2b, E2c. This is every case in `design.md`. E2 has no `input` key. E2c has an input of exactly 501 characters. `tests/evals.test.js` runs each case twice (in process and over HTTP, default TEST_PORT 3917), so each case has a test. The T15 check (model_calls 5 or fewer, no `max_turns`) is present. T14 has `tests/grounding.test.js` for Q1 to Q5. T7, T8, T9 and T10 have extra tests in `tests/orchestrator.test.js`.

Tools: `tests/tools.test.js` has one unit test for each tool (`search_web`, `search_encyclopedia`, `search_papers`), plus shared tests for the cache (second `run({})`), the adapter failure, the input schema that refuses a query, filtering and the duplicate URL. The registry, `clean_summary`, `max_turns`, `bad_output`, `summary_invalid`, privacy and the 500-letter input have tests.

Key handling check (round 2 change): `server.js` line 46 calls `process.loadEnvFile` in a `try` block. `.gitignore` has `node_modules/` and `.env`. No `.env` file is tracked. `git status` is clean. Tests do not load `.env`.
