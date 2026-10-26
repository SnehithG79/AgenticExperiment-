// Ticket system adapters.
// createFakeTicketApi: in-memory test double with fixture records. Tests and the localhost run use it.
// createRestTicketApi: first live adapter for a generic REST ticket API. Select it with TICKET_ADAPTER=rest.

function adapterError(code) {
  const err = new Error(code);
  err.code = code;
  return err;
}

const clone = value => JSON.parse(JSON.stringify(value));
const FIXTURE_ONLY = ["fixture_key", "expected_team", "expected_priority"];

function isNewUntriaged(t) {
  return t.status === "new" && t.team === null && t.priority === null;
}

export function createFakeTicketApi(records, { failUpdateIds = [] } = {}) {
  const stored = clone(records);
  const failIds = new Set(failUpdateIds);
  const calls = [];

  return {
    kind: "fake",
    calls,
    async listNewTickets(limit = 100) {
      return stored
        .filter(isNewUntriaged)
        .slice(0, limit)
        .map(t => {
          const copy = clone(t);
          for (const key of FIXTURE_ONLY) delete copy[key];
          return copy;
        });
    },
    async updateTicket({ ticket_id, team, priority, tags, reason }) {
      const matches = stored.filter(t => t.id === ticket_id);
      if (matches.length === 0) throw adapterError("ticket_not_found");
      if (matches.some(t => t.team !== null || t.priority !== null)) throw adapterError("ticket_already_triaged");
      if (failIds.has(ticket_id)) throw adapterError("update_failed");
      calls.push({ ticket_id, team, priority, tags: [...tags], reason });
      // Duplicate records with the same ID: update all copies. The status does not change.
      for (const t of matches) {
        t.team = team;
        t.priority = priority;
        t.tags = [...tags];
        t.note = reason;
      }
      return { ticket_id, updated: true };
    },
    // Compares the recorded update of each labeled ticket with the label.
    accuracy() {
      const labeled = stored.filter(t => typeof t.expected_team === "string");
      let teamCorrect = 0;
      let priorityCorrect = 0;
      for (const t of labeled) {
        const call = calls.find(c => c.ticket_id === t.id);
        if (!call) continue;
        if (call.team === t.expected_team) teamCorrect++;
        if (call.priority === t.expected_priority) priorityCorrect++;
      }
      return { labeled: labeled.length, team_correct: teamCorrect, priority_correct: priorityCorrect };
    },
  };
}

export function createRestTicketApi(env = process.env) {
  const baseUrl = (env.TICKET_API_URL || "").replace(/\/+$/, "");
  const token = env.TICKET_API_TOKEN || "";
  const headers = () => ({
    "content-type": "application/json",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  });
  const request = (path, options = {}) =>
    fetch(`${baseUrl}${path}`, { ...options, headers: headers(), signal: AbortSignal.timeout(30_000) });

  return {
    kind: "rest",
    async listNewTickets(limit = 100) {
      if (!baseUrl) throw adapterError("ticket_api_unavailable");
      let res;
      try {
        res = await request(`/tickets?status=new&limit=${limit}`);
      } catch {
        throw adapterError("ticket_api_unavailable");
      }
      if (!res.ok) throw adapterError("ticket_api_unavailable");
      const body = await res.json().catch(() => null);
      const list = Array.isArray(body) ? body : body?.tickets;
      if (!Array.isArray(list)) throw adapterError("ticket_api_unavailable");
      return list.filter(t => t && isNewUntriaged(t)).slice(0, limit);
    },
    async updateTicket({ ticket_id, team, priority, tags, reason }) {
      if (!baseUrl) throw adapterError("update_failed");
      const path = `/tickets/${encodeURIComponent(ticket_id)}`;
      try {
        // Read the ticket first: never change a team or a priority that a human set.
        const current = await request(path);
        if (current.status === 404) throw adapterError("ticket_not_found");
        if (!current.ok) throw adapterError("update_failed");
        const ticket = await current.json();
        if (ticket.team != null || ticket.priority != null || ticket.status !== "new") {
          throw adapterError("ticket_already_triaged");
        }
        // The reason goes into an internal note only. No reply to the customer. No status change.
        const res = await request(path, {
          method: "PATCH",
          body: JSON.stringify({ team, priority, tags, internal_note: reason }),
        });
        if (res.status === 404) throw adapterError("ticket_not_found");
        if (!res.ok) throw adapterError("update_failed");
        return { ticket_id, updated: true };
      } catch (err) {
        if (err?.code) throw err;
        throw adapterError("update_failed");
      }
    },
  };
}
