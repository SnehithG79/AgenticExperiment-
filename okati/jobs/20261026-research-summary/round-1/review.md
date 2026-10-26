CHANGES

# Review: round 1

Branch: `okati/20261026-research-summary` (HEAD 9786046). Diff: `git diff main...okati/20261026-research-summary`, 30 files, all in `systems/research-summary/`.
I ran `AGENT_MODE=mock npm test` in the worktree again: 79 tests, 79 pass.

## Report results
Test: PASS
Visual: PASS

## Checks

- Security: no secret in the code (only `test-key-not-real` in the template file `tests/llm.test.js`). Tool input is validated by `lib/agent-loop.js` against an empty-object schema, so the model cannot give a query. The agent has no fetch tool. The HTTP adapter is selected only with `SEARCH_ADAPTER=http`, encodes the query, has a 10 second timeout and turns each failure into `source_unavailable`. The server listens on 127.0.0.1 and refuses ports outside 3000 to 3999.
- `lib/` compared with `okati/templates/agent-system/lib/` on `main`: `agent-loop.js`, `llm.js` and `schema.js` are identical. No extra or missing file. `evals/run-evals.js` is also identical.
- Guardrails of `design.md`: researcher 1 to 10 are obeyed (empty input schema, registry cache gives 1 adapter call for each source, no fetch tool, prompt lines 1 to 10 as designed, `clean_summary` removes invalid markers, sentences with no marker and words over 250, `MAX_TURNS` 5). Orchestrator 1 to 7 and 9 are obeyed (validation before any adapter or model call, `no_results`, maximum 3 items for each source and no duplicate URL, marker check, failed source has no items, new adapters and registry for each request with no logs and no file writes, snippet cut to 1000 characters, fake adapters by default). Orchestrator guardrail 8 is not obeyed: see the CHANGE item.
- Quality: the structure and names follow the design folder table. Adapter errors and map errors are caught in the tool, agent errors are mapped to `max_turns` and `bad_output`, and other errors give `internal_error`.

## Items
| Label | File | Problem | Required correction |
|-------|------|---------|---------------------|
| CHANGE | systems/research-summary/server.js | Line 46 calls `process.loadEnvFile(new URL("./.env", import.meta.url))`. This reads `ANTHROPIC_API_KEY`, `WEB_SEARCH_KEY` and `PAPERS_KEY` from a file in the repository folder. Orchestrator guardrail 8 says the system reads these keys from the environment only. `server.js` is not a fixed template file, so the coding agent can change it. | Remove the `.env` load (line 45 and line 46) from `server.js`. Keys come only from `process.env`. |
| CHANGE | systems/research-summary/README.md, systems/research-summary/.env.example | The README says "To add keys, copy `.env.example` to `.env` in this folder. `npm start` reads `.env`." Line 1 of `.env.example` says "Copy this file to .env in the same folder". This tells the user to store keys in a file in the repository, against guardrail 8. | Change the text: set the variables in the shell environment (for example `export ANTHROPIC_API_KEY=...` before `npm start`). Keep `.env.example` as a list of the variable names with no values. Keep `.env` in `.gitignore`. |
| NOTE | systems/research-summary/steps/clean-summary.js | A marker with a leading zero, for example `[07]`, is kept as `[07]` because `Number("07")` is 7 and 7 is in the registry. The design does not cover this case, and the mock does not produce it. | No correction is necessary. Optional: rewrite a kept marker as `[${n}]`. |
| NOTE | systems/research-summary/tools/search-tool.js | `title` has no length limit. Guardrail 7 limits only the snippet. With the HTTP adapter a very long title goes to the model. | No correction is necessary. |
| NOTE | systems/research-summary/adapters/http-search.js | The response body size is not limited before `res.json()`. The 10 second timeout limits the time only. The adapter is not used in tests or in the localhost run. | No correction is necessary. |
| NOTE | systems/research-summary/.env.example | It also lists `AGENT_PROVIDER`, `OPENAI_API_KEY` and `OPENAI_MODEL`, which are not in the design table. `lib/llm.js` from the template supports them, and the file has no values. | No correction is necessary. |
| NOTE | systems/research-summary/README.md | The README graph leaves out the adapter nodes (`web_api`, `encyclopedia_api`, `papers_api`) and the edges `source_registry -> check_results` and `source_registry -> clean_summary` from the design graph. | No correction is necessary. |
| NOTE | round-1/build.md | The localhost run on port 3217 was not done by the coding agent. The visual agent started the server once and `GET /health` and `POST /run` worked. The localhost agent does the full run. | No correction is necessary. |

## Escalation
