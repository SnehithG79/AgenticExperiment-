// The OpenAI translation is checked offline. No request leaves the computer.

import { test } from "node:test";
import assert from "node:assert/strict";
import { toOpenAI, fromOpenAI, provider } from "../lib/llm.js";

test("toOpenAI maps system, tools, tool calls and tool results", () => {
  const req = toOpenAI({
    system: "sys", max_tokens: 100,
    tools: [{ name: "t", description: "d", input_schema: { type: "object" } }],
    messages: [
      { role: "user", content: "hi" },
      { role: "assistant", content: [{ type: "tool_use", id: "c1", name: "t", input: { a: 1 } }] },
      { role: "user", content: [{ type: "tool_result", tool_use_id: "c1", content: "{\"ok\":true}" }] },
    ],
  }, "m");
  assert.equal(req.model, "m");
  assert.deepEqual(req.messages[0], { role: "system", content: "sys" });
  assert.deepEqual(req.messages[2].tool_calls[0], { id: "c1", type: "function", function: { name: "t", arguments: "{\"a\":1}" } });
  assert.deepEqual(req.messages[3], { role: "tool", tool_call_id: "c1", content: "{\"ok\":true}" });
  assert.equal(req.tools[0].function.parameters.type, "object");
});

test("fromOpenAI maps text and tool calls to content blocks", () => {
  const res = fromOpenAI({ choices: [{ message: { content: "x", tool_calls: [{ id: "c2", function: { name: "t", arguments: "{\"b\":2}" } }] } }] });
  assert.deepEqual(res.content, [{ type: "text", text: "x" }, { type: "tool_use", id: "c2", name: "t", input: { b: 2 } }]);
  assert.equal(res.stop_reason, "tool_use");
});

test("provider picks openai when only OPENAI_API_KEY is set", () => {
  const saved = { ...process.env };
  delete process.env.AGENT_PROVIDER; delete process.env.ANTHROPIC_API_KEY;
  process.env.OPENAI_API_KEY = "test-key-not-real";
  try { assert.equal(provider(), "openai"); } finally { process.env = saved; }
});
