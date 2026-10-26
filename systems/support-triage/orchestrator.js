// Runs the agent graph for one request:
// fetch_new_tickets -> dedupe -> validate_ticket -> state_store -> triager (retry once)
// -> route_review -> update_ticket -> summary.
// Only this file calls fetch_new_tickets and update_ticket. The model never writes to the ticket system.

import { readFileSync } from "node:fs";
import { runAgent } from "./lib/agent-loop.js";
import { createModel as defaultCreateModel } from "./lib/llm.js";
import { validate } from "./lib/schema.js";
import { triager } from "./agents/triager.js";
import { createFetchNewTicketsTool } from "./tools/fetch-new-tickets.js";
import { createUpdateTicketTool } from "./tools/update-ticket.js";
import { loadConfig, toolError } from "./tools/get-triage-rules.js";
import { createFakeTicketApi, createRestTicketApi } from "./adapters/ticket-api.js";
import { createMemoryStore } from "./adapters/state-store.js";
import { fixedClock, systemClock } from "./adapters/clock.js";

export const MAX_BODY_CHARS = 8000;
export const MAX_MODEL_ATTEMPTS = 2;

const FIXTURE = JSON.parse(readFileSync(new URL("./fixtures/tickets.json", import.meta.url), "utf8"));

const ID_LIST = { type: "array", maxItems: 50, items: { type: "string" } };
export const REQUEST_SCHEMA = {
  type: "object",
  properties: {
    ticket_set: { type: "string" },
    ticket_ids: ID_LIST,
    runs: { type: "integer", minimum: 1, maximum: 3 },
    fail_update_ids: ID_LIST,
    processed_ids: ID_LIST,
    include_records: { type: "boolean" },
  },
  additionalProperties: false,
};

// Validates the tool input against its schema with lib/schema.js, then runs the tool.
export async function callTool(tool, input) {
  if (validate(tool.inputSchema, input).length) throw toolError("invalid_input");
  return tool.run(input);
}

// One JSON line for each event. A log line never has the subject, the body or the requester data.
export function createLogger(sink) {
  if (typeof sink === "function") return entry => sink(JSON.stringify(entry));
  if (process.env.TRIAGE_LOG === "off") return () => {};
  return entry => console.log(JSON.stringify(entry));
}

export function adapterKind() {
  return process.env.TICKET_ADAPTER === "rest" ? "rest" : "fake";
}

export function selectClock(kind) {
  if (process.env.TRIAGE_CLOCK === "fixed") return fixedClock();
  if (process.env.TRIAGE_CLOCK === "system") return systemClock();
  return kind === "fake" ? fixedClock() : systemClock();
}

const hasId = t => typeof t?.id === "string" && t.id !== "";

function dedupe(tickets) {
  const seen = new Set();
  const out = [];
  for (const t of tickets) {
    if (hasId(t)) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
    }
    out.push(t);
  }
  return out;
}

// Returns null for a valid ticket, or the error code.
export function validateTicket(t) {
  if (!hasId(t)) return "missing_ticket_id";
  if (t.body === undefined || t.body === null || (typeof t.body === "string" && t.body.trim() === "")) return "missing_body";
  if (typeof t.body !== "string") return "invalid_body_type";
  if (t.subject !== undefined && typeof t.subject !== "string") return "invalid_subject_type";
  return null;
}

function routeReview(result, config) {
  const review = { team: config.review_team, tags: [config.review_tag] };
  if (!result) {
    return { ...review, priority: config.default_priority, reason: "Model output was not valid two times. Sent to review.", code: "bad_output" };
  }
  if (result.language !== config.language) {
    return { ...review, priority: result.priority, reason: "Ticket language is not English. Sent to review.", code: "language" };
  }
  if (result.confidence < config.confidence_limit) {
    return {
      ...review,
      priority: result.priority,
      reason: `Model confidence ${String(result.confidence)} is below ${String(config.confidence_limit)}. Sent to review.`,
      code: "low_confidence",
    };
  }
  return { team: result.team, priority: result.priority, tags: [], reason: result.reason, code: null };
}

// Runs the triager at most 2 times. Returns the output, or null after 2 failures.
async function classify(ticket, ctx, runAt) {
  const message = JSON.stringify({
    ticket_id: ticket.id,
    subject: ticket.subject ?? "",
    body: ticket.body.slice(0, MAX_BODY_CHARS),
  });
  for (let attempt = 1; attempt <= MAX_MODEL_ATTEMPTS; attempt++) {
    try {
      return await runAgent(triager, message, { model: ctx.countingModel() });
    } catch (err) {
      if (attempt < MAX_MODEL_ATTEMPTS) {
        ctx.log({ time: runAt, event: "model_retry", ticket_id: ticket.id, code: err?.code || "model_error" });
      }
    }
  }
  return null;
}

