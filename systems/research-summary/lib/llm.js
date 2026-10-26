// Model client. Live mode calls Anthropic or OpenAI with the key from the
// environment. Mock mode calls the agent's deterministic mock policy, so
// tests and localhost runs use test data and no credential.
//
// The agent loop always speaks the Anthropic Messages format (text and
// tool_use blocks). The OpenAI client translates to and from Chat Completions.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export function provider() {
  const p = process.env.AGENT_PROVIDER;
  if (p === "anthropic" || p === "openai") return p;
  if (p) throw new Error(`AGENT_PROVIDER must be anthropic or openai, got ${p}`);
  return process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY ? "openai" : "anthropic";
}

function apiKey() {
  return provider() === "openai" ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
}

export function modelMode() {
  const mode = process.env.AGENT_MODE || "auto";
  if (mode === "mock") return "mock";
  if (mode === "live") return "live";
  return apiKey() ? "live" : "mock";
}

export function createModel(agent) {
  if (modelMode() === "mock") {
    return {
      mode: "mock",
      async call(request) {
        const content = agent.mock(request.messages);
        const stop_reason = content.some(b => b.type === "tool_use") ? "tool_use" : "end_turn";
        return { content, stop_reason };
      },
    };
  }
  const key = apiKey();
  if (!key) throw new Error(`AGENT_MODE=live needs ${provider() === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY"}`);
  return provider() === "openai" ? openaiModel(key) : anthropicModel(key);
}

function anthropicModel(key) {
  return {
    mode: "live",
    async call(request) {
      const res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ ...request, model: process.env.AGENT_MODEL || request.model }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(`model_http_${res.status}`);
      return res.json();
    },
  };
}

function openaiModel(key) {
  const model = process.env.OPENAI_MODEL;
  if (!model) throw new Error("AGENT_PROVIDER=openai needs OPENAI_MODEL");
  return {
    mode: "live",
    async call(request) {
      const res = await fetch(OPENAI_URL, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify(toOpenAI(request, model)),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(`model_http_${res.status}`);
      return fromOpenAI(await res.json());
    },
  };
}

// Anthropic request -> Chat Completions request.
export function toOpenAI(request, model) {
  const messages = [{ role: "system", content: request.system }];
  for (const m of request.messages) {
    if (typeof m.content === "string") {
      messages.push({ role: m.role, content: m.content });
    } else if (m.role === "assistant") {
      const text = m.content.filter(b => b.type === "text").map(b => b.text).join("");
      const calls = m.content.filter(b => b.type === "tool_use").map(b => ({
        id: b.id, type: "function", function: { name: b.name, arguments: JSON.stringify(b.input) },
      }));
      messages.push({ role: "assistant", content: text || null, ...(calls.length ? { tool_calls: calls } : {}) });
    } else {
      for (const b of m.content) {
        if (b.type === "tool_result") messages.push({ role: "tool", tool_call_id: b.tool_use_id, content: b.content });
        else if (b.type === "text") messages.push({ role: "user", content: b.text });
      }
    }
  }
  return {
    model,
    max_completion_tokens: request.max_tokens,
    messages,
    ...(request.tools?.length ? {
      tools: request.tools.map(t => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.input_schema } })),
    } : {}),
  };
}

// Chat Completions response -> Anthropic-style response.
export function fromOpenAI(body) {
  const msg = body.choices?.[0]?.message || {};
  const content = [];
  if (msg.content) content.push({ type: "text", text: msg.content });
  for (const c of msg.tool_calls || []) {
    let input;
    try { input = JSON.parse(c.function.arguments || "{}"); } catch { input = { _unparsed: c.function.arguments }; }
    content.push({ type: "tool_use", id: c.id, name: c.function.name, input });
  }
  return { content, stop_reason: content.some(b => b.type === "tool_use") ? "tool_use" : "end_turn" };
}
