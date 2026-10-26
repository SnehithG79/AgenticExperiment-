APPROVE

# Review: round 2

Branch: `okati/20261026-research-summary` (HEAD 719bb61). Diff: `git diff main...okati/20261026-research-summary`, 30 files, all in `systems/research-summary/`. The only change since round 1 (9786046) is one line in `README.md`.
I ran `AGENT_MODE=mock npm test` in the worktree again: 79 tests, 79 pass.

## Report results
Test: PASS
Visual: PASS

## Checks

- Human decision (`needs-human-round-1.md`): keep the `.env` load, shell values have priority, Git ignores `.env`, the two round 1 CHANGE items are cancelled. This review gives no item against it.
- Security: no secret in the code. The only key value is `test-key-not-real` in the template file `tests/llm.test.js`. No `.env` file is tracked or in any commit (`git log --all -- systems/research-summary/.env` is empty). `.env.example` has empty values for each secret. Tool input is validated by `lib/agent-loop.js` against an empty-object schema, so the model cannot give a query. The agent has no fetch tool. The HTTP adapter is selected only with `SEARCH_ADAPTER=http`, encodes the query, has a 10 second timeout and turns each failure into `source_unavailable`. The server listens on 127.0.0.1 and refuses ports outside 3000 to 3999.
- `lib/` compared with `okati/templates/agent-system/lib/` on `main` (template changed in 9efd982 after round 1): `agent-loop.js`, `llm.js` and `schema.js` are identical. No extra or missing file. `evals/run-evals.js` is identical. `server.js` differs from the template only in the default port 3217.
- Key handling table of `design.md`: `server.js` line 46 calls `process.loadEnvFile(new URL("./.env", import.meta.url))` in a `try` block before `checkPort`, in the start block only. `process.loadEnvFile` does not replace a set variable, so shell values have priority. `.gitignore` has `node_modules/` and `.env`. `.env.example` line 1 tells the user to copy it to `.env` and it lists all 13 variables of the table. `README.md` now states that `npm start` reads `.env`, that shell values have priority, that Git ignores `.env` and that a key or `.env` must not be committed. All rows are obeyed.
- Guardrails of `design.md`: researcher 1 to 10 are obeyed (empty input schema, registry cache gives 1 adapter call for each source, no fetch tool, prompt lines 1 to 10 as designed, `clean_summary` removes invalid markers, sentences with no marker and words over 250, `MAX_TURNS` 5 in the agent loop). Orchestrator 1 to 11 are obeyed (validation before any adapter or model call, `no_results`, maximum 3 items for each source and no duplicate URL, marker check, failed source has no items, new adapters and registry for each request with no logs and no file writes, snippet cut to 1000 characters, keys only from the environment or the git-ignored `.env`, fake adapters by default, no test loads `.env`, `.env` stays in `.gitignore`).
- Quality: the structure and names follow the design folder table. Adapter errors and map errors are caught in the tool, agent errors are mapped to `max_turns` and `bad_output`, and other errors give `internal_error`.

## Items
| Label | File | Problem | Required correction |
|-------|------|---------|---------------------|
| NOTE | systems/research-summary/tests/evals.test.js | The file sets `AGENT_MODE=mock` but not `SEARCH_ADAPTER=fake` (the other test files set both). If a user exports `SEARCH_ADAPTER=http` in the shell, this test file would use the HTTP adapter. Tests do not load `.env`, so a `.env` value has no effect. The file is a copy of the template. | No correction is necessary. Optional: set `process.env.SEARCH_ADAPTER = "fake"` at the top. |
| NOTE | systems/research-summary/README.md | The environment variable table does not have rows for `AGENT_PROVIDER`, `OPENAI_API_KEY` and `OPENAI_MODEL`. Line 61 names them, and the Key handling table does not require rows. | No correction is necessary. |
| NOTE | systems/research-summary/README.md | The README graph leaves out the adapter nodes and the edges `source_registry -> check_results` and `source_registry -> clean_summary` from the design graph (carried from round 1). | No correction is necessary. |
| NOTE | systems/research-summary/steps/clean-summary.js | A marker with a leading zero, for example `[07]`, is kept as `[07]` (carried from round 1). The design does not cover this case. | No correction is necessary. |
| NOTE | systems/research-summary/tools/search-tool.js | `title` has no length limit. Guardrail 7 limits only the snippet (carried from round 1). | No correction is necessary. |
| NOTE | systems/research-summary/adapters/http-search.js | The response body size is not limited before `res.json()` (carried from round 1). The adapter is not used in tests or in the localhost run. | No correction is necessary. |
| NOTE | round-2/build.md | The localhost run on port 3217 was not done by the coding agent. The localhost agent does the full run. | No correction is necessary. |

## Escalation