// One run: steps 1 to 9 of the design. Throws a tool error if fetch_new_tickets fails.
export async function triageRun(ctx) {
  const { clock, store, config, log, fetchTool, updateTool } = ctx;
  const runAt = clock();
  const summary = { run_at: runAt, read: 0, updated: 0, needs_review: 0, failed: 0, invalid: 0, skipped: 0 };
  const readIds = [];
  const records = [];
  const errors = [];
  const updates = [];

  const { tickets } = await callTool(fetchTool, { limit: 100 });
  const unique = dedupe(tickets);
  summary.read = unique.length;

  for (const ticket of unique) {
    const ticketId = hasId(ticket) ? ticket.id : null;
    readIds.push(ticketId);

    const code = validateTicket(ticket);
    if (code) {
      summary.invalid++;
      errors.push({ ticket_id: ticketId, code });
      log({ time: runAt, event: "ticket_invalid", ticket_id: ticketId, code });
      continue;
    }
    records.push({ ticket_id: ticket.id, subject: ticket.subject ?? "", body: ticket.body });

    if (store.has(ticket.id)) {
      summary.skipped++;
      log({ time: runAt, event: "ticket_skipped", ticket_id: ticket.id });
      continue;
    }

    const result = await classify(ticket, ctx, runAt);
    const route = routeReview(result, config);
    const input = { ticket_id: ticket.id, team: route.team, priority: route.priority, tags: route.tags, reason: route.reason };
    if (route.code) log({ time: runAt, event: "ticket_review", ticket_id: ticket.id, code: route.code });

    try {
      await callTool(updateTool, input);
    } catch (err) {
      const failCode = err?.code || "update_failed";
      summary.failed++;
      errors.push({ ticket_id: ticket.id, code: failCode });
      log({ time: runAt, event: "update_failed", ticket_id: ticket.id, code: failCode });
      continue;
    }
    store.add(ticket.id);
    updates.push(input);
    summary.updated++;
    if (input.tags.includes(config.review_tag)) summary.needs_review++;
    log({ time: runAt, event: "ticket_updated", ticket_id: ticket.id });
  }

  log({ time: runAt, event: "run_summary", summary });
  return { summary, readIds, records, errors, updates };
}

function createContext({ api, store, clock, config, log, createModel = defaultCreateModel }) {
  const counters = { modelCalls: 0 };
  return {
    api,
    store,
    clock,
    config,
    log,
    counters,
    fetchTool: createFetchNewTicketsTool(api),
    updateTool: createUpdateTicketTool(api, config),
    // Wrapper around createModel(agent) that counts each model call.
    countingModel() {
      const model = createModel(triager);
      return {
        ...model,
        async call(request) {
          counters.modelCalls++;
          return model.call(request);
        },
      };
    },
  };
}

function selectRecords(input) {
  if (input.ticket_ids) {
    const byKey = new Map(FIXTURE.records.map(r => [r.fixture_key, r]));
    if (!input.ticket_ids.every(k => byKey.has(k))) return { error: "unknown_ticket_id" };
    return { records: input.ticket_ids.map(k => byKey.get(k)) };
  }
  const name = input.ticket_set ?? "all";
  if (!Object.hasOwn(FIXTURE.sets, name)) return { error: "unknown_ticket_set" };
  const byKey = new Map(FIXTURE.records.map(r => [r.fixture_key, r]));
  return { records: FIXTURE.sets[name].map(k => byKey.get(k)).filter(Boolean) };
}

// POST /run. options (tests only): createModel(agent), log(line).
export async function run(input, options = {}) {
  try {
    if (validate(REQUEST_SCHEMA, input).length) return { error: "invalid_input" };
    if (input.ticket_set !== undefined && input.ticket_ids !== undefined) return { error: "invalid_input" };

    const selected = selectRecords(input);
    if (selected.error) return { error: selected.error };

    let config;
    try {
      config = loadConfig();
    } catch {
      return { error: "config_unavailable" };
    }

    const kind = adapterKind();
    const api = kind === "rest"
      ? createRestTicketApi(process.env)
      : createFakeTicketApi(selected.records, { failUpdateIds: input.fail_update_ids ?? [] });
    const ctx = createContext({
      api,
      store: createMemoryStore(input.processed_ids ?? []),
      clock: selectClock(kind),
      config,
      log: createLogger(options.log),
      createModel: options.createModel,
    });

    const summaries = [];
    const errors = [];
    const updates = [];
    let first;
    for (let i = 0; i < (input.runs ?? 1); i++) {
      const result = await triageRun(ctx);
      if (i === 0) first = result;
      summaries.push(result.summary);
      errors.push(...result.errors);
      updates.push(...result.updates);
    }

    const recorded = api.calls ? api.calls.map(c => ({ ...c, tags: [...c.tags] })) : updates;
    const output = {
      summaries,
      updates: recorded,
      update_calls: recorded.length,
      model_calls: ctx.counters.modelCalls,
      errors,
      read_ids: first.readIds,
    };
    if (api.accuracy) {
      const accuracy = api.accuracy();
      if (accuracy.labeled > 0) output.accuracy = accuracy;
    }
    if (input.include_records === true) output.records = first.records;
    return { output };
  } catch (err) {
    if (err?.code === "ticket_api_unavailable") return { error: "ticket_api_unavailable" };
    if (err?.code === "config_unavailable") return { error: "config_unavailable" };
    return { error: "internal_error" };
  }
}

// Scheduled run: one long-lived adapter and one long-lived state store for the life of the process.
// The summary goes to the log only.
export function createScheduledRunner({ log } = {}) {
  const kind = adapterKind();
  const api = kind === "rest" ? createRestTicketApi(process.env) : createFakeTicketApi(FIXTURE.records);
  const store = createMemoryStore();
  const clock = selectClock(kind);
  const logger = createLogger(log);
  let busy = false;
  return async function scheduledRun() {
    if (busy) return null;
    busy = true;
    try {
      const config = loadConfig();
      const ctx = createContext({ api, store, clock, config, log: logger });
      return (await triageRun(ctx)).summary;
    } catch (err) {
      logger({ time: clock(), event: "run_failed", code: err?.code || "internal_error" });
      return null;
    } finally {
      busy = false;
    }
  };
}
