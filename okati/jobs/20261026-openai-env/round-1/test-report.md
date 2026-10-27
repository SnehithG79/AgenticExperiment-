PASS

# Test report: round 1

Job: 20261026-openai-env. Branch: okati/20261026-openai-env. Worktree: `.okati/worktrees/20261026-openai-env/`. Mode: `AGENT_MODE=mock` only. No live OpenAI or Anthropic call. No `.env` file written in the repository. Node.js v22.22.0.

Neither system has dependencies in `package.json`, so no install was needed.

## System: systems/support-triage/

Command: AGENT_MODE=mock npm test
Totals: 78 tests, 78 pass, 0 fail (0 skipped, 0 cancelled). Expected by design: 78.

Command: AGENT_MODE=mock npm run evals
Result: `all 20 cases passed` (20 of 20). Exit code 0.

| Test | Result | Duration |
| --- | --- | --- |
| fixture has 27 records and the named sets | pass | 2.9 ms |
| fake ticket API fails an update in failUpdateIds and records nothing | pass | 0.9 ms |
| fake ticket API updates all duplicate copies and keeps the fixture unchanged | pass | 0.5 ms |
| fake ticket API accuracy counts a labeled ticket with no update as not correct | pass | 0.3 ms |
| memory store has and add | pass | 0.2 ms |
| clocks | pass | 0.3 ms |
| T1: lib/ files are byte copies of the template lib/ | pass | 1.9 ms |
| T6, T7, T10: .env.example has the OpenAI model keys and no Anthropic variables | pass | 1.1 ms |
| T11: README environment variable table agrees with .env.example | pass | 0.5 ms |
| T4: the server loads .env at start | pass | 176.9 ms |
| T5: a shell value wins over a .env value | pass | 224.2 ms |
| eval T1 in process | pass | 10.8 ms |
| eval T1 over HTTP | pass | 36.7 ms |
| eval T2 in process | pass | 1.8 ms |
| eval T2 over HTTP | pass | 8.4 ms |
| eval T3 in process | pass | 2.9 ms |
| eval T3 over HTTP | pass | 12.5 ms |
| eval T4 in process | pass | 2.7 ms |
| eval T4 over HTTP | pass | 6.7 ms |
| eval T5 in process | pass | 1.3 ms |
| eval T5 over HTTP | pass | 6.1 ms |
| eval T6 in process | pass | 7.4 ms |
| eval T6 over HTTP | pass | 15.0 ms |
| eval T7 in process | pass | 0.7 ms |
| eval T7 over HTTP | pass | 4.6 ms |
| eval T7b in process | pass | 0.3 ms |
| eval T7b over HTTP | pass | 2.3 ms |
| eval T7c in process | pass | 0.4 ms |
| eval T7c over HTTP | pass | 4.0 ms |
| eval T8 in process | pass | 0.5 ms |
| eval T8 over HTTP | pass | 2.9 ms |
| eval T8b in process | pass | 0.5 ms |
| eval T8b over HTTP | pass | 2.8 ms |
| eval T8c in process | pass | 4.8 ms |
| eval T8c over HTTP | pass | 7.9 ms |
| eval T9 in process | pass | 0.9 ms |
| eval T9 over HTTP | pass | 6.5 ms |
| eval T10 in process | pass | 1.4 ms |
| eval T10 over HTTP | pass | 3.5 ms |
| eval E1 in process | pass | 0.2 ms |
| eval E1 over HTTP | pass | 2.1 ms |
| eval E1b in process | pass | 0.2 ms |
| eval E1b over HTTP | pass | 2.3 ms |
| eval E2 in process | pass | 0.2 ms |
| eval E2 over HTTP | pass | 2.2 ms |
| eval E3 in process | pass | 0.2 ms |
| eval E3 over HTTP | pass | 2.6 ms |
| eval E4 in process | pass | 0.1 ms |
| eval E4 over HTTP | pass | 2.4 ms |
| eval E5 in process | pass | 0.1 ms |
| eval E5 over HTTP | pass | 2.8 ms |
| GET /health returns 200 | pass | 1.4 ms |
| POST /run refuses bad JSON | pass | 2.4 ms |
| T12 and T13: live OpenAI run of new5_closed3 sends 10 requests to OpenAI only | pass | 42.1 ms |
| T14: OpenAI HTTP 401 rejects with model_http_401 | pass | 2.0 ms |
| E1: empty OpenAI key gives mock in auto mode and an error in live mode | pass | 1.6 ms |
| E2: wrong provider name throws | pass | 2.6 ms |
| E3: tool arguments that are not JSON give an invalid_input tool result | pass | 4.6 ms |
| toOpenAI maps system, tools, tool calls and tool results | pass | 1.6 ms |
| fromOpenAI maps text and tool calls to content blocks | pass | 0.4 ms |
| provider picks openai when only OPENAI_API_KEY is set | pass | 2.3 ms |
| privacy: no model message contains example.test or requester | pass | 20.9 ms |
| logs: no log line contains a subject or a body from the fixture | pass | 5.6 ms |
| confidence of exactly 0.6 does not go to review | pass | 0.9 ms |
| a team that is not in the configuration is bad_output and goes to review | pass | 0.9 ms |
| the body sent to the model has a maximum of 8000 characters | pass | 1.2 ms |
| validateTicket codes | pass | 0.3 ms |
| request errors | pass | 0.5 ms |
| config_unavailable when the configuration path does not exist | pass | 0.3 ms |
| fetch_new_tickets returns only new tickets with no team and no priority | pass | 2.5 ms |
| fetch_new_tickets refuses limit 0 with invalid_input | pass | 0.8 ms |
| fetch_new_tickets maps an adapter failure to ticket_api_unavailable | pass | 0.3 ms |
| update_ticket refuses a bad team, priority or reason with invalid_input | pass | 2.1 ms |
| update_ticket returns ticket_already_triaged and ticket_not_found | pass | 0.7 ms |
| update_ticket writes one update and the fake records it | pass | 0.6 ms |
| get_triage_rules returns 5 teams and 4 priorities | pass | 0.4 ms |
| get_triage_rules returns config_unavailable for a path that does not exist | pass | 0.3 ms |
| get_triage_rules refuses an input that is not an empty object | pass | 0.4 ms |

