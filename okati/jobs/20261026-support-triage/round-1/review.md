CHANGES

# Review: round 1

Branch: `okati/20261026-support-triage` (commit `5d1cbda`). Diff: `git diff main...okati/20261026-support-triage` (25 files, all in `systems/support-triage/`).

## Report results
Test: PASS
Visual: PASS

## Items
| Label | File | Problem | Required correction |
|-------|------|---------|---------------------|
| CHANGE | systems/support-triage/lib/agent-loop.js | The file is not equal to `okati/templates/agent-system/lib/agent-loop.js` on `main`. The `main` template has `export const MAX_TURNS = 5`, the default `maxTurns = MAX_TURNS`, the cap `maxTurns = Math.min(maxTurns, MAX_TURNS)` and the comment line about `MAX_TURNS`. The branch copy has the older `maxTurns = 8` with no cap. (`lib/llm.js` and `lib/schema.js` are equal to `main`.) | Copy the current file from `main` without changes: `git show main:okati/templates/agent-system/lib/agent-loop.js > systems/support-triage/lib/agent-loop.js`. The reviewer ran the 65 tests on a scratch copy with the `main` file: 65 pass, so no other code change is necessary. |
| NOTE | systems/support-triage/orchestrator.js | Security check: no secrets in the code. `ANTHROPIC_API_KEY` and `TICKET_API_TOKEN` come from the environment only. `.env.example` has no secret values and `.gitignore` has `.env`. `triager` has only `get_triage_rules`. `fetch_new_tickets` and `update_ticket` are called only by the orchestrator through `callTool`, which validates the input with `lib/schema.js`. The `POST /run` input is validated against `REQUEST_SCHEMA`, and the body is limited to 64 KiB. | No correction is necessary. |
| NOTE | systems/support-triage/orchestrator.js | Guardrails checked: model input has only `ticket_id`, `subject`, `body` (test "privacy"); body cut to 8000 characters (test); no model call for invalid, processed or 0 tickets (E1, E1b, E2, T8b); no second update in a request (T8, T8c, state store and adapter check); failed update not retried in the same run (T9); max 2 model attempts (`MAX_MODEL_ATTEMPTS`, T7c); logs have ID, event and code only (test "logs"); no status change and no customer reply (both adapters); rest adapter only with `TICKET_ADAPTER=rest`, and tests delete that variable. Agent guardrails 2 and 3 are in the output schema. Guardrails 4 and 5 are in the prompt, and the input is sent as a JSON string. | No correction is necessary. |
| NOTE | systems/support-triage/orchestrator.js | `validateTicket` does not check the ID length. A ticket from the rest adapter with an ID longer than 64 characters gets a model call, then `update_ticket` refuses it with `invalid_input`. Because the ID is not added to the state store, each scheduled run classifies it again. The fake fixtures have no such ID. | No correction is necessary in this round. A later design can add an ID length check to `validate_ticket`. |
| NOTE | systems/support-triage/server.js | With `TICKET_ADAPTER=rest`, a `POST /run` request and the scheduled run use different state stores and can run at the same time. The rest adapter reads the ticket before the `PATCH`, so a second write is refused in most cases, but the check and the write are not atomic. The server listens on 127.0.0.1 only and has no authentication. | No correction is necessary. Record it for the live deployment. |
| NOTE | systems/support-triage/tools/get-triage-rules.js | `toolError` is defined in `get-triage-rules.js` and imported by the other tools and the orchestrator. A small shared module (for example `tools/errors.js`) would be clearer. | No correction is necessary. |
| NOTE | systems/support-triage/orchestrator.js | Decisions in `build.md` (non-`AgentError` errors count as a failed model attempt, extra `run_failed` log event with a code only, extra config checks for `review_tag` and `language`) agree with the intent of the design and with the guardrails. Structure, names and error handling are good: each step of the design sequence is one clear block, and each error maps to a design code. | No correction is necessary. |

## Escalation
