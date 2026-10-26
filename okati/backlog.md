# okati backlog

Write one feature request on each line. `/okati next` takes the first open request.

| Mark | Meaning |
| --- | --- |
| `[ ]` | Open |
| `[x]` | Merged. The orchestrator adds the job ID. |
| `[!]` | Blocked. The job has status `needs-human`. |

- [x] Support ticket triage agent: read new tickets, set the team and the priority (20261026-support-triage)
- [ ] Research agent: search three sources, write a summary with citations
- [ ] Switch both systems to OpenAI keys: update support-triage lib to the current template, make each .env.example list only AGENT_PROVIDER=openai, OPENAI_API_KEY and OPENAI_MODEL
