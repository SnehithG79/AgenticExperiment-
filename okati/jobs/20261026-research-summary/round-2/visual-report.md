PASS

# Visual report: round 2

Code read from `/home/user/.okati/worktrees/20261026-research-summary/systems/research-summary/` (branch `okati/20261026-research-summary`, commit 719bb61). Diagram file: `diagrams/agent-graph.mmd`.

The only change since round 1 (commit 9786046) is one line in `README.md`. No agent, tool, call, fixture or `lib/` file changed. `lib/agent-loop.js`, `lib/llm.js` and `lib/schema.js` are identical to the template.

Agents found: 1 (`researcher`, `agents/researcher.js`). The orchestrator passes the `tools` list through `createResearcher(tools)`: `search_web`, `search_encyclopedia`, `search_papers`.

Tools found: 3 (`tools/search-web.js`, `tools/search-encyclopedia.js`, `tools/search-papers.js`, all built by `createSearchTool` in `tools/search-tool.js`).

Deterministic steps: `validateInput` and `checkResults` (`orchestrator.js`), `cleanSummary` (`steps/clean-summary.js`).

Data stores: `createSourceRegistry()` and 3 adapters (`createFakeSearch` by default, `createHttpSearch` only with `SEARCH_ADAPTER=http`).

## Code graph
```mermaid
graph TD
  run_input[POST /run input - server.js] --> validate_input
  validate_input -->|empty_input or invalid_input| error_out[error output]
  validate_input -->|valid question| researcher
  researcher -->|turn 1 tool call| search_web
  researcher -->|turn 1 tool call| search_encyclopedia
  researcher -->|turn 1 tool call| search_papers
  search_web --> web_api[(web_api: createFakeSearch or createHttpSearch)]
  search_encyclopedia --> encyclopedia_api[(encyclopedia_api: createFakeSearch or createHttpSearch)]
  search_papers --> papers_api[(papers_api: createFakeSearch or createHttpSearch)]
  search_web --> source_registry[(source_registry)]
  search_encyclopedia --> source_registry
  search_papers --> source_registry
  researcher -->|turn 2 summary JSON| check_results
  source_registry --> check_results
  check_results -->|0 items, no_results| error_out
  check_results -->|AgentError max_turns or bad_output| error_out
  check_results -->|1 or more items| clean_summary
  source_registry --> clean_summary
  clean_summary -->|empty summary, summary_invalid| error_out
  clean_summary -->|summary, sources, warnings| output[output]
```

## Differences from design.md
| Type | Item | In design | In code |
|------|------|-----------|---------|
| (none) | Missing agent | - | - |
| (none) | Extra agent | - | - |
| (none) | Missing tool | - | - |
| (none) | Extra tool | - | - |
| (none) | Missing call | - | - |
| (none) | Extra call | - | - |

Notes (not differences):
- The code graph adds the edge `check_results -> error_out` for `AgentError` (`max_turns`, `bad_output`). `design.md` describes it in "Sequence for one request", step 6, but not in the Mermaid graph. The edge ends at the same `error_out` node.
- The adapter labels name `createHttpSearch` as an alternative. `design.md` names it under "Generic HTTP adapter". It is the same node `*_api`.

## Screenshots
None. The system has no user interface. It has `POST /run` and `GET /health` only, and `server.js` serves no HTML page.
