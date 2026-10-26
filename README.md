# AgenticExperiment-

Using Claude Code to construct an open source agentic system that can be utilized to build tools and code apps.

This repository holds **okati**, the agent factory described below.

## okati

okati is an agent factory for Claude Code.
You give okati one feature request.
okati builds one tested agentic system and merges it to `main`.

An agentic system is a software system in which one or more LLM agents use tools to do tasks.

This README is written in ASD-STE100 Simplified Technical English.

## How okati works

Seven agents process each request in a fixed loop.

```
request → planner → designer → coder → [tester, visualizer] → WAIT FOR ALL
                                 ▲                                │
                                 └──── CHANGES: new round ◄── reviewer ── ESCALATE → needs-human
                                 ▲                                │ APPROVE
                                 └──── FAIL: new round ◄──── localhost
                                                                  │ PASS
                                                            merge to main
```

| Agent | Model | Reads | Writes |
| --- | --- | --- | --- |
| `okati-planner` | opus | `request.md` | `plan.md` |
| `okati-designer` | opus | `plan.md`, `TEMPLATE.md` | `design.md` |
| `okati-coder` | opus | `design.md`, the last `review.md` or `run.md` | commits, `round-N/build.md` |
| `okati-tester` | sonnet | `design.md`, `build.md`, branch code | `round-N/test-report.md` |
| `okati-visualizer` | sonnet | `design.md`, branch code | `round-N/visual-report.md`, `round-N/diagrams/` |
| `okati-reviewer` | opus | all files of the round, the branch diff | `round-N/review.md` |
| `okati-localhost` | sonnet | `design.md`, branch code | `run.md` |

The tester and the visualizer run at the same time. The reviewer waits for both reports.

A job merges to `main` only when two conditions are true:

1. The reviewer gives the verdict `APPROVE`.
2. The localhost agent writes the result `PASS`.

If a job does not pass after 5 rounds, the job stops and waits for a human.
A resume does not reset the count. okati does not start more than 5 rounds for one job.

## Requirements

- Claude Code with skills and subagents
- A Git repository with a branch `main`
- Node.js 20 or later, for the systems that okati builds
- Python 3 or a different static file server, for the dashboard

## Install

okati is already installed in this repository:

- The orchestrator is `.claude/skills/okati/SKILL.md`.
- The seven agents are `.claude/agents/okati-*.md`.

To install okati in a different project:

1. Copy `.claude/skills/okati/` and `.claude/agents/okati-*.md` to the same paths in the project.
2. Copy the `okati/` folder to the project root. Set `okati/jobs/index.json` to `[]`.
3. Add the line `.okati/` to `.gitignore`.
4. Open the project in Claude Code. Run `/okati next`.

## Commands

| Command | Result |
| --- | --- |
| `/okati <request text>` | Starts a new job from the request text |
| `/okati next` | Starts a new job from the first open item in `okati/backlog.md` |
| `/okati resume <job-id>` | Continues a stopped job after a human decision |

Example:

```
/okati Build a support ticket triage agent. Read each new ticket. Set the team and the priority.
```

### Add requests to the backlog

Write one request on each line of `okati/backlog.md`:

```markdown
- [ ] Support ticket triage agent: read new tickets, set the team and the priority
```

| Mark | Meaning |
| --- | --- |
| `[ ]` | Open |
| `[x]` | Merged. okati adds the job ID. |
| `[!]` | The job has status `needs-human`. |

### See the dashboard

1. Start a static file server in the `okati/` folder:

   ```bash
   cd okati && python3 -m http.server 8080
   ```

2. Open `http://localhost:8080/dashboard.html`.

The dashboard shows one column for each job status.
Jobs that need a human are at the top, with a red border.
The dashboard reads `jobs/index.json` and each `job.json` again every 10 seconds.

### Resolve a job that needs a human

1. Open `okati/jobs/<job-id>/needs-human.md`.
2. Read the reason and the question.
3. Write your decision under `## Human decision`.
4. Run `/okati resume <job-id>`.

## File layout

```
.claude/
  skills/okati/SKILL.md          the orchestrator: runs the loop, writes job.json
  agents/okati-*.md              the seven agents
okati/
  backlog.md                     the queue of requests
  dashboard.html                 the visual board
  templates/agent-system/        a working minimal system that the coder copies
    TEMPLATE.md                  the rules for each system
  jobs/
    index.json                   the list of job IDs
    <job-id>/
      job.json                   the job status. Only the orchestrator writes it.
      request.md
      plan.md
      design.md
      round-N/                   build.md, test-report.md, visual-report.md, diagrams/, review.md, run.md
      run.md                     the last localhost result
      needs-human.md             only if the job stops
systems/<short-name>/            each merged system, from its branch
.okati/worktrees/<job-id>/       the branch checkout during a job. Git ignores it.
```

## The template system

`okati/templates/agent-system/` has one agent, one tool, `POST /run`, `GET /health` and `evals/cases.json`.

```bash
cd okati/templates/agent-system
npm test          # unit tests and one test for each evaluation case
npm start         # starts the server on port 3100
```

Each system has two model modes:

| `AGENT_MODE` | Result |
| --- | --- |
| `auto` (default) | Live mode if the provider key has a value. If not, mock mode. |
| `mock` | Each agent uses a deterministic mock policy. No credential is necessary. |
| `live` | Calls OpenAI or Anthropic. `AGENT_PROVIDER`, `OPENAI_API_KEY` and `OPENAI_MODEL` (or `ANTHROPIC_API_KEY`) select. |

The tester and the localhost agent use mock mode.

### Add your API keys

1. Go to the system folder, for example `systems/support-triage/`.
2. Copy `.env.example` to `.env`.
3. Write your key and model in `.env`, for example `OPENAI_API_KEY` and `OPENAI_MODEL`.
4. Run `npm start`. The server reads `.env`. Git ignores `.env`.

## Configuration

| Setting | Where | Default |
| --- | --- | --- |
| Maximum rounds | `max_rounds` in `job.json`, before the job starts. 5 is the limit. | 5 |
| Agent model | `model:` in each `.claude/agents/okati-*.md` file | opus or sonnet |
| Localhost ports | `design.md` of each job. `server.js` refuses other ports. | 3000 to 3999 |
| System model | `AGENT_MODEL` environment variable | `claude-sonnet-5-5` |
| Agent turns in a system | `maxTurns` in `lib/agent-loop.js`. 5 is the limit. | 5 |

## Safety rules

- okati does not merge a branch before the localhost agent writes `PASS`.
- okati does not start more than 5 rounds for one job.
- Each agent in a built system stops after 5 model turns with the error `max_turns`.
- Each agent writes only its own output files. The orchestrator checks this after each agent.
- The orchestrator commits each output. A later change to a verdict stops the merge.
- Systems read API keys from environment variables. No key is in the code.
- Localhost runs use ports from 3000 to 3999, test keys and test data only.

WARNING: Do not connect a system to production services during the localhost run. Production calls can change real data.
