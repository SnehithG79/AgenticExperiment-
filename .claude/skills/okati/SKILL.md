---
name: okati
description: Agent factory that builds agentic systems from a feature request. Runs a fixed loop of seven agents (plan, design, code, test and visualize, review, localhost) and merges to main only after review approves and the localhost run passes. Use when the user types /okati, /okati next or /okati resume followed by a job ID, or asks the factory to build an agentic system.
---

# okati: the agent factory

okati changes one feature request into one tested agentic system on branch `okati/<job-id>`.
This skill is the orchestrator.
The orchestrator starts each agent, waits for each output and writes `job.json`.
The orchestrator does not write code.

This skill is written in ASD-STE100 Simplified Technical English. Each term has one meaning only.

## 1. Terms

| Term | Meaning |
| --- | --- |
| Project root | The root folder of the Git repository. Branch `main` is checked out here. |
| Job folder | `okati/jobs/<job-id>/` in the project root. |
| Worktree | `.okati/worktrees/<job-id>/`. Branch `okati/<job-id>` is checked out here. |
| System folder | `systems/<short-name>/` on the branch. `design.md` names it. |
| Round | One pass of coder, tester, visualizer, reviewer and, if approved, localhost. |

## 2. The loop

```
request → planner → designer → coder → [tester, visualizer] → WAIT FOR ALL
                                 ▲                                │
                                 └──── CHANGES: new round ◄── reviewer ── ESCALATE → needs-human
                                 ▲                                │ APPROVE
                                 └──── FAIL: new round ◄──── localhost
                                                                  │ PASS
                                                            merge to main
```

| Step | Agent | Model | Reads | Writes |
| --- | --- | --- | --- | --- |
| 1 | `okati-planner` | opus | `request.md` | `plan.md` |
| 2 | `okati-designer` | opus | `plan.md`, `TEMPLATE.md` | `design.md` |
| 3 | `okati-coder` | opus | `design.md`, the last `review.md` or `run.md` | commits, `round-N/build.md` |
| 4a | `okati-tester` | sonnet | `design.md`, `build.md`, branch code | `round-N/test-report.md` |
| 4b | `okati-visualizer` | sonnet | `design.md`, branch code | `round-N/visual-report.md`, `round-N/diagrams/` |
| 5 | `okati-reviewer` | opus | all files of the round, the branch diff | `round-N/review.md` |
| 6 | `okati-localhost` | sonnet | `design.md`, branch code | `run.md` |

Do not add agents to the loop.

## 3. Commands

- `/okati <request text>` starts a new job from the request text.
- `/okati next` starts a new job from the first `[ ]` item in `okati/backlog.md`.
- `/okati resume <job-id>` continues a job with status `needs-human` after a human decision.
- `/okati` with no text: show the three commands. Do not start a job.

## 4. Setup

Do these checks before each job. Correct each item that is missing.

1. Make sure that the project root is a Git repository with a branch `main`.
2. Make sure that the working tree of `main` has no uncommitted changes outside `okati/jobs/`.
3. Make sure that `.claude/agents/` has the seven files `okati-*.md`.
4. Make sure that `okati/jobs/index.json` exists. If not, write `[]`.
5. Make sure that `okati/backlog.md`, `okati/dashboard.html` and `okati/templates/agent-system/` exist.
6. Make sure that `.gitignore` has the line `.okati/`.

## 5. How to start an agent

Give the agent only these three items: the job folder path, the round number and the branch name.
Each agent reads its inputs from the job folder.

1. If the agent type `okati-<name>` is available, start it with these three items.
2. If not, start a `general-purpose` agent with the `model` from the agent file frontmatter.
   Give it this prompt and the three items:
   `Read .claude/agents/okati-<name>.md. Do the steps in it. Do not do other work.`
3. Wait for the agent to stop. Do not start it in the background if the next step needs its output.

After each agent stops, do the output check:

1. Run `git status --porcelain -- <job folder>`.
2. Make sure that each changed file is an output of that agent. Section 2 gives the outputs.
3. If a different file changed, restore it with `git checkout -- <file>`.
4. Record the problem in `job.json` under `notes`.
5. Commit the job folder on `main` with the message `okati(<job-id>): <step>`.

