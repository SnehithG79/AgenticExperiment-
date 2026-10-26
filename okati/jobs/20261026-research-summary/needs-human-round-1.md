# Needs human: 20261026-research-summary

Stopped at: okati-reviewer, round 1
Reason: The round 1 CHANGE items remove `.env` loading, but the user asked for a `.env` file for the OpenAI key.

## Question
How must the system read the API key: from a local `.env` file that Git ignores, or from the shell environment only?

## Human decision
Keep the `.env` file. `server.js` loads a local `.env` file into the environment, and Git ignores `.env`.
Values that are set in the shell environment have priority.
Change orchestrator guardrail 8: API keys come from the environment or from a local `.env` file that Git ignores.
Never commit a key or a `.env` file.
The two CHANGE items in round-1/review.md are cancelled. Keep the `.env` instructions in README.md and .env.example.