## System: systems/research-summary/

Command: AGENT_MODE=mock npm test
Totals: 87 tests, 87 pass, 0 fail (0 skipped, 0 cancelled). Expected by design: 87.

Command: AGENT_MODE=mock npm run evals
Result: `all 20 cases passed` (20 of 20). Exit code 0.

| Test | Result | Duration |
| --- | --- | --- |
| T2: lib/ files are byte copies of the template lib/ | pass | 1.3 ms |
| T8, T9, T10: .env.example has the OpenAI model keys and no Anthropic variables | pass | 1.2 ms |
| T11: README environment variable table agrees with .env.example | pass | 0.5 ms |
| eval T1 in process | pass | 10.9 ms |
| eval T1 over HTTP | pass | 32.8 ms |
| eval T2 in process | pass | 0.9 ms |
| eval T2 over HTTP | pass | 5.6 ms |
| eval T3 in process | pass | 0.5 ms |
| eval T3 over HTTP | pass | 9.1 ms |
| eval T4 in process | pass | 0.9 ms |
| eval T4 over HTTP | pass | 4.6 ms |
| eval T5 in process | pass | 0.9 ms |
| eval T5 over HTTP | pass | 3.7 ms |
| eval T6 in process | pass | 0.5 ms |
| eval T6 over HTTP | pass | 6.6 ms |
| eval T7 in process | pass | 0.5 ms |
| eval T7 over HTTP | pass | 8.1 ms |
| eval T8 in process | pass | 0.4 ms |
| eval T8 over HTTP | pass | 11.9 ms |
| eval T9 in process | pass | 0.7 ms |
| eval T9 over HTTP | pass | 12.9 ms |
| eval T10 in process | pass | 2.7 ms |
| eval T10 over HTTP | pass | 3.8 ms |
| eval T11 in process | pass | 0.3 ms |
| eval T11 over HTTP | pass | 2.5 ms |
| eval T12 in process | pass | 0.5 ms |
| eval T12 over HTTP | pass | 4.3 ms |
| eval T13 in process | pass | 0.3 ms |
| eval T13 over HTTP | pass | 2.5 ms |
| eval T14 in process | pass | 0.8 ms |
| eval T14 over HTTP | pass | 3.1 ms |
| eval T15 in process | pass | 0.3 ms |
| eval T15 over HTTP | pass | 1.8 ms |
| eval E1 in process | pass | 0.1 ms |
| eval E1 over HTTP | pass | 2.9 ms |
| eval E1b in process | pass | 0.1 ms |
| eval E1b over HTTP | pass | 4.8 ms |
| eval E2 in process | pass | 0.1 ms |
| eval E2 over HTTP | pass | 3.1 ms |
| eval E2b in process | pass | 0.1 ms |
| eval E2b over HTTP | pass | 2.6 ms |
| eval E2c in process | pass | 0.1 ms |
| eval E2c over HTTP | pass | 1.4 ms |
| T15: each case with an output uses 5 model calls or fewer, and no case returns max_turns | pass | 6.1 ms |
| GET /health returns 200 | pass | 2.7 ms |
| POST /run refuses bad JSON | pass | 2.8 ms |
| T14 grounding: What is CRISPR? | pass | 4.0 ms |
| T14 grounding: How do vaccines train the immune system? | pass | 2.3 ms |
| T14 grounding: What causes ocean tides? | pass | 0.7 ms |
| T14 grounding: How does photosynthesis work? | pass | 0.7 ms |
| T14 grounding: What is a black hole? | pass | 0.5 ms |
| T12 and T13: live OpenAI run of What is CRISPR? sends 2 requests to OpenAI only | pass | 30.6 ms |
| T14: OpenAI HTTP 401 rejects with model_http_401 | pass | 2.1 ms |
| E1: empty OpenAI key gives mock in auto mode and an error in live mode | pass | 1.6 ms |
| E2: wrong provider name throws | pass | 1.4 ms |
| E3: tool arguments that are not JSON give an invalid_input tool result | pass | 3.2 ms |
| toOpenAI maps system, tools, tool calls and tool results | pass | 1.6 ms |
| fromOpenAI maps text and tool calls to content blocks | pass | 0.4 ms |
| provider picks openai when only OPENAI_API_KEY is set | pass | 1.9 ms |
| T7: each source item has n equal to index + 1 and a non-empty title, url and source | pass | 8.4 ms |
| T8 and T9: summary is not empty, has 250 words or fewer, and each sentence has 1 or more markers | pass | 2.0 ms |
| T10: each [n] in summary is an n in sources | pass | 2.2 ms |
| E1 and E2: empty or invalid input gives 0 adapter calls and 0 model calls | pass | 0.4 ms |
| input of exactly 500 letters a is valid and gives no_results | pass | 0.3 ms |
| the question is trimmed before the search | pass | 0.4 ms |
| max_turns: a model that always returns a tool_use block stops after 5 calls | pass | 0.5 ms |
| bad_output: the text not json in turn 2 gives bad_output | pass | 0.3 ms |
| summary_invalid: a summary with only invalid markers gives summary_invalid | pass | 0.6 ms |
| no_results also when the agent fails and the registry is empty | pass | 0.6 ms |
| source_not_searched: a model that calls only search_web names the other sources | pass | 0.4 ms |
| a tool input with a query is refused by the agent loop and the adapter is not called | pass | 0.3 ms |
| privacy: after two requests, a third request shows only its own question in search_calls | pass | 0.6 ms |
| source registry: a duplicate URL gets the existing n and duplicate true and adds no item | pass | 1.6 ms |
| source registry: source warnings in the fixed sequence | pass | 0.4 ms |
| clean_summary: a sentence with no marker is removed with sentence_removed | pass | 0.7 ms |
| clean_summary: an invalid marker is removed with one space, and the sentence stays if it has a valid marker | pass | 0.2 ms |
| clean_summary: a text of 300 words in 6 sentences is cut to 250 words or fewer with summary_truncated | pass | 0.8 ms |
| clean_summary: a text with only invalid markers gives an empty result | pass | 0.3 ms |
| fake search: records calls, returns deep copies, [] for an unknown query and throws on error | pass | 0.8 ms |
| search_web maps snippet, numbers results from 1 and keeps a maximum of 3 | pass | 2.5 ms |
| search_encyclopedia maps extract to snippet and returns empty for 0 results | pass | 0.6 ms |
| search_papers maps abstract to snippet and keeps authors and year | pass | 0.4 ms |
| a second run({}) returns the same object and the adapter records 1 call only | pass | 0.3 ms |
| an adapter failure gives status error and source_unavailable, and the tool does not throw | pass | 0.4 ms |
| the tool input schema refuses a query | pass | 0.3 ms |
| results without a non-empty title, url or snippet are removed and snippets are cut to 1000 characters | pass | 0.4 ms |
| a duplicate URL from another tool gets the existing n and duplicate true | pass | 0.4 ms |

