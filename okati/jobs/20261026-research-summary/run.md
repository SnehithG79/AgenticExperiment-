PASS

Round: 2
Start command: cd systems/research-summary && AGENT_MODE=mock PORT=3217 npm start
Worktree: /home/user/.okati/worktrees/20261026-research-summary/systems/research-summary (branch okati/20261026-research-summary, commit 719bb61)
URL: http://localhost:3217
Start time: 1 s or less (GET /health returned 200 after about 0.5 s)
Health: {"status":"ok","mode":"mock"}
No earlier run.md existed (no run in round 1).

| Case | Input | Expected | Actual | Result |
|------|-------|----------|--------|--------|
| T1 | What is CRISPR? | search_calls: SC(q) | same | PASS |
| T2 | How do vaccines train the immune system? | search_calls: SC(q) | same | PASS |
| T3 | What causes ocean tides? | search_calls: SC(q) | same | PASS |
| T4 | How does photosynthesis work? | search_calls: SC(q) | same | PASS |
| T5 | Vaccines question (10 web results) | sources: SRC_Q2 (3 web items) | same | PASS |
| T6 | What is CRISPR? | sources: SRC_Q1, warnings: [] | same | PASS |
| T7 | How does photosynthesis work? | sources: SRC_Q4, warnings: source_empty:papers | same | PASS |
| T8 | What causes ocean tides? | summary: SUM_Q3, warnings: source_empty:web | same | PASS |
| T9 | Vaccines question | summary: SUM_Q2, warnings: [] | same | PASS |
| T10 | What is a black hole? | summary: SUM_Q5, warnings: citation_removed:9, sentence_removed:4 | same | PASS |
| T11 | What is CRISPR? | cited_sources: web, encyclopedia, papers | same | PASS |
| T12 | How do honeybees communicate? | summary: SUM_Q6, cited_sources: web, papers, warnings: source_failed:encyclopedia | same | PASS |
| T13 | What is the zorblax protocol? | error: no_results | error: no_results (HTTP 400) | PASS |
| T14 | What is CRISPR? | summary: SUM_Q1 | same | PASS |
| T15 | What is a black hole? | model_calls: 2 | model_calls: 2 | PASS |
| E1 | "" | error: empty_input | error: empty_input | PASS |
| E1b | "   " | error: empty_input | error: empty_input | PASS |
| E2 | (no input key) | error: invalid_input | error: invalid_input | PASS |
| E2b | 42 | error: invalid_input | error: invalid_input | PASS |
| E2c | 501 letters a | error: invalid_input | error: invalid_input | PASS |

Result: 20 of 20 cases passed. Checked with `node evals/run-evals.js --url http://localhost:3217` and with a separate script that sends each case from `evals/cases.json` to `POST /run`. All successful cases returned `model_calls` of 2.

## Request that is not JSON

`POST /run` with the body `this is not json` returned HTTP 400 `{"error":"bad_json"}`. The system kept running. `GET /health` and a valid `POST /run` for "What is CRISPR?" worked after it.

## Cleanup

Stopped the processes that I started (npm start, sh and node server.js). Port 3217 is free: `GET /health` gets no response. No `.env` file exists in the system folder, so mock mode came from the shell variable. No code was changed.
