// Unit tests for each tool: fetch_new_tickets, update_ticket, get_triage_rules.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

process.env.TRIAGE_LOG = "off";
delete process.env.TRIAGE_CONFIG;

const { createFetchNewTicketsTool } = await import("../tools/fetch-new-tickets.js");
const { createUpdateTicketTool } = await import("../tools/update-ticket.js");
const { createGetTriageRulesTool, getTriageRules, loadConfig } = await import("../tools/get-triage-rules.js");
const { createFakeTicketApi } = await import("../adapters/ticket-api.js");
const { callTool } = await import("../orchestrator.js");

const FIXTURE = JSON.parse(readFileSync(new URL("../fixtures/tickets.json", import.meta.url), "utf8"));
const setRecords = name => FIXTURE.sets[name].map(k => FIXTURE.records.find(r => r.fixture_key === k));

const rejectsWith = (promise, code) => assert.rejects(promise, err => err.code === code);

test("fetch_new_tickets returns only new tickets with no team and no priority", async () => {
  const tool = createFetchNewTicketsTool(createFakeTicketApi(setRecords("new5_closed3")));
  const { tickets } = await callTool(tool, {});
  assert.deepEqual(tickets.map(t => t.id), ["TCK-1001", "TCK-1002", "TCK-1003", "TCK-1004", "TCK-1005"]);
  for (const t of tickets) {
    assert.equal(t.status, "new");
    assert.equal(t.team, null);
    assert.equal(t.priority, null);
    assert.ok(!("expected_team" in t) && !("fixture_key" in t));
  }
});

test("fetch_new_tickets refuses limit 0 with invalid_input", async () => {
  const tool = createFetchNewTicketsTool(createFakeTicketApi(setRecords("new5_closed3")));
  await rejectsWith(callTool(tool, { limit: 0 }), "invalid_input");
});

test("fetch_new_tickets maps an adapter failure to ticket_api_unavailable", async () => {
  const tool = createFetchNewTicketsTool({ async listNewTickets() { throw new Error("down"); } });
  await rejectsWith(callTool(tool, {}), "ticket_api_unavailable");
});

test("update_ticket refuses a bad team, priority or reason with invalid_input", async () => {
  const tool = createUpdateTicketTool(createFakeTicketApi(setRecords("all")), loadConfig());
  const base = { ticket_id: "TCK-1001", team: "billing", priority: "P2", tags: [], reason: "ok" };
  await rejectsWith(callTool(tool, { ...base, team: "hr" }), "invalid_input");
  await rejectsWith(callTool(tool, { ...base, priority: "P5" }), "invalid_input");
  await rejectsWith(callTool(tool, { ...base, reason: "" }), "invalid_input");
  await rejectsWith(callTool(tool, { ...base, reason: "x".repeat(201) }), "invalid_input");
});

test("update_ticket returns ticket_already_triaged and ticket_not_found", async () => {
  const api = createFakeTicketApi(setRecords("all"));
  const tool = createUpdateTicketTool(api, loadConfig());
  const base = { team: "billing", priority: "P2", tags: [], reason: "ok" };
  await rejectsWith(callTool(tool, { ...base, ticket_id: "TCK-2001" }), "ticket_already_triaged");
  await rejectsWith(callTool(tool, { ...base, ticket_id: "TCK-9999" }), "ticket_not_found");
  assert.equal(api.calls.length, 0);
});

test("update_ticket writes one update and the fake records it", async () => {
  const api = createFakeTicketApi(setRecords("new5_closed3"));
  const tool = createUpdateTicketTool(api, loadConfig());
  const input = { ticket_id: "TCK-1001", team: "billing", priority: "P2", tags: ["needs-review"], reason: "ok" };
  assert.deepEqual(await callTool(tool, input), { ticket_id: "TCK-1001", updated: true });
  assert.deepEqual(api.calls, [input]);
  await rejectsWith(callTool(tool, input), "ticket_already_triaged");
});

test("get_triage_rules returns 5 teams and 4 priorities", async () => {
  const rules = await callTool(getTriageRules, {});
  assert.equal(rules.teams.length, 5);
  assert.equal(rules.priorities.length, 4);
  assert.ok(!("confidence_limit" in rules) && !("review_team" in rules));
});

test("get_triage_rules returns config_unavailable for a path that does not exist", async () => {
  const tool = createGetTriageRulesTool("/nonexistent/triage_config.json");
  await rejectsWith(tool.run({}), "config_unavailable");
});

test("get_triage_rules refuses an input that is not an empty object", async () => {
  await rejectsWith(callTool(getTriageRules, { team: "x" }), "invalid_input");
});
