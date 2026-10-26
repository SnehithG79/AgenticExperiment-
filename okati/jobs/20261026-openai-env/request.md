# Request

Switch both systems to OpenAI keys: update support-triage lib to the current template, make each .env.example list only AGENT_PROVIDER=openai, OPENAI_API_KEY and OPENAI_MODEL

## Context from the user

- The user uses an OpenAI API key, not an Anthropic key.
- The `.env.example` files in `systems/support-triage/` and `systems/research-summary/` must not list `ANTHROPIC_API_KEY` or `AGENT_MODEL`.
- Other non-model variables that a system needs (for example `TICKET_API_TOKEN`, search keys, `PORT`, `AGENT_MODE`) stay.
- Keys load from the environment or a local `.env` file that Git ignores. Never commit a key or a `.env` file.
- This is a change to two existing systems. Do not build a new system.
