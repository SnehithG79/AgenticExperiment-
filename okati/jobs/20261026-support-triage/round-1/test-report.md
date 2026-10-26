PASS

# Test report: round 1

Worktree: `/home/user/.okati/worktrees/20261026-support-triage` (branch `okati/20261026-support-triage`, commit `5d1cbda`). System folder: `systems/support-triage/`. `package.json` has no dependencies, so no install was needed.

Command: AGENT_MODE=mock npm test
Totals: 65 tests, 65 pass, 0 fail (0 cancelled, 0 skipped). Total duration about 260 ms.

Command: AGENT_MODE=mock npm run evals
Totals: 20 cases, 20 pass, 0 fail. Exit code 0.

## Results by test file

All durations are from the node test runner.

| Test | Result | Duration |
|------|--------|----------|
| fixture has 27 records and the named sets | pass | 2.1 ms |
| fake ticket API fails an update in failUpdateIds and records nothing | pass | 0.6 ms |
| fake ticket API updates all duplicate copies and keeps the fixture unchanged | pass | 0.4 ms |
| fake ticket API accuracy counts a labeled ticket with no update as not correct | pass | 0.2 ms |
| memory store has and add | pass | 0.2 ms |
| clocks | pass | 0.3 ms |
| eval T1 (in process / over HTTP) | pass / pass | 13.6 / 61.6 ms |
| eval T2 (in process / over HTTP) | pass / pass | 1.1 / 5.6 ms |
| eval T3 (in process / over HTTP) | pass / pass | 1.7 / 6.4 ms |
| eval T4 (in process / over HTTP) | pass / pass | 1.7 / 4.0 ms |
| eval T5 (in process / over HTTP) | pass / pass | 1.2 / 3.4 ms |
| eval T6 (in process / over HTTP) | pass / pass | 1.6 / 4.3 ms |
| eval T7 (in process / over HTTP) | pass / pass | 0.4 / 2.3 ms |
| eval T7b (in process / over HTTP) | pass / pass | 0.2 / 1.8 ms |
| eval T7c (in process / over HTTP) | pass / pass | 0.3 / 3.3 ms |
| eval T8 (in process / over HTTP) | pass / pass | 0.4 / 2.5 ms |
| eval T8b (in process / over HTTP) | pass / pass | 0.3 / 2.1 ms |
| eval T8c (in process / over HTTP) | pass / pass | 1.5 / 2.8 ms |
| eval T9 (in process / over HTTP) | pass / pass | 0.6 / 3.8 ms |
| eval T10 (in process / over HTTP) | pass / pass | 1.0 / 2.2 ms |
| eval E1 (in process / over HTTP) | pass / pass | 0.2 / 1.4 ms |
| eval E1b (in process / over HTTP) | pass / pass | 0.2 / 1.5 ms |
| eval E2 (in process / over HTTP) | pass / pass | 0.2 / 1.3 ms |
| eval E3 (in process / over HTTP) | pass / pass | 0.2 / 1.4 ms |
| eval E4 (in process / over HTTP) | pass / pass | 0.1 / 1.2 ms |
| eval E5 (in process / over HTTP) | pass / pass | 0.1 / 1.2 ms |
| GET /health returns 200 | pass | 1.3 ms |
| POST /run refuses bad JSON | pass | 1.9 ms |
| privacy: no model message contains example.test or requester | pass | 8.0 ms |
| logs: no log line contains a subject or a body from the fixture | pass | 2.8 ms |
| confidence of exactly 0.6 does not go to review | pass | 0.5 ms |
| a team that is not in the configuration is bad_output and goes to review | pass | 0.6 ms |
| the body sent to the model has a maximum of 8000 characters | pass | 1.3 ms |
| validateTicket codes | pass | 0.1 ms |
| request errors | pass | 0.3 ms |
| config_unavailable when the configuration path does not exist | pass | 0.2 ms |
| fetch_new_tickets returns only new tickets with no team and no priority | pass | 1.6 ms |
| fetch_new_tickets refuses limit 0 with invalid_input | pass | 0.5 ms |
| fetch_new_tickets maps an adapter failure to ticket_api_unavailable | pass | 0.1 ms |
| update_ticket refuses a bad team, priority or reason with invalid_input | pass | 0.8 ms |
| update_ticket returns ticket_already_triaged and ticket_not_found | pass | 0.5 ms |
| update_ticket writes one update and the fake records it | pass | 0.4 ms |
| get_triage_rules returns 5 teams and 4 priorities | pass | 0.2 ms |
| get_triage_rules returns config_unavailable for a path that does not exist | pass | 0.2 ms |
| get_triage_rules refuses an input that is not an empty object | pass | 0.4 ms |

The eval runner (`node evals/run-evals.js`, in process) printed PASS for T1, T2, T3, T4, T5, T6, T7, T7b, T7c, T8, T8b, T8c, T9, T10, E1, E1b, E2, E3, E4 and E5, then "all 20 cases passed". Actual values match the design: for example T3/T4/T8c give accuracy 20/19/18, model_calls 42, and summaries S(20,20,3,0,0,0) and S(23,20,3,0,3,0); T10 gives S(23,19,3,1,3,0); T7c gives model_calls 4.

## Failures

| Test | File:line | Root cause | Suggested correction |
|------|-----------|------------|----------------------|
| none | | | |

## Missing tests

None.

- Evaluation cases: all 20 cases of `design.md` (T1 to T10 including T7b, T7c, T8b, T8c, E1, E1b, E2, E3, E4, E5) are in `evals/cases.json`. Each has one test in `tests/evals.test.js` (in process and over HTTP on port 3942).
- T6 has the extra check of reason length 1 to 200.
- Tools: `fetch_new_tickets`, `update_ticket` and `get_triage_rules` each have unit tests in `tests/tools.test.js`, with the error cases that the design lists (limit 0, team "hr", priority "P5", empty and 201-character reason, TCK-2001, TCK-9999, missing config path).
- Extra tests required by the design (privacy, logs, confidence 0.6) are present in `tests/orchestrator.test.js`.

## Notes (no effect on the result)

- `lib/llm.js` and `lib/schema.js` are identical to the template. `lib/agent-loop.js` is identical to the template inside the worktree (`okati/templates/agent-system/lib/agent-loop.js`). The template at `/home/user/okati/templates/agent-system/lib/agent-loop.js` is a different version (it has `MAX_TURNS = 5`; the branch copy has `maxTurns = 8`). The builder copied the template that is on the branch, so this is a template version difference, not a build error. The orchestrator may want to check which template version is the right one.
- Tests use the fake ticket API only, the mock model and port 3942 (inside 3000 to 3999). The rest adapter was not used.
- No code was changed.
