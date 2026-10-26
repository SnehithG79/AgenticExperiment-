PASS

Round: 2
Start command: cd /home/user/.okati/worktrees/20261026-support-triage/systems/support-triage && AGENT_MODE=mock PORT=3142 npm start
URL: http://localhost:3142
Start time: 1 s (first GET /health with status 200 after about 0.5 s)

Health: `GET /health` returned `{"status":"ok","mode":"mock"}`.

Every case sent its input to `POST /run`. Each key in the expected output was compared with the same key in the actual output (deep equality). All keys were equal.

| Case | Input | Expected | Actual | Result |
|------|-------|----------|--------|--------|
| T1 | ticket_set new5_closed3 | read_ids TCK-1001..1005, S(5,5,0,0,0,0) | same | PASS |
| T2 | new5_closed3, include_records | 5 records with exact subject and body | same | PASS |
| T3 | labeled20 | accuracy 20/19/18, S(20,20,3,0,0,0) | same | PASS |
| T4 | labeled20 | accuracy 20/19/18, update_calls 20, model_calls 42 | same | PASS |
| T5 | new5_closed3 | update_calls 5, 5 updates with team, priority, reason | same | PASS |
| T6 | labeled20 | update_calls 20, errors [], reason length 1 to 200 | same | PASS |
| T7 | ticket_ids TCK-1018 | general, P3, needs-review, confidence 0.45 reason | same | PASS |
| T7b | ticket_ids TCK-1019 | general, P2, needs-review, language reason | same | PASS |
| T7c | ticket_ids TCK-1020 | general, P3, needs-review, invalid-output reason, model_calls 4 | same | PASS |
| T8 | new5_closed3, runs 2 | update_calls 5, model_calls 10, S(5,5,0,0,0,0) and S(0,0,0,0,0,0) | same | PASS |
| T8b | processed_ids 1001, 1002 | update_calls 3, model_calls 6, S(5,3,0,0,0,2) | same | PASS |
| T8c | ticket_set all | update_calls 20, model_calls 42, accuracy 20/19/18, S(23,20,3,0,3,0) | same | PASS |
| T9 | fail_update_ids TCK-1003 | update_calls 4, 1 update_failed error, S(5,4,0,1,0,0) | same | PASS |
| T10 | all, fail_update_ids TCK-1002 | S(23,19,3,1,3,0) | same | PASS |
| E1 | closed3 | 0 updates, 0 model calls, S(0,0,0,0,0,0) | same | PASS |
| E1b | empty | 0 updates, 0 model calls, S(0,0,0,0,0,0) | same | PASS |
| E2 | invalid3 | 3 validation errors, 0 updates, 0 model calls, S(3,0,0,0,3,0) | same | PASS |
| E3 | "tickets please" | error invalid_input | HTTP 400, invalid_input | PASS |
| E4 | ticket_set nope | error unknown_ticket_set | HTTP 400, unknown_ticket_set | PASS |
| E5 | ticket_set and ticket_ids | error invalid_input | HTTP 400, invalid_input | PASS |
| N1 | Body `this is not json{` (not JSON) | error response and the system keeps running | HTTP 400 `{"error":"bad_json"}`. `GET /health` after it returned 200. | PASS |

Shutdown: I stopped the npm, sh and node processes that I started. After that, `GET /health` on port 3142 returned no response, so the port is free.

I did not change any code. The run used the mock model and the fake ticket API only.
