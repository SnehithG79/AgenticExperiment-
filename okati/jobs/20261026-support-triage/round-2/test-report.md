PASS

# Test report: round 2

Command: AGENT_MODE=mock npm test
Totals: 65 tests, 65 pass, 0 fail (0 cancelled, 0 skipped, total 254 ms)

Worktree: `/home/user/.okati/worktrees/20261026-support-triage`, system folder `systems/support-triage/`. `package.json` has no dependencies, so no install was needed. Commit under test: `7df9614`.

Command: AGENT_MODE=mock npm run evals
Result: all 20 cases passed (T1, T2, T3, T4, T5, T6, T7, T7b, T7c, T8, T8b, T8c, T9, T10, E1, E1b, E2, E3, E4, E5). Exit code 0.

Round 1 CHANGE item check: `lib/agent-loop.js`, `lib/llm.js` and `lib/schema.js` in the system folder are byte-equal to `main:okati/templates/agent-system/lib/` (checked with `git show main:... | cmp`). `agent-loop.js` has `MAX_TURNS = 5`. The copy of the template inside the worktree (`okati/templates/...`) is an older snapshot and differs; it is outside the system folder and is not a failure.

| Test | Result | Duration |
|------|--------|----------|
| fixture has 27 records and the named sets | pass | 3.4 ms |
| fake ticket API fails an update in failUpdateIds and records nothing | pass | 0.6 ms |
| fake ticket API updates all duplicate copies and keeps the fixture unchanged | pass | 0.7 ms |
| fake ticket API accuracy counts a labeled ticket with no update as not correct | pass | 0.3 ms |
| memory store has and add | pass | 0.2 ms |
| clocks | pass | 0.3 ms |
| eval T1 in process | pass | 13.7 ms |
| eval T1 over HTTP | pass | 26.2 ms |
| eval T2 in process | pass | 1.6 ms |
| eval T2 over HTTP | pass | 5.6 ms |
| eval T3 in process | pass | 2.0 ms |
| eval T3 over HTTP | pass | 10.7 ms |
| eval T4 in process | pass | 1.8 ms |
| eval T4 over HTTP | pass | 4.3 ms |
| eval T5 in process | pass | 1.2 ms |
| eval T5 over HTTP | pass | 3.8 ms |
| eval T6 in process | pass | 1.8 ms |
| eval T6 over HTTP | pass | 4.8 ms |
| eval T7 in process | pass | 0.5 ms |
| eval T7 over HTTP | pass | 2.6 ms |
| eval T7b in process | pass | 0.3 ms |
| eval T7b over HTTP | pass | 2.1 ms |
| eval T7c in process | pass | 0.3 ms |
| eval T7c over HTTP | pass | 3.7 ms |
| eval T8 in process | pass | 0.6 ms |
| eval T8 over HTTP | pass | 4.9 ms |
| eval T8b in process | pass | 0.4 ms |
| eval T8b over HTTP | pass | 2.2 ms |
| eval T8c in process | pass | 1.8 ms |
| eval T8c over HTTP | pass | 3.6 ms |
| eval T9 in process | pass | 1.2 ms |
| eval T9 over HTTP | pass | 6.0 ms |
| eval T10 in process | pass | 1.2 ms |
| eval T10 over HTTP | pass | 2.7 ms |
| eval E1 in process | pass | 0.2 ms |
| eval E1 over HTTP | pass | 1.4 ms |
| eval E1b in process | pass | 0.2 ms |
| eval E1b over HTTP | pass | 1.7 ms |
| eval E2 in process | pass | 0.2 ms |
| eval E2 over HTTP | pass | 1.7 ms |
| eval E3 in process | pass | 0.2 ms |
| eval E3 over HTTP | pass | 1.3 ms |
| eval E4 in process | pass | 0.1 ms |
| eval E4 over HTTP | pass | 1.4 ms |
| eval E5 in process | pass | 0.1 ms |
| eval E5 over HTTP | pass | 1.4 ms |
| GET /health returns 200 | pass | 1.3 ms |
| POST /run refuses bad JSON | pass | 1.9 ms |
| privacy: no model message contains example.test or requester | pass | 12.0 ms |
| logs: no log line contains a subject or a body from the fixture | pass | 2.6 ms |
| confidence of exactly 0.6 does not go to review | pass | 0.6 ms |
| a team that is not in the configuration is bad_output and goes to review | pass | 0.6 ms |
| the body sent to the model has a maximum of 8000 characters | pass | 0.8 ms |
| validateTicket codes | pass | 0.2 ms |
| request errors | pass | 0.2 ms |
| config_unavailable when the configuration path does not exist | pass | 0.3 ms |
| fetch_new_tickets returns only new tickets with no team and no priority | pass | 1.7 ms |
| fetch_new_tickets refuses limit 0 with invalid_input | pass | 0.6 ms |
| fetch_new_tickets maps an adapter failure to ticket_api_unavailable | pass | 0.2 ms |
| update_ticket refuses a bad team, priority or reason with invalid_input | pass | 1.7 ms |
| update_ticket returns ticket_already_triaged and ticket_not_found | pass | 0.5 ms |
| update_ticket writes one update and the fake records it | pass | 0.5 ms |
| get_triage_rules returns 5 teams and 4 priorities | pass | 0.2 ms |
| get_triage_rules returns config_unavailable for a path that does not exist | pass | 0.2 ms |
| get_triage_rules refuses an input that is not an empty object | pass | 0.3 ms |

## Failures

| Test | File:line | Root cause | Suggested correction |
|------|-----------|-----------|----------------------|
| none | | | |

## Missing tests

Evaluation cases: the 20 cases in `design.md` (T1, T2, T3, T4, T5, T6, T7, T7b, T7c, T8, T8b, T8c, T9, T10, E1, E1b, E2, E3, E4, E5) are all in `systems/support-triage/evals/cases.json` (same 20 IDs). `tests/evals.test.js` runs each case in process and over HTTP (`eval <ID> in process`, `eval <ID> over HTTP`), so each case has a test. T6 also checks the reason length of each item in `updates` (`tests/evals.test.js:26-28`).

Tools: each tool has unit tests in `tests/tools.test.js`.

| Tool | Tests |
|------|-------|
| `fetch_new_tickets` | only new tickets with no team and no priority; refuses `{"limit": 0}` with `invalid_input`; maps adapter failure to `ticket_api_unavailable` |
| `update_ticket` | refuses bad team, priority, empty reason and 201-character reason with `invalid_input`; `ticket_already_triaged` and `ticket_not_found`; writes one update |
| `get_triage_rules` | 5 teams and 4 priorities; `config_unavailable` for a path that does not exist; refuses non-empty input |

Additional design unit tests present: privacy (no `example.test` or `requester` in model messages), logs (no subject or body), confidence exactly 0.6 not sent to review, 8000-character body cut, adapters and clock tests.

No missing tests.
