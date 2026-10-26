// Model client. Live mode calls the Anthropic Messages API with the key from
// the environment. Mock mode calls the agent's deterministic mock policy, so
// tests and localhost runs use test data and no credential.

const API_URL = "https://api.anthropic.com/v1/messages";

export function modelMode() {
  const mode = process.env.AGENT_MODE || "auto";
  if (mode === "mock") return "mock";
  if (mode === "live") return "live";
  return process.env.ANTHROPIC_API_KEY ? "live" : "mock";
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
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("AGENT_MODE=live needs ANTHROPIC_API_KEY");
  return {
    mode: "live",
    async call(request) {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(`model_http_${res.status}`);
      return res.json();
    },
  };
}
