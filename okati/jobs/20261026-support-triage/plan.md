blocked: false

# Plan: Support ticket triage agent

## Goal

The system reads each new support ticket and sets one team and one priority on that ticket.

## Tasks and acceptance criteria

| ID | Task | Acceptance criterion |
|----|------|----------------------|
| T1 | Get the new tickets from the ticket system. | With a fixture of 5 new tickets and 3 closed tickets, the system reads exactly the 5 new tickets. |
| T2 | Read the subject and the body of each ticket. | For each fixture ticket, the system record has the same ticket ID, subject and body as the fixture. |
| T3 | Select one team for each ticket from the team list. | On the labeled fixture set of 20 tickets, the selected team is correct for 18 or more tickets. |
| T4 | Select one priority for each ticket from the priority list. | On the labeled fixture set of 20 tickets, the selected priority is correct for 17 or more tickets. |
| T5 | Write the team and the priority back to the ticket system. | After one run, the test double records one update for each new ticket with a valid team and priority. |
| T6 | Give a short reason for each decision. | Each update has a reason text that is not empty and has a maximum of 200 characters. |
| T7 | Send unclear tickets to a default queue. | A ticket with a model confidence below 0.6 gets team "general" and a "needs-review" tag. |
| T8 | Do not triage a ticket two times. | When the system runs two times on the same fixture, the test double records each ticket update only one time. |
| T9 | Continue when one ticket update fails. | When the test double fails the update for 1 of 5 tickets, the system updates the other 4 and logs 1 error. |
| T10 | Write a run summary. | After each run, the summary shows the number of tickets read, updated, sent to review and failed. |
| E1 | Empty input. | With 0 new tickets, the system makes 0 updates, makes 0 model calls and writes a summary with all counts at 0. |
| E2 | Input that is not valid. | A ticket with no body, a body that is not text, or a missing ticket ID gets no update and the system logs a validation error. |

## External services and data

| Service | Use | Test double |
|---------|-----|-------------|
| Ticket system API (for example Zendesk, Freshdesk or Jira Service Management) | Read new tickets. Write the team, the priority, the tag and the reason. | In-memory fake ticket API. Fixture `tickets.json` has 20 labeled tickets, 3 closed tickets, 3 invalid tickets and 1 duplicate. The fake records each update call and can fail a call on request. |
| Language model API (Claude) | Classify each ticket into team and priority, with a reason and a confidence value. | Stub model client. Fixture `model_responses.json` maps each fixture ticket ID to a fixed team, priority, reason and confidence. One entry returns output that is not valid JSON. |
| Team and priority configuration | Supply the list of teams, the list of priorities and the rules for each priority. | Fixture `triage_config.json` with teams "billing", "technical", "account", "sales" and "general", and priorities "P1" to "P4". |
| State store for processed ticket IDs | Prevent a second triage of the same ticket. | In-memory store. Fixture starts empty. One test starts with 2 IDs already in the store. |
| Clock | Set the run time in the summary and the logs. | Fixed clock that returns 2026-10-26T12:00:00Z. |

## Open questions

| Question | Assumption |
|----------|------------|
| Which ticket system does the team use? | The system uses a generic ticket adapter. The first adapter is for a REST ticket API. Tests use the fake. |
| What are the teams? | The teams are billing, technical, account, sales and general. The configuration file can change this list. |
| What are the priority levels and their meaning? | P1 is a service outage or a security issue. P2 blocks one customer. P3 is a normal issue. P4 is a question or a request. |
| What is a "new" ticket? | A new ticket has status "new" and has no team set. |
| How does the system start? | The system runs on a schedule every 5 minutes. A manual run is also possible. |
| Can the system change a team or priority that a human set? | No. The system updates only tickets with no team and no priority. |
| Does the system reply to the customer? | No. The system only sets fields and adds an internal note. |
| What languages do tickets use? | Tickets are in English. A ticket in another language goes to "general" with the "needs-review" tag. |
| Does ticket data contain personal data? | Yes. The system sends only the subject and the body to the model. Logs show the ticket ID, not the text. |
| What confidence limit sends a ticket to review? | The limit is 0.6. The configuration file can change this value. |
| What happens when the model output is not valid? | The system tries one more time. After a second failure, the ticket goes to "general" with the "needs-review" tag. |
