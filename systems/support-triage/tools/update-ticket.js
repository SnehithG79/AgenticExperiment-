// Tool: update_ticket. Caller: orchestrator only. The agent does not have this tool.
// Writes the team, the priority, the tags and the reason (as an internal note) to one ticket.
// The adapter refuses a ticket that already has a team or a priority. It never replies to the customer.

import { loadConfig, toolError } from "./get-triage-rules.js";

const ADAPTER_CODES = new Set(["ticket_not_found", "ticket_already_triaged", "update_failed"]);

export function updateTicketInputSchema(config) {
  return {
    type: "object",
    properties: {
      ticket_id: { type: "string", minLength: 1, maxLength: 64 },
      team: { type: "string", enum: [...config.teams] },
      priority: { type: "string", enum: config.priorities.map(p => p.id) },
      tags: { type: "array", maxItems: 1, items: { type: "string", enum: [config.review_tag] } },
      reason: { type: "string", minLength: 1, maxLength: 200 },
    },
    required: ["ticket_id", "team", "priority", "tags", "reason"],
    additionalProperties: false,
  };
}

export function createUpdateTicketTool(api, config = loadConfig()) {
  return {
    name: "update_ticket",
    description: "Write the team, the priority, the tags and the reason (internal note) to one ticket.",
    inputSchema: updateTicketInputSchema(config),
    outputSchema: {
      type: "object",
      properties: { ticket_id: { type: "string" }, updated: { type: "boolean" } },
      required: ["ticket_id", "updated"],
    },
    async run(input) {
      try {
        await api.updateTicket(input);
      } catch (err) {
        throw toolError(ADAPTER_CODES.has(err?.code) ? err.code : "update_failed");
      }
      return { ticket_id: input.ticket_id, updated: true };
    },
  };
}
