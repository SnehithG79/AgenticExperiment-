APPROVE

# Review: round 2

Branch: `okati/20261026-support-triage` (commit `7df9614`). Diff: `git diff main...okati/20261026-support-triage` (25 files, all in `systems/support-triage/`). Round 2 changed only `systems/support-triage/lib/agent-loop.js` (`git diff 5d1cbda 7df9614`: 1 file, 5 insertions, 1 deletion).

## Report results
Test: PASS
Visual: PASS

## Items
| Label | File | Problem | Required correction |
|-------|------|---------|---------------------|
| NOTE | systems/support-triage/lib/agent-loop.js | Round 1 CHANGE item is corrected. All 3 files in `lib/` (`agent-loop.js`, `llm.js`, `schema.js`) are byte-equal to `main:okati/templates/agent-system/lib/` (checked with `diff` against `git show main:...`). No `lib/` file is missing or extra. `MAX_TURNS = 5` caps the loop; `triager` needs 2 turns, so the cap does not change the behavior. The reviewer ran the tests on a scratch copy of the branch: 65 tests, 65 pass; `AGENT_MODE=mock node evals/run-evals.js`: all 20 cases passed. | No correction is necessary. |
| NOTE | systems/support-triage/orchestrator.js | Security check (no change since round 1): no secrets in the code (search for keys, tokens and passwords found none). `ANTHROPIC_API_KEY` and `TICKET_API_TOKEN` come from the environment only. `.env.example` has no secret values, `.gitignore` has `.env` and no `.env` file is committed. `triager` has only `get_triage_rules`; `agent-loop.js` refuses an unknown tool and validates each tool input. `fetch_new_tickets` and `update_ticket` are called only by the orchestrator through `callTool`, which validates the input with `lib/schema.js`. The `POST /run` input is validated against `REQUEST_SCHEMA`, and the body is limited to 64 KiB. | No correction is necessary. |
| NOTE | systems/support-triage/orchestrator.js | Guardrails checked (no change since round 1). Agent: 1 no write tools; 2 and 3 enforced by the output schema (enums from the configuration, reason 1 to 200); 4 and 5 in the prompt, ticket sent as a JSON string. Orchestrator: 1 model input has only `ticket_id`, `subject`, `body` (privacy test); 2 body cut to 8000 characters (test); 3 no model call for invalid, processed or 0 tickets (E1, E1b, E2, T8b); 4 adapters refuse a ticket with a team, a priority or a status that is not `new`; 5 state store check (T8b); 6 no second update in a request (T8, T8c); 7 no status change and no customer reply (reason goes to an internal note); 8 logs have time, event, ID and code only (logs test); 9 and 10 a failed update is logged, not retried, and the run continues (T9, T10); 11 max 2 model attempts (`MAX_MODEL_ATTEMPTS`, T7c); 12 keys from the environment only; 13 rest adapter only with `TICKET_ADAPTER=rest`. | No correction is necessary. |
| NOTE | systems/support-triage/orchestrator.js | Carried from round 1: `validateTicket` does not check the ID length. A rest-adapter ticket with an ID longer than 64 characters gets a model call, then `update_ticket` refuses it with `invalid_input`, and each scheduled run classifies it again. | No correction is necessary in this job. A later design can add an ID length check to `validate_ticket`. |
| NOTE | systems/support-triage/server.js | Carried from round 1: with `TICKET_ADAPTER=rest`, `POST /run` and the scheduled run use different state stores and can run at the same time; the read-then-`PATCH` check in the rest adapter is not atomic. The server listens on 127.0.0.1 only and has no authentication. | No correction is necessary. Record it for the live deployment. |
| NOTE | systems/support-triage/tools/get-triage-rules.js | Carried from round 1: `toolError` is defined here and imported by the other tools and the orchestrator. A small shared module (for example `tools/errors.js`) would be clearer. | No correction is necessary. |
| NOTE | systems/support-triage/orchestrator.js | Quality: structure, names and error handling are good. Each step of the design sequence is one clear block, each error maps to a design code, and the request and scheduled paths share `triageRun`. | No correction is necessary. |

## Escalation
