# Build: round 1

Worktree: `/home/user/.okati/worktrees/20261026-support-triage`. Branch: `okati/20261026-support-triage`.
System folder: `systems/support-triage/` (at the repository root of the branch, as `README.md` and the okati skill specify).

## Changed files

All paths are relative to `systems/support-triage/`.

| File | Change |
|------|--------|
| `lib/agent-loop.js`, `lib/llm.js`, `lib/schema.js` | Copied from the template. Not changed (checked with `cmp`). |
| `agents/triager.js` | New. Agent `triager`: prompt, output schema (enums from the configuration at module load), mock policy, tool `get_triage_rules` only. |
| `tools/get-triage-rules.js` | New. Tool `get_triage_rules`, plus `loadConfig()` and `configPath()` (reads `TRIAGE_CONFIG`). Validates the configuration. Error `config_unavailable`. |
| `tools/fetch-new-tickets.js` | New. Tool factory `createFetchNewTicketsTool(api)`. Default limit 100. Error `ticket_api_unavailable`. |
| `tools/update-ticket.js` | New. Tool factory `createUpdateTicketTool(api, config)`. Enums from the configuration. Errors `ticket_not_found`, `ticket_already_triaged`, `update_failed`. |
| `adapters/ticket-api.js` | New. `createFakeTicketApi(records, { failUpdateIds })` with `calls` and `accuracy()`. `createRestTicketApi(env)` (used only with `TICKET_ADAPTER=rest`). |
| `adapters/state-store.js` | New. `createMemoryStore(initialIds)`. |
| `adapters/clock.js` | New. `fixedClock(iso)`, `systemClock()`. |
| `orchestrator.js` | Replaced. `run(input, options)`, `triageRun(ctx)`, `callTool`, `validateTicket`, review routing, counting model wrapper, JSON line logger, `createScheduledRunner()`. |
| `server.js` | Default port 3142. Optional schedule (`TRIAGE_INTERVAL_MINUTES`). |
| `package.json` | Name and description. Scripts start, test, evals. |
| `.env.example` | All environment variables of the design, with no secret values. |
| `README.md` | Goal, agent graph, commands, environment variables. |
| `fixtures/tickets.json` | 27 records and 6 sets as the design specifies. |
| `fixtures/model_responses.json` | 20 stub responses as the design specifies. |
| `fixtures/triage_config.json` | Configuration as the design specifies. |
| `evals/cases.json` | 20 cases: T1 to T10 (with T7b, T7c, T8b, T8c), E1, E1b, E2, E3, E4, E5. `S(...)` written as full summary objects. |
| `evals/run-evals.js` | Usage comment changed to port 3142. |
| `tests/tools.test.js` | New. Unit tests for `fetch_new_tickets`, `update_ticket`, `get_triage_rules`. |
| `tests/adapters.test.js` | New. Unit tests for the fake ticket API, the state store and the clocks. |
| `tests/orchestrator.test.js` | New. Privacy, log content, confidence 0.6, schema refusal of an unknown team, 8000-character body cut, validation codes, request errors, `config_unavailable`. |
| `tests/evals.test.js` | One test for each evaluation case in process and over HTTP (port 3942). Extra reason-length check for T6. |
| Removed | `agents/counter.js`, `tools/count-words.js`, `tests/count-words.test.js`, `TEMPLATE.md` (template sample files). |

## Commits

| Commit | Message |
|--------|---------|
| `a7afb2b` | `okati(20261026-support-triage): round 1, copy agent-system template` |
| `5d1cbda` | `okati(20261026-support-triage): round 1, triage agent, tools, adapters, orchestrator, evals and tests` |

## CHANGE items corrected

None. This is round 1.

## Test result before commit

`npm test` in `systems/support-triage/`: 65 tests, 65 pass, 0 fail.
`node evals/run-evals.js` (in process, `AGENT_MODE=mock`): all 20 cases passed.
Localhost check (`AGENT_MODE=mock PORT=3142 npm start`): `GET /health` returned `{"status":"ok","mode":"mock"}`. `POST /run` with `{"ticket_set":"all"}` returned the summary `S(23,20,3,0,3,0)`. `node evals/run-evals.js --url http://localhost:3142`: all 20 cases passed.

## Items not complete

None of the design items are open. Decisions where the design was not exact:

1. `fixedClock(iso)` and `systemClock()` return a clock function. Calling the function returns the ISO string.
2. If `runAgent` throws an error that is not an `AgentError` (for example a live HTTP error), the orchestrator counts it as one failed model attempt. It uses the same retry and the same invalid-output review route. The `model_retry` log code is then `model_error`.
3. The scheduled run logs a `run_failed` event (with a code only) when the fetch or the configuration fails. The design does not list this event.
4. The configuration check also requires `review_tag` and `language` to be non-empty strings, because the review route uses them.
5. With `TICKET_ADAPTER=rest`, `POST /run` uses the rest adapter and ignores the fixture selection. `updates` comes from the updates that the orchestrator recorded. There is no `accuracy`. The rest adapter reads the ticket before the `PATCH` and refuses a ticket with a team, a priority or a status other than `new` (`ticket_already_triaged`). The rest adapter is not tested against a live service.
6. A failed update is not retried in the same run. With `runs` more than 1, a later run can try that ticket again because the ID is not in the state store.
