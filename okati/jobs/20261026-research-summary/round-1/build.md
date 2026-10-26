# Build: round 1

## Changed files

All paths are in `systems/research-summary/` on branch `okati/20261026-research-summary`. The worktree is `.okati/worktrees/20261026-research-summary/`.

Copied from `okati/templates/agent-system/` and kept unchanged:
- `lib/agent-loop.js`, `lib/llm.js`, `lib/schema.js` (identical to the template, checked with `diff -r`)
- `evals/run-evals.js`, `tests/llm.test.js`, `.gitignore`

Copied from the template and changed:
- `server.js`: the default `PORT` is now 3217. No other change.
- `orchestrator.js`: `validateInput`, `checkResults`, `createApis` (fake by default, http only with `SEARCH_ADAPTER=http`), `run(input, { apis, modelFor })` with a counting model wrapper, and output assembly.
- `package.json`: the name and description.
- `README.md`: goal, agent graph, commands, API, environment variables.
- `.env.example`: the variables from the design table. It also lists the optional OpenAI variables that `lib/llm.js` supports. No secret values.
- `evals/cases.json`: T1 to T15, E1, E1b, E2 (no `input` key), E2b, E2c (501 letters `a`). All abbreviations are written out in full.
- `tests/evals.test.js`: `TEST_PORT` default is 3917. Added the T15 check: `model_calls` is 5 or less for each case with an output, and no case returns `max_turns`.

Removed (template example only): `agents/counter.js`, `tools/count-words.js`, `tests/count-words.test.js`, `TEMPLATE.md`.

New:
- `agents/researcher.js`: `createResearcher(tools)`, the 10-line system prompt, the output schema and the `mock(messages)` policy
- `tools/search-tool.js`: `createSearchTool({ name, source, description, api, question, registry, map })`
- `tools/search-web.js`, `tools/search-encyclopedia.js`, `tools/search-papers.js`
- `steps/source-registry.js`: `createSourceRegistry()`
- `steps/clean-summary.js`: `cleanSummary(text, registry)`
- `adapters/fake-search.js`: `createFakeSearch(fixture, { fail })`
- `adapters/http-search.js`: `createHttpSearch({ url, key, map })`. It is not used in tests.
- `fixtures/web_results.json`, `fixtures/encyclopedia_results.json`, `fixtures/paper_results.json`, `fixtures/model_responses.json`
- `tests/tools.test.js`: unit tests for each tool (`search_web`, `search_encyclopedia`, `search_papers`), plus the factory tests from the design: 10 results give 3 results, a second `run({})` returns the same object with 1 adapter call, `fail: true` gives `status: "error"` with no throw, and the input schema refuses `{"query": "x"}`. Also tests result filtering, the 1000-character snippet cut and duplicate URLs across tools.
- `tests/steps.test.js`: source registry (duplicate URL, warning sequence), `clean_summary` (sentence with no marker, invalid marker, cut from 300 words to 250, only invalid markers give an empty result), fake adapter
- `tests/orchestrator.test.js`: T7, T8/T9 and T10 for Q1 to Q6. E1/E2 inputs give 0 adapter calls and 0 model calls. 500 letters `a` gives `no_results`. Also tests `max_turns` after 5 calls, `bad_output`, `summary_invalid`, `no_results` when the agent fails and the registry is empty, `source_not_searched`, a refused query input, and privacy across 3 requests.
- `tests/grounding.test.js`: T14 for Q1 to Q5 (key terms in the cited snippets; the `expect_removed` sentence is not in the output)

## Commits

- `751626a okati(20261026-research-summary): round 1, copy agent-system template`
- `9786046 okati(20261026-research-summary): round 1, researcher agent, search tools, source registry, clean_summary, orchestrator, evals and tests`

## CHANGE items corrected

None. This is round 1.

## Test result before commit

`npm test` in `systems/research-summary/`: 79 tests, 79 pass, 0 fail.
`AGENT_MODE=mock node evals/run-evals.js`: all 20 cases passed.
`tests/evals.test.js` also sends each case over HTTP to a test server on port 3917, and all of them pass.

## Items not complete

- I did not do the localhost run (`npm start` on port 3217 with curl checks). The permission system refused to start a background server from this agent. The localhost agent runs it.
- The `http-search` adapter has no unit test. The design says not to use the HTTP adapter in tests (guardrail 9).
- Design choices to note (no design change):
  - When an adapter fails, the tool also stores the error result in the registry. A second tool call then returns the stored error and does not call the adapter again (guardrail 2).
  - `sourceWarnings()` checks for a failure before it checks for a missing result.
  - In `clean_summary`, the warning `citation_removed:<n>` uses the number value of `n`.
