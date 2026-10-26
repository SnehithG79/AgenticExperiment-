PASS

# Visual report: round 1

Job: 20261026-support-triage. Branch: okati/20261026-support-triage. Worktree: `/home/user/.okati/worktrees/20261026-support-triage` (system folder `systems/support-triage/`).

Files read: `agents/triager.js`, `orchestrator.js`, `server.js`, `tools/*.js`, `adapters/*.js`, `lib/agent-loop.js` (how the agent gets its tools).

## Code graph

Source: `diagrams/agent-graph.mmd`

```mermaid
graph TD
  run_input[POST /run input - server.js] --> orchestrator
  schedule[schedule every TRIAGE_INTERVAL_MINUTES - server.js startSchedule] --> orchestrator
  orchestrator -->|loadConfig at request start| triage_config
  orchestrator -->|1 callTool| fetch_new_tickets
  fetch_new_tickets --> ticket_api[(ticket_api fake or rest)]
  orchestrator -->|2 for each ticket| dedupe
  dedupe --> validate_ticket
  validate_ticket -->|invalid: missing_ticket_id, missing_body, invalid_body_type, invalid_subject_type| log_error
  validate_ticket -->|valid| state_store[(state_store)]
  state_store -->|has id| skip
  state_store -->|not processed| triager
  triager -->|tool call| get_triage_rules
  get_triage_rules --> triage_config[(triage_config)]
  triager -->|AgentError or other error, attempt 1| retry_once
  retry_once -->|second failure| route_review
  triager -->|valid output| route_review
  route_review -->|3 callTool| update_ticket
  update_ticket --> ticket_api
  update_ticket -->|ok: store.add| state_store
  update_ticket -->|error code| log_error
  orchestrator -->|4 after all tickets| summary
  clock[(clock)] --> summary
```

### Agents and tools found in code

| Agent or caller | Tools it can call | Evidence |
|---|---|---|
| `triager` (model `claude-sonnet-5-5`) | `get_triage_rules` only | `agents/triager.js`: `tools: [getTriageRules]` |
| `orchestrator` (code, not a model agent) | `fetch_new_tickets`, `update_ticket` through `callTool` | `orchestrator.js`: `fetchTool`, `updateTool` |

`fetch_new_tickets` and `update_ticket` are not in the tools list of any agent. Only one agent exists (`triager`).

## Differences from design.md

| Type | Item | In design | In code |
|---|---|---|---|
| (none) | Missing agent | - | - |
| (none) | Extra agent | - | - |
| (none) | Missing tool | - | - |
| (none) | Extra tool | - | - |
| (none) | Missing call | - | - |
| (none) | Extra call | - | - |

Result: 0 differences. Notes (not differences):

- The orchestrator calls `loadConfig()` at the start of each request and the triager module calls it when it loads. The design text ("orchestrator also checks the configuration at the start of each request") describes the orchestrator check. It is not drawn in the design graph, but it is not a new agent, tool or call between nodes.
- The scheduled runner logs a `run_failed` event (code only) when the fetch or the configuration fails. This event is not in the design list. It is a log event, not a graph node or call. It is already listed in `round-1/build.md` under decisions.
- Non-`AgentError` errors from `runAgent` also count as a failed attempt and use the same retry path. The design says "any code" for `AgentError`. Same graph edge.

## Screenshots

None. The system has no user interface. It is an HTTP API only (`GET /health`, `POST /run`, port 3142). No browser page exists to capture.