## Failures

None. 0 of 165 tests failed. 0 of 40 evaluation cases failed.

| Test | File:line | Root cause | Suggested correction |
| --- | --- | --- | --- |
| none | - | - | - |

## Evaluation case coverage

Each case in the `design.md` "Evaluation cases" table has one test or one check. The design sets these cases as unit tests, file checks or git checks and forbids a change to `evals/cases.json` (G5). Thus the IDs T1 to T16 and E1 to E3 of the design are not in `evals/cases.json`. The IDs in `evals/cases.json` (20 cases in each system, for example `T5` and `E1b`) are the older functional cases and are a separate set. The two sets use the same ID names. This is a naming overlap in the design, not a missing test. `evals/cases.json` is unchanged in the branch diff.

| Design case | Where checked | Result |
| --- | --- | --- |
| T1 | support-triage `tests/config.test.js` "T1: lib/ files are byte copies..." | pass. Also `cmp` of 3 files: identical. |
| T2 | research-summary `tests/config.test.js` "T2: ..." | pass. Also `cmp` of 3 files: identical. |
| T3 | support-triage `tests/llm.test.js` (3 tests) | pass. `cmp` with template `tests/llm.test.js`: identical. |
| T4 | support-triage `tests/env.test.js` "T4: the server loads .env at start" (port 3944) | pass |
| T5 | support-triage `tests/env.test.js` "T5: a shell value wins over a .env value" (port 3945) | pass |
| T6, T7, T10 | support-triage `tests/config.test.js` | pass |
| T8, T9, T10 | research-summary `tests/config.test.js` | pass |
| T11 | `tests/config.test.js` in both systems | pass |
| T12, T13 | `tests/live-openai.test.js` in both systems (10 requests and 2 requests, OpenAI URL only) | pass |
| T14 | `tests/live-openai.test.js` in both systems (`model_http_401`) | pass |
| T15 | `npm test` and `npm run evals` in both systems | pass. 78 of 78, 87 of 87, 20 of 20 and 20 of 20. Equal to the design counts. |
| T16 | git check | pass. `git ls-files` has no path with basename `.env`. `git diff main...HEAD` has 0 matches of the OpenAI secret key prefix. Only `test-key-not-real` is used as key value. |
| E1 | `tests/live-openai.test.js` in both systems | pass |
| E2 | `tests/live-openai.test.js` in both systems | pass |
| E3 | `tests/live-openai.test.js` in both systems | pass |

