# Agent system template

Each agentic system that okati builds uses this structure. The designing agent reads this file. The coding agent copies this folder in round 1.

## Required structure

```
<system-name>/
  README.md            goal, start command, port, environment variables
  agents/              one file for each agent: role, model, tools, prompt
  tools/               one file for each tool, with input and output schemas
  orchestrator.*       the code that runs the agent graph
  server.*             the HTTP entry point for the localhost run
  evals/
    cases.json         one object for each evaluation case: id, input, expected
    run-evals.*        sends each case to the system and compares the output
  tests/               unit tests for each tool
  .env.example         the names of all environment variables, with no values
```

## Rules

1. Read all API keys from environment variables. Do not put a key in the code.
2. Validate each tool input against its schema before the tool runs.
3. Give each agent only the tools that the design lists for that agent.
4. Make the HTTP entry point accept `POST /run` with a JSON body `{"input": ...}`.
5. Make `POST /run` return a JSON body `{"output": ...}` or `{"error": "<code>"}`.
6. Make `GET /health` return status 200 when the system is ready.
7. Make one command start the system, for example `npm run dev` or `python server.py`.

## evals/cases.json format

```json
[
  { "id": "E1", "input": "Ticket: I want a refund for order 1182", "expected": { "route": "billing" } },
  { "id": "E2", "input": "", "expected": { "error": "empty_input" } }
]
```
