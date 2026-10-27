PASS

Round: 1
Mode: AGENT_MODE=mock only. No OpenAI or Anthropic call. No `.env` file made.
Worktree: /home/user/.okati/worktrees/20261026-openai-env (branch okati/20261026-openai-env)

## support-triage

Start command: cd systems/support-triage && AGENT_MODE=mock PORT=3142 npm start
URL: http://localhost:3142
Start time: 0.3 s

| Case | Input | Expected | Actual | Result |
| --- | --- | --- | --- | --- |
| L1 | GET /health | {"status":"ok","mode":"mock"} | {"status":"ok","mode":"mock"} (200) | PASS |
| L2 (eval T5) | {"input":{"ticket_set":"new5_closed3"}} | update_calls 5; TCK-1001 billing P2, TCK-1002 technical P1, TCK-1003 account P2, TCK-1004 sales P4, TCK-1005 technical P4; tags empty | update_calls 5; same 5 updates; tags empty; model_calls 10 | PASS |
| L3 (eval E4) | {"input":{"ticket_set":"nope"}} | {"error":"unknown_ticket_set"} | {"error":"unknown_ticket_set"} (400) | PASS |
| L4 | node evals/run-evals.js --url http://localhost:3142 | all 20 cases passed | all 20 cases passed | PASS |
| B1 | POST /run with body "this is not json{" | error, system keeps running | {"error":"bad_json"} (400); GET /health after: 200 mode mock | PASS |

Stop: process stopped, port 3142 free (no response on /health).

## research-summary

Start command: cd systems/research-summary && AGENT_MODE=mock PORT=3217 npm start
URL: http://localhost:3217
Start time: 0.2 s

| Case | Input | Expected | Actual | Result |
| --- | --- | --- | --- | --- |
| L5 | GET /health | {"status":"ok","mode":"mock"} | {"status":"ok","mode":"mock"} (200) | PASS |
| L6 (eval T14) | {"input":"What is CRISPR?"} | summary equals T14 summary; model_calls 2 | summary equals T14 summary (checked against evals/cases.json text); model_calls 2 | PASS |
| L7 (eval E1) | {"input":""} | {"error":"empty_input"} | {"error":"empty_input"} (400) | PASS |
| L8 | node evals/run-evals.js --url http://localhost:3217 | all 20 cases passed | all 20 cases passed | PASS |
| B2 | POST /run with body "this is not json{" | error, system keeps running | {"error":"bad_json"} (400); GET /health after: 200 mode mock | PASS |

Stop: process stopped, port 3217 free (no response on /health). The first stop attempt left the node child alive; I killed it by PID and then confirmed the port was free.

## CHANGE items
None.
