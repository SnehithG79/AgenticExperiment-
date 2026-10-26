// Test double for a search API. Returns fixture results for a query and
// records each query in `calls`.

export function createFakeSearch(fixture, { fail = false } = {}) {
  const calls = [];
  return {
    calls,
    async search(query) {
      calls.push(query);
      const value = Object.hasOwn(fixture, query) ? fixture[query] : undefined;
      const isError = value !== null && typeof value === "object" && !Array.isArray(value) && "error" in value;
      if (fail || isError) {
        const err = new Error("source_unavailable");
        err.code = "source_unavailable";
        throw err;
      }
      if (value === undefined) return [];
      return structuredClone(value);
    },
  };
}