The commit makes each output fixed. A later change shows in `git status`.

## 6. Job procedure

Do these steps for each job. Write `job.json` after each step. Set `updated` each time.

1. Make the job ID in the format `YYYYMMDD-<short-name>`. Use today's date and two or three words.
2. If the job ID exists, add `-2`, `-3` and so on.
3. Make the job folder. Write the request text to `request.md`.
4. Write `job.json` with status `planning`, round `0` and `max_rounds` 5. Add the job ID to `index.json`.
5. If the request is from the backlog, record the backlog line in `job.json` under `backlog_item`.
6. Start `okati-planner`. Wait for `plan.md`.
7. If the first line of `plan.md` is `blocked: true`, go to section 8. Use reason `plan blocked`.
8. Set status `designing`. Start `okati-designer`. Wait for `design.md`.
9. Make the branch and the worktree:
   `git worktree add -b okati/<job-id> .okati/worktrees/<job-id> main`
10. If the round is equal to `max_rounds`, go to section 8. Do not start a new round.
    Then add 1 to the round. Make the folder `round-N/`. Set status `coding`.
11. Start `okati-coder`. Wait for `round-N/build.md`.
12. Set status `verifying`. Start `okati-tester` and `okati-visualizer` in the same message, so that they run at the same time.
13. Wait for `round-N/test-report.md` and `round-N/visual-report.md`. Do not continue until both reports exist.
14. Read the first line of each report. Record `test` and `visual` in the `history` entry of the round.
15. Set status `reviewing`. Start `okati-reviewer`. Wait for `round-N/review.md`.
16. Read the verdict on the first line of `review.md`. Record it and its SHA-256 in `history`.
17. Do the action that section 7 gives for the verdict.
18. If the verdict is `APPROVE`, set status `running`. Start `okati-localhost`. Wait for `run.md`.
19. Read the result on the first line of `run.md`. Record it and its SHA-256 in `history`.
20. Copy `run.md` to `round-N/run.md`, so that each round keeps its localhost result.
21. If the result is `FAIL` and the round is less than `max_rounds`, go to step 10.
22. If the result is `FAIL` and the round is equal to `max_rounds`, go to section 8.
23. If the result is `PASS`, do the merge procedure in section 9.
24. Mark the backlog item: `[x]` for merged, `[!]` for needs-human. Add the job ID after the line.
25. Commit the job folder, `index.json` and `backlog.md` on `main`.

CAUTION: Do not merge a branch to `main` before the localhost agent writes `PASS`. A merge without a localhost run can put a defective system on `main`.

## 7. Review gate rules

| Condition | Verdict | Orchestrator action |
| --- | --- | --- |
| Tests pass, the graph matches the design, no security or quality item | `APPROVE` | Start the localhost agent |
| One or more items that the coding agent can correct | `CHANGES` | If the round is less than `max_rounds`, go to step 10 of section 6 |
| A security problem that the design causes, or a requirement conflict | `ESCALATE` | Go to section 8 |
| The round is equal to `max_rounds` and the verdict is not `APPROVE` | none | Go to section 8 |
| The first line is not one of the three verdicts | none | Go to section 8. Use reason `verdict not valid` |

Obey these rules:

1. Wait for all reports of a round before you start the review agent.
2. If one report is `FAIL` and the verdict is `APPROVE`, do not obey the verdict. Go to section 8.
3. A localhost `FAIL` starts a new round. The new round counts toward `max_rounds`.
4. Do not change a file in an earlier round folder.
5. Only a human can resume a job with status `needs-human`.

WARNING: Do not let an agent change its verdict file after the orchestrator reads the file. A changed verdict can merge code that no agent approved.

## 8. Stop for a human

1. Set status `needs-human`. Set `agent` to the agent that stopped the job.
2. Write `needs-human.md` in the format of section 11.
3. Write a one-sentence summary of the reason to `needs_human` in `job.json`.
4. Do steps 24 and 25 of section 6.
5. Keep the branch and the worktree. Tell the user the job ID and the question.

## 9. Merge procedure