The 40 cases of `evals/cases.json` (20 in each system) each have an "in process" test and an "over HTTP" test in `tests/evals.test.js`.

## Tool unit tests

| System | Tool | Unit tests in `tests/tools.test.js` |
| --- | --- | --- |
| support-triage | `fetch_new_tickets` | 3 |
| support-triage | `update_ticket` | 3 |
| support-triage | `get_triage_rules` | 3 |
| research-summary | `search_web` | `search_web maps snippet...` |
| research-summary | `search_encyclopedia` | `search_encyclopedia maps extract...` |
| research-summary | `search_papers` | `search_papers maps abstract...` |

`research-summary/tools/search-tool.js` is the shared helper of the three search tools. Its behavior is tested through the tool tests (error, duplicate, filter and cache tests).

## Other checks

- `lib/llm.js`, `lib/agent-loop.js`, `lib/schema.js`: byte-identical to `okati/templates/agent-system/lib/` in both systems (G1).
- `support-triage/server.js` diff: only the comment line and the `process.loadEnvFile` line. `research-summary/server.js`: no change (G7).
- Branch diff against `main`: no change in `agents/`, `tools/`, `orchestrator.js`, `package.json`, `evals/cases.json` or in existing tests (G5). Only 6 test files were added. `package.json` has no new dependency (G6).
- Both `.env.example` files and both README tables have no `ANTHROPIC_API_KEY` and no `AGENT_MODEL`. The two names occur in the diff only in the template `lib/llm.js` and in tests that assert their absence or delete them from `process.env`.
- Both live-test files assert 0 requests to `api.anthropic.com` (G4).
- `git status` in the worktree is clean. No `.env` file exists in either system folder (G2).

## Missing tests

None.
