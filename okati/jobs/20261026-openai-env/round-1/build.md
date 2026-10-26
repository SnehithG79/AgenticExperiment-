# Build: round 1

Worktree: `.okati/worktrees/20261026-openai-env/`. Branch: `okati/20261026-openai-env`.
System folders: `systems/support-triage/`, `systems/research-summary/`.

## Changed files

`systems/support-triage/`:

| File | Change |
| --- | --- |
| `lib/llm.js` | Byte copy of `okati/templates/agent-system/lib/llm.js`. |
| `lib/agent-loop.js` | Byte copy of the template file. The loop does not read `AGENT_MODEL`. |
| `lib/schema.js` | Byte copy of the template file (it was already equal, so git shows no change). |
| `server.js` | Added the template comment and the `process.loadEnvFile` line as the first lines of the main block, before `checkPort`. No other change. |
| `.env.example` | Rewritten to the design contract. 12 keys. |
| `README.md` | Environment table: removed the 2 Anthropic rows, added `AGENT_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL` after `AGENT_MODE`. Replaced the "Keys are read from the environment only" line with the design text. |
| `fixtures/openai_responses.json` | New. `rules_call`, `bad_arguments_call`, `final` (20 entries, made from `fixtures/model_responses.json`; `TCK-1020` uses the `raw` string), `http_401`. |
| `tests/llm.test.js` | New. Byte copy of the template `tests/llm.test.js`. 3 tests (T3). |
| `tests/env.test.js` | New. 2 tests: T4 (port 3944), T5 (port 3945). The fixture `.env` is written only in a temporary copy under `os.tmpdir()`, which is removed in `after`. |
| `tests/live-openai.test.js` | New. 5 tests: T12 with T13, T14, E1, E2, E3. `globalThis.fetch` stub, restored after each test. |
| `tests/config.test.js` | New. 3 tests: T1, T6 with T7 and T10, T11. |

`systems/research-summary/`:

| File | Change |
| --- | --- |
| `.env.example` | Rewritten to the design contract. 11 keys. |
| `README.md` | Environment table: removed the 2 Anthropic rows, added the 3 model rows after `AGENT_MODE`. Removed the "`lib/llm.js` also supports OpenAI" line. Added "`npm start` needs Node.js 20.12 or later." to the `.env` text. |
| `fixtures/openai_responses.json` | New. `search_calls`, `bad_arguments_call`, `final` (6 questions, made from `fixtures/model_responses.json`), `http_401`. |
| `tests/live-openai.test.js` | New. 5 tests: T12 with T13, T14, E1, E2, E3. |
| `tests/config.test.js` | New. 3 tests: T2, T8 with T9 and T10, T11. |

Not changed (as the design specifies): agents, tools, orchestrators, `package.json`, `evals/cases.json`, existing tests, `research-summary/lib/`, `research-summary/server.js`, `research-summary/tests/llm.test.js`.

## Commits

| Commit | Message |
| --- | --- |
| `0e8e57f` | `okati(20261026-openai-env): round 1, support-triage uses template lib and OpenAI env keys` |
| `160b10e` | `okati(20261026-openai-env): round 1, research-summary uses OpenAI env keys` |

## CHANGE items corrected

None. This is round 1.

## Test result before commit

| System | `npm test` | `npm run evals` |
| --- | --- | --- |
| `support-triage` | `# tests 78`, `# pass 78`, `# fail 0`, `# skipped 0` (was 65) | `all 20 cases passed` |
| `research-summary` | `# tests 87`, `# pass 87`, `# fail 0`, `# skipped 0` (was 79) | `all 20 cases passed` |

`node --test tests/llm.test.js` in `support-triage`: `# tests 3`, `# pass 3`.

Guardrail checks before commit:

- G1: the 3 `lib/` files in both systems are byte-identical to the template (`cmp`). `support-triage/tests/llm.test.js` is byte-identical to the template.
- G2 and T16: `git ls-files` has no path with the basename `.env`. No `.env` file was written in the repository.
- G3: `git diff main...HEAD` has 0 matches of the OpenAI secret key prefix. The only key value is `test-key-not-real`.
- G4: each live test stubs `globalThis.fetch` and asserts 0 URLs that contain `api.anthropic.com`.

## Items not complete

None.

Notes on the coder steps:

- Step 2 (copy the template into the system folder) was not done as a full copy. The design says that this job changes two existing systems and does not make a new system. Only the files that the design names were copied from the template (`lib/` and `tests/llm.test.js` in `support-triage`).
- Step 6: the design forbids a change to `evals/cases.json` (G5). The design evaluation cases T1 to T16 and E1 to E3 are unit tests in the new test files, or file and `git` checks (T15, T16), as the design specifies.
