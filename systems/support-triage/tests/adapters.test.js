// Unit tests for the adapters: fake ticket API, state store, clock.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createFakeTicketApi } from "../adapters/ticket-api.js";
import { createMemoryStore } from "../adapters/state-store.js";
import { fixedClock, systemClock } from "../adapters/clock.js";

const FIXTURE = JSON.parse(readFileSync(new URL("../fixtures/tickets.json", import.meta.url), "utf8"));

test("fixture has 27 records and the named sets", () => {
  assert.equal(FIXTURE.records.length, 27);
  assert.deepEqual(Object.keys(FIXTURE.sets).sort(), ["all", "closed3", "empty", "invalid3", "labeled20", "new5_closed3"]);
  for (const r of FIXTURE.records) assert.ok(!r.requester || r.requester.email.endsWith("@example.test"));
});

test("fake ticket API fails an update in failUpdateIds and records nothing", async () => {
  const api = createFakeTicketApi(FIXTURE.records, { failUpdateIds: ["TCK-1003"] });
  await assert.rejects(api.updateTicket({ ticket_id: "TCK-1003", team: "account", priority: "P2", tags: [], reason: "r" }), e => e.code === "update_failed");
  assert.equal(api.calls.length, 0);
});

test("fake ticket API updates all duplicate copies and keeps the fixture unchanged", async () => {
  const api = createFakeTicketApi(FIXTURE.records);
  await api.updateTicket({ ticket_id: "TCK-1005", team: "technical", priority: "P4", tags: [], reason: "r" });
  const ids = (await api.listNewTickets(100)).map(t => t.id);
  assert.ok(!ids.includes("TCK-1005"));
  assert.equal(FIXTURE.records.find(r => r.fixture_key === "TCK-1005").team, null);
});

test("fake ticket API accuracy counts a labeled ticket with no update as not correct", async () => {
  const api = createFakeTicketApi(FIXTURE.records);
  assert.deepEqual(api.accuracy(), { labeled: 20, team_correct: 0, priority_correct: 0 });
});

test("memory store has and add", () => {
  const store = createMemoryStore(["A"]);
  assert.ok(store.has("A"));
  assert.ok(!store.has("B"));
  store.add("B");
  assert.ok(store.has("B"));
});

test("clocks", () => {
  assert.equal(fixedClock("2026-10-26T12:00:00Z")(), "2026-10-26T12:00:00Z");
  assert.ok(!Number.isNaN(Date.parse(systemClock()())));
});
