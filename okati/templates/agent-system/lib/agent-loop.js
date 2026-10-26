// Tool-use loop for one agent. The agent can call only its own tools.
// Each tool input is validated against the tool schema before the tool runs.

import { validate } from "./schema.js";
import { createModel } from "./llm.js";

export class AgentError extends Error {
  constructor(code) { super(code); this.code = code; }
}

export async function runAgent(agent, input, { maxTurns = 8, model = createModel(agent) } = {}) {
  const messages = [{ role: "user", content: input }];
  const toolDefs = agent.tools.map(t => ({ name: t.name, description: t.description, input_schema: t.inputSchema }));

  for (let turn = 0; turn < maxTurns; turn++) {
    const res = await model.call({
      model: process.env.AGENT_MODEL || agent.model,
      max_tokens: 1024,
      system: agent.system,
      tools: toolDefs,
      messages,
    });
    messages.push({ role: "assistant", content: res.content });

    const calls = res.content.filter(b => b.type === "tool_use");
    if (calls.length === 0) {
      const text = res.content.filter(b => b.type === "text").map(b => b.text).join("");
      return parseOutput(agent, text);
    }

    const results = [];
    for (const call of calls) {
      results.push({ type: "tool_result", tool_use_id: call.id, ...(await runTool(agent, call)) });
    }
    messages.push({ role: "user", content: results });
  }
  throw new AgentError("max_turns");
}

async function runTool(agent, call) {
  const tool = agent.tools.find(t => t.name === call.name);
  if (!tool) return { content: JSON.stringify({ error: "unknown_tool" }), is_error: true };
  const errors = validate(tool.inputSchema, call.input);
  if (errors.length) return { content: JSON.stringify({ error: "invalid_input", details: errors }), is_error: true };
  try {
    return { content: JSON.stringify(await tool.run(call.input)) };
  } catch {
    return { content: JSON.stringify({ error: "tool_failed" }), is_error: true };
  }
}

function parseOutput(agent, text) {
  let output;
  try {
    output = JSON.parse(text.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    throw new AgentError("bad_output");
  }
  if (validate(agent.outputSchema, output).length) throw new AgentError("bad_output");
  return output;
}

// Helper for mock policies: the last tool results, parsed, or null.
export function lastToolResults(messages) {
  const last = messages.at(-1);
  if (!Array.isArray(last?.content)) return null;
  const results = last.content.filter(b => b.type === "tool_result");
  return results.length ? results.map(r => JSON.parse(r.content)) : null;
}
