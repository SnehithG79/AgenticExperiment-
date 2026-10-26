blocked: false

# Plan: Switch systems to OpenAI keys

## Goal

Make `support-triage` and `research-summary` use OpenAI keys in live mode, with the current template library and no Anthropic variables.

Scope: change the two existing systems in `/home/user/systems/`. Do not build a new system.

## Tasks and acceptance criteria

| ID | Task | Acceptance criterion |
| --- | --- | --- |
| T1 | Replace `systems/support-triage/lib/` with the current template library. | `llm.js`, `agent-loop.js` and `schema.js` are byte-identical to the files in `okati/templates/agent-system/lib/`. |
| T2 | Keep `systems/research-summary/lib/` equal to the template library. | `llm.js`, `agent-loop.js` and `schema.js` are byte-identical to the files in `okati/templates/agent-system/lib/`. |
| T3 | Add the template OpenAI translation tests to `support-triage`. | `support-triage/tests/llm.test.js` exists. `npm test` runs its 3 tests and all 3 pass. |
| T4 | Make `support-triage` load a local `.env` file at start, as the template does. | A temporary copy has a fixture `.env` with `AGENT_PROVIDER=openai` and a fake key. `GET /health` returns `"mode":"live"`. |
| T5 | Make sure that shell values win over `.env` values in `support-triage`. | Same fixture `.env`, with `AGENT_MODE=mock` in the shell. `GET /health` returns `"mode":"mock"`. |
| T6 | Change the model variables in `support-triage/.env.example`. | The model keys are exactly `AGENT_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`. `AGENT_PROVIDER` is `openai`. The other two are empty. |
| T7 | Keep the non-model variables in `support-triage/.env.example`. | The file has the keys `PORT`, `AGENT_MODE`, `TICKET_ADAPTER`, `TICKET_API_URL`, `TICKET_API_TOKEN`, `TRIAGE_CONFIG`, `TRIAGE_INTERVAL_MINUTES`, `TRIAGE_CLOCK`, `TRIAGE_LOG`. |
| T8 | Change the model variables in `research-summary/.env.example`. | The model keys are exactly `AGENT_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`. `AGENT_PROVIDER` is `openai`. The other two are empty. |
| T9 | Keep the non-model variables in `research-summary/.env.example`. | The file has the keys `PORT`, `AGENT_MODE`, `SEARCH_ADAPTER`, `WEB_SEARCH_URL`, `WEB_SEARCH_KEY`, `ENCYCLOPEDIA_URL`, `PAPERS_URL`, `PAPERS_KEY`. |
| T10 | Remove all Anthropic variables from both `.env.example` files. | No line, comments included, contains the exact name `ANTHROPIC_API_KEY` or `AGENT_MODEL`. The test matches whole names, so `AGENT_MODE` passes. |
| T11 | Update the environment variable table in both `README.md` files. | Each table has rows for the three OpenAI variables and no `ANTHROPIC_API_KEY` or `AGENT_MODEL` row. Table names equal `.env.example` keys. |
| T12 | Make the live OpenAI path work in both systems with a test double. | With a fetch stub and fixture responses, one evaluation case for each system in live mode matches its `expected` value. |
| T13 | Send live model requests only to OpenAI. | In T12, each request goes to `https://api.openai.com/v1/chat/completions` with `Bearer test-key-not-real` and the `OPENAI_MODEL` value. Zero requests go to `api.anthropic.com`. |
| T14 | Report an OpenAI HTTP error correctly. | The fetch stub returns status 401. `model.call()` rejects with the error message `model_http_401`. |
| T15 | Keep all existing behavior in mock mode. | `npm test` and `npm run evals` pass in both systems. The pass count is the old count plus the new tests. |
| T16 | Do not commit a key or a `.env` file. | `git ls-files` on the branch shows no `.env` file. The branch diff contains no `sk-` string and no key value. |
| E1 | Empty input: the OpenAI key is empty. | With `AGENT_PROVIDER=openai` and empty `OPENAI_API_KEY`, `auto` gives mode `mock`. `live` throws `AGENT_MODE=live needs OPENAI_API_KEY`. |
| E2 | Input that is not valid: the provider name is wrong. | With `AGENT_PROVIDER=gpt`, `provider()` throws `AGENT_PROVIDER must be anthropic or openai, got gpt` in both systems. |
| E3 | Input that is not valid: the OpenAI tool arguments are not JSON. | A fixture tool call has arguments `{bad`. The agent loop returns a tool result with `invalid_input`. The process does not stop. |

