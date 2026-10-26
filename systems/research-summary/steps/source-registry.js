// Step: source_registry. One registry for each request.
// Gives each new URL the next number (from 1), removes duplicate URLs,
// records failed sources and caches the tool result of each source.

export const SOURCES = ["web", "encyclopedia", "papers"];

export function createSourceRegistry() {
  const list = [];
  const byUrl = new Map();
  const byN = new Map();
  const failed = new Set();
  const stored = new Map();

  return {
    // Numbers and stores the results. Returns the numbered results.
    register(source, results) {
      return results.map(r => {
        const existing = byUrl.get(r.url);
        if (existing) return { n: existing.n, ...r, duplicate: true };
        const item = { n: list.length + 1, title: r.title, url: r.url, source };
        list.push(item);
        byUrl.set(item.url, item);
        byN.set(item.n, item);
        return { n: item.n, ...r };
      });
    },
    markFailed(source) {
      failed.add(source);
    },
    setResult(source, result) {
      stored.set(source, result);
    },
    getResult(source) {
      return stored.get(source);
    },
    // All items sorted by n, each with exactly the keys n, title, url, source.
    items() {
      return [...list].sort((a, b) => a.n - b.n).map(({ n, title, url, source }) => ({ n, title, url, source }));
    },
    has(n) {
      return byN.has(n);
    },
    get(n) {
      const item = byN.get(n);
      return item ? { ...item } : undefined;
    },
    sourceWarnings() {
      const warnings = [];
      for (const source of SOURCES) {
        if (failed.has(source)) warnings.push(`source_failed:${source}`);
        else if (!stored.has(source)) warnings.push(`source_not_searched:${source}`);
        else if (stored.get(source).status === "empty") warnings.push(`source_empty:${source}`);
      }
      return warnings;
    },
  };
}
