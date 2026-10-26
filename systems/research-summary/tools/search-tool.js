// Factory for the three search tools. The model gives no query: the tool
// searches for the question that the orchestrator gives to the factory.

export const MAX_RESULTS = 3;
export const MAX_SNIPPET = 1000;

export const searchInputSchema = { type: "object", properties: {}, additionalProperties: false };

export const searchOutputSchema = {
  type: "object",
  properties: {
    source: { type: "string", enum: ["web", "encyclopedia", "papers"] },
    status: { type: "string", enum: ["ok", "empty", "error"] },
    error: { type: "string", enum: ["source_unavailable"] },
    results: {
      type: "array",
      maxItems: MAX_RESULTS,
      items: {
        type: "object",
        properties: {
          n: { type: "integer", minimum: 1 },
          title: { type: "string", minLength: 1 },
          url: { type: "string", minLength: 1 },
          snippet: { type: "string", minLength: 1, maxLength: MAX_SNIPPET },
          authors: { type: "array", items: { type: "string" } },
          year: { type: "integer" },
          duplicate: { type: "boolean" },
        },
        required: ["n", "title", "url", "snippet"],
      },
    },
  },
  required: ["source", "status", "results"],
};

const text = value => typeof value === "string" && value.trim() !== "";

// Keeps a mapped result only if title, url and snippet are non-empty strings.
function clean(mapped) {
  if (!mapped || !text(mapped.title) || !text(mapped.url) || !text(mapped.snippet)) return null;
  const result = { title: mapped.title, url: mapped.url.trim(), snippet: mapped.snippet.slice(0, MAX_SNIPPET) };
  if (Array.isArray(mapped.authors) && mapped.authors.every(a => typeof a === "string")) result.authors = mapped.authors;
  if (Number.isInteger(mapped.year)) result.year = mapped.year;
  return result;
}

export function createSearchTool({ name, source, description, api, question, registry, map }) {
  return {
    name,
    description,
    inputSchema: searchInputSchema,
    outputSchema: searchOutputSchema,
    async run() {
      // 1. One adapter call for each source. A second call returns the stored result.
      const stored = registry.getResult(source);
      if (stored) return stored;

      // 2 and 3. Call the adapter. An adapter error is a tool result, not a throw.
      let raw;
      try {
        raw = await api.search(question);
        if (!Array.isArray(raw)) throw new Error("source_unavailable");
      } catch {
        registry.markFailed(source);
        const failed = { source, status: "error", error: "source_unavailable", results: [] };
        registry.setResult(source, failed);
        return failed;
      }

      // 4 and 5. Map, remove results that are not usable, keep the first 3.
      const mapped = [];
      for (const item of raw) {
        let r = null;
        try { r = clean(map(item)); } catch { r = null; }
        if (r) mapped.push(r);
        if (mapped.length === MAX_RESULTS) break;
      }

      // 6 to 8. Number the results, build the result and store it.
      const results = registry.register(source, mapped);
      const result = results.length ? { source, status: "ok", results } : { source, status: "empty", results: [] };
      registry.setResult(source, result);
      return result;
    },
  };
}
