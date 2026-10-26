// Runs the agent graph: input -> counter -> output.

import { runAgent, AgentError } from "./lib/agent-loop.js";
import { counter } from "./agents/counter.js";

export const MAX_INPUT = 10000;

export async function run(input) {
  if (typeof input !== "string") return { error: "invalid_input" };
  if (!input.trim()) return { error: "empty_input" };
  if (input.length > MAX_INPUT) return { error: "input_too_long" };
  try {
    return { output: await runAgent(counter, input) };
  } catch (err) {
    return { error: err instanceof AgentError ? err.code : "internal_error" };
  }
}
