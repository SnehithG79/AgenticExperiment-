# Build: round 2

## Changed files

All paths are in `systems/research-summary/` on branch `okati/20261026-research-summary`. The worktree is `.okati/worktrees/20261026-research-summary/`.

- `README.md`: the `.env` line now also says that a variable set in the shell has priority over `.env`, and that you must not commit a `.env` file or a key. The "Key handling" table in `design.md` requires this text. No other change.

No other file changed. `design.md` item 5 under "Changes in round 1" says that the agents, tools, fixtures and evaluation cases have not changed.

## Commits

- `719bb61 okati(20261026-research-summary): round 2, README states shell values have priority over .env`

## CHANGE items corrected

None. `needs-human-round-1.md` has a human decision that cancels both CHANGE items in `round-1/review.md`:

- CHANGE `server.js` (remove the `.env` load): cancelled. The `.env` load stays in the start block of `server.js`, in a `try` block before `checkPort`.
- CHANGE `README.md` / `.env.example` (remove the `.env` instructions): cancelled. The `.env` instructions stay.

I checked the round 1 code against the "Key handling" table and the orchestrator guardrails 8, 10 and 11 in the updated `design.md`:

- `server.js`: calls `process.loadEnvFile(new URL("./.env", import.meta.url))` in a `try` block before `checkPort`. Shell values have priority. OK.
- `.gitignore`: contains `node_modules/` and `.env`. OK.
- `.env.example`: line 1 tells you to copy the file to `.env`. It lists all the variables in the table, including `AGENT_PROVIDER`, `OPENAI_API_KEY` and `OPENAI_MODEL`. Each secret has an empty value. OK.
- `README.md`: did not say that shell values have priority. Corrected in this round.
- Tests: no test loads `.env`. Only the start block of `server.js` calls `loadEnvFile`. The tests set `AGENT_MODE=mock`. OK.
- Git: no `.env` file is tracked on the branch. OK.

Template `lib/` on `main`: it has not changed since round 1. `lib/agent-loop.js`, `lib/llm.js` and `lib/schema.js` are the same as the template, so I copied nothing.

## Test result before commit

`npm test` in `systems/research-summary/`: 79 tests, 79 pass, 0 fail.

## Items not complete

- I did not do the localhost run. The localhost agent does it.
- The NOTE items in `round-1/review.md` need no correction, so I did not change them.