## External services and data

| Service | Use | Test double |
| --- | --- | --- |
| OpenAI Chat Completions API | Model calls in live mode for both systems. Needs `OPENAI_API_KEY` and `OPENAI_MODEL`. | Stub `globalThis.fetch` in the test. Fixture `fixtures/openai_responses.json` in each system holds Chat Completions bodies. Make them from `fixtures/model_responses.json`. Use key `test-key-not-real`. Add one 401 fixture. |
| Anthropic Messages API | Not used after this change. The template `llm.js` keeps the code path. | The same fetch stub records each URL. The test fails if a URL contains `api.anthropic.com`. |
| Ticket REST API (`support-triage`) | Reads and updates tickets. No change in this job. | The existing fake adapter with `fixtures/tickets.json` and `fixtures/triage_config.json`. `TICKET_ADAPTER=fake`. |
| Web, encyclopedia and paper search (`research-summary`) | Search sources. No change in this job. | The existing `adapters/fake-search.js` with `fixtures/web_results.json`, `fixtures/encyclopedia_results.json`, `fixtures/paper_results.json`. `SEARCH_ADAPTER=fake`. |
| Local `.env` file | Gives keys to `npm start`. Git ignores it. | A fixture `.env` in a temporary copy of the system folder. Its key is `test-key-not-real`. Never write a `.env` file in the repository folder. |
| Template folder `okati/templates/agent-system/` | Source of the library files and `tests/llm.test.js`. Read only. | No double. Use the files as they are. Do not copy the local `.env` file in this folder. |

## Open questions

| Question | Assumption |
| --- | --- |
| The request says "list only" the three variables. Does this remove the non-model variables too? | No. The user context says that non-model variables stay. Only the model variables change. |
| Which copy of `support-triage` changes: `/home/user/systems/` or `/home/user/agenticexperiment-/systems/`? | `/home/user/systems/`. It is in the same tree as the job folder. The other clone is out of scope. |
| Must `lib/llm.js` keep the Anthropic code path? | Yes. The template says "Do not change" for `lib/`. The library is a copy. `AGENT_PROVIDER=openai` selects OpenAI. |
| The old `support-triage/lib/agent-loop.js` reads `AGENT_MODEL`. Is it correct to lose this? | Yes. The OpenAI path reads `OPENAI_MODEL`. The template loop does not read `AGENT_MODEL`. |
| Must `OPENAI_MODEL` have a default value in `.env.example`? | No. Keep it empty, as in the template. The user writes the model name in the local `.env`. |
| Must the agent files change their `model: "claude-sonnet-5-5"` field? | No. The OpenAI path ignores this field. The template agent has the same field. Do not change the agents. |
| `support-triage/server.js` is not in `lib/`. Does it change? | Yes. The user context says that keys load from a local `.env` file. Add the template `.env` load step only. |
| `process.loadEnvFile` needs Node.js 20.12 or later. `package.json` says `>=20`. Is this a problem? | Assume Node.js 20.12 or later. The README tells the minimum version. Do not add a dependency. |
| Must the README files tell about the Anthropic option? | No. Remove the Anthropic rows. Do not add an Anthropic note. The request is to use OpenAI only. |
| `okati/templates/agent-system/.env` exists. Is it in Git? | Assume that Git ignores it, as the template `.gitignore` says. Do not read, copy or commit it. The orchestrator can examine it. |
| A user `.env` can still contain `ANTHROPIC_API_KEY`. Does this change the provider? | No. `AGENT_PROVIDER=openai` is explicit, so `provider()` returns `openai`. |
