# Agent system template

Each agentic system that okati builds uses this structure.
The designing agent reads this file.
The coding agent copies this folder in round 1.

This folder is a working system: one agent, one tool, `POST /run`, `GET /health` and evaluation cases.
Run `npm test` and `npm start` to see it work.

## Required structure

```
<system-name>/
  README.md            goal, start command, port, environment variables
  package.json         scripts: start, test, evals
  server.js            HTTP entry point: POST /run, GET /health
  orchestrator.js      runs the agent graph
  agents/              one file for each agent: role, model, tools, prompt, mock policy
  tools/               one file for each tool: input schema, output schema, run function
  lib/
    agent-loop.js      tool-use loop. Validates each tool input. Do not change.
    llm.js             live model or mock model. Do not change.
    schema.js          JSON Schema subset validator. Do not change.
  evals/
    cases.json         one object for each evaluation case: id, input, expected
    run-evals.js       sends each case to the system and compares the result
  tests/               unit tests for each tool, one test for each evaluation case
  .env.example         the names of all environment variables, with no values
```

## Model modes

| `AGENT_MODE` | Result |
| --- | --- |
| `auto` (default) | Live mode if `ANTHROPIC_API_KEY` has a value. If not, mock mode. |
| `mock` | Each agent uses its deterministic `mock(messages)` policy. No credential. |
| `live` | Calls the Anthropic Messages API with `ANTHROPIC_API_KEY`. |

The mock policy must do the same steps as the prompt.
It must return content blocks in the Messages API format: `text` or `tool_use`.
Tests and localhost runs use mock mode.

## Rules

1. Read all API keys from environment variables. Do not put a key in the code.
2. Validate each tool input against its schema before the tool runs. `lib/agent-loop.js` does this.
3. Give each agent only the tools that the design lists for that agent.
4. Make `POST /run` accept a JSON body `{"input": ...}`.
5. Make `POST /run` return `{"output": ...}` or `{"error": "<code>"}`.
6. Make `GET /health` return status 200 when the system is ready.
7. Make one command start the system: `npm start`.
8. Use a port from 3000 to 3999. `server.js` refuses all other ports.
9. Use test data only. If a tool needs an external service, give it a test double with fixture data.
10. Do not add runtime dependencies if Node.js built-in modules can do the work.

## evals/cases.json format

```json
[
  { "id": "E1", "input": "the quick brown fox", "expected": { "words": 4 } },
  { "id": "E3", "input": "", "expected": { "error": "empty_input" } }
]
```

Each key in `expected` must be equal to the same key in `output`.
An `expected.error` must be equal to the returned error code.
