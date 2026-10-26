// Tool: get_triage_rules. Caller: agent triager.
// Gives the list of teams and the priorities with their meaning.
// It does not give confidence_limit, review_team, review_tag or default_priority.

import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

export function toolError(code) {
  const err = new Error(code);
  err.code = code;
  return err;
}

// Path of the configuration file: TRIAGE_CONFIG (relative to the system folder) or the fixture.
export function configPath() {
  const p = process.env.TRIAGE_CONFIG || "fixtures/triage_config.json";
  return isAbsolute(p) ? p : ROOT + p;
}

// Reads and validates the configuration. Throws an error with code config_unavailable.
export function loadConfig(path = configPath()) {
  let config;
  try {
    config = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw toolError("config_unavailable");
  }
  if (!isValidConfig(config)) throw toolError("config_unavailable");
  return config;
}

function isValidConfig(c) {
  if (!c || typeof c !== "object" || Array.isArray(c)) return false;
  if (!Array.isArray(c.teams) || c.teams.length < 1 || !c.teams.every(t => typeof t === "string" && t)) return false;
  if (!c.teams.includes(c.review_team)) return false;
  if (!Array.isArray(c.priorities) || c.priorities.length < 1) return false;
  if (!c.priorities.every(p => p && typeof p.id === "string" && p.id && typeof p.meaning === "string")) return false;
  if (!c.priorities.some(p => p.id === c.default_priority)) return false;
  if (typeof c.confidence_limit !== "number" || !(c.confidence_limit >= 0 && c.confidence_limit <= 1)) return false;
  if (typeof c.review_tag !== "string" || !c.review_tag) return false;
  if (typeof c.language !== "string" || !c.language) return false;
  return true;
}

export function createGetTriageRulesTool(path) {
  return {
    name: "get_triage_rules",
    description: "Get the list of teams and the list of priorities with the meaning of each priority. Use only these values.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    outputSchema: {
      type: "object",
      properties: {
        teams: { type: "array", items: { type: "string" } },
        priorities: {
          type: "array",
          items: {
            type: "object",
            properties: { id: { type: "string" }, meaning: { type: "string" } },
            required: ["id", "meaning"],
          },
        },
      },
      required: ["teams", "priorities"],
    },
    async run() {
      const config = loadConfig(path ?? configPath());
      return {
        teams: [...config.teams],
        priorities: config.priorities.map(p => ({ id: p.id, meaning: p.meaning })),
      };
    },
  };
}

export const getTriageRules = createGetTriageRulesTool();