1. Calculate the SHA-256 of `review.md` and `run.md` again.
2. Compare the two values with the values in `history`. If one value is different, go to section 8.
3. Make sure that the first line of `run.md` is `PASS`.
4. In the project root, run `git merge --no-ff okati/<job-id> -m "okati(<job-id>): merge"`.
5. If the merge has conflicts, run `git merge --abort`. Go to section 8 with reason `merge conflict`.
6. Remove the worktree with `git worktree remove .okati/worktrees/<job-id>`. Keep the branch.
7. Set status `merged`.

## 10. Job state file

Each job has one `job.json` file. Only the orchestrator writes this file. The dashboard reads this file.

```json
{
  "id": "20261026-support-triage",
  "title": "Support ticket triage agent",
  "status": "reviewing",
  "agent": "okati-reviewer",
  "round": 2,
  "max_rounds": 5,
  "branch": "okati/20261026-support-triage",
  "backlog_item": "Support ticket triage agent: read new tickets, set the team and the priority",
  "created": "2026-10-26T09:14:00Z",
  "updated": "2026-10-26T10:02:00Z",
  "history": [
    { "round": 1, "test": "FAIL", "visual": "PASS", "review": "CHANGES", "review_sha256": "…", "run": null, "run_sha256": null },
    { "round": 2, "test": "PASS", "visual": "PASS", "review": null, "review_sha256": null, "run": null, "run_sha256": null }
  ],
  "needs_human": null,
  "notes": []
}
```

| Status | Meaning |
| --- | --- |
| `queued` | The job is in the backlog. No agent has started. |
| `planning` | The planning agent writes `plan.md`. |
| `designing` | The designing agent writes `design.md`. |
| `coding` | The coding agent writes code for the current round. |
| `verifying` | The testing and debugging agent and the visualizing agent run at the same time. |
| `reviewing` | The review agent writes `review.md`. |
| `running` | The localhost agent runs the system. |
| `merged` | The branch is on `main`. The job is complete. |
| `needs-human` | The job stops. A human must read `needs-human.md` and make a decision. |

NOTE: The value `max_rounds` is 5. It is the round limit. You can set a lower value in `job.json` before the job starts.
Do not set a value higher than 5. The round limit stops a job that loops again and again.

## 11. needs-human.md format

```markdown
# Needs human: <job-id>

Stopped at: <agent>, round <N>
Reason: <one sentence>

## Question
<the question that the human must answer>

## Human decision
<the human writes here, then runs /okati resume <job-id>>
```

## 12. Resume procedure

1. Read `needs-human.md`. Find the section `## Human decision`.
2. If the section is empty or has only the placeholder line, tell the user that the decision is missing. Stop.
3. Rename `needs-human.md` to `needs-human-round-<N>.md`.
4. Do not change `max_rounds`. The rounds before the stop count toward the limit of 5.
   If the round is equal to 5, tell the user that the job used all rounds. Tell the user to start a new job. Stop.
5. Change the backlog mark from `[!]` back to `[ ]`.
6. If the decision changes the plan, write the decision to `request.md` under `## Human decision`. Go to step 6 of section 6.
7. If the decision changes the design, go to step 8 of section 6. Keep the branch and the round count.
   Do not do step 9 again if the worktree exists. The designer reads the decision in `needs-human-round-<N>.md`.
8. If the decision is a correction to the code, go to step 10 of section 6.
   The coding agent reads the decision in `needs-human-round-<N>.md`.
9. A human decision has priority over a `CHANGE` item of an earlier review.

## 13. Job folder layout

```
okati/
  backlog.md
  dashboard.html
  templates/agent-system/
  jobs/
    index.json
    <job-id>/
      job.json
      request.md
      plan.md
      design.md
      round-1/
        build.md
        test-report.md
        visual-report.md
        diagrams/
        review.md
        run.md            copy of run.md, only if the reviewer gave APPROVE
      round-2/            only if round 1 has verdict CHANGES or a localhost FAIL
      run.md              the last localhost result
      needs-human.md      only if the job escalates
```

## 14. Safety rules

- Do not start more than 5 rounds for one job. A resume does not reset the count.
- Do not merge a branch to `main` before the localhost agent writes `PASS`.
- Do not put an API key in a file. Systems read keys from environment variables.
- Use only ports from 3000 to 3999 for localhost runs. Use test keys and test data only.
- If a step needs a production credential, stop and ask the user.
