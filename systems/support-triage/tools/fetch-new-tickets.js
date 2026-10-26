// Tool: fetch_new_tickets. Caller: orchestrator only.
// Gets the new tickets (status "new", no team, no priority) from the ticket API adapter.
// The tool does not validate the ticket fields. validate_ticket in the orchestrator does that.

import { toolError } from "./get-triage-rules.js";

export const DEFAULT_LIMIT = 100;

export function createFetchNewTicketsTool(api) {
  return {
    name: "fetch_new_tickets",
    description: "Get the new tickets that have no team and no priority.",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "integer", minimum: 1, maximum: 100 } },
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
      properties: { tickets: { type: "array", maxItems: 100, items: { type: "object" } } },
      required: ["tickets"],
    },
    async run({ limit = DEFAULT_LIMIT } = {}) {
      let tickets;
      try {
        tickets = await api.listNewTickets(limit);
      } catch {
        throw toolError("ticket_api_unavailable");
      }
      if (!Array.isArray(tickets)) throw toolError("ticket_api_unavailable");
      return { tickets: tickets.slice(0, limit) };
    },
  };
}
