// Generic HTTP search adapter. Selected only with SEARCH_ADAPTER=http.
// Not used in tests or in the localhost run.
// Request: GET <url>?q=<query>&limit=3. Response: {"results": [...]}.

const unavailable = () => {
  const err = new Error("source_unavailable");
  err.code = "source_unavailable";
  return err;
};

export function createHttpSearch({ url, key, map = item => item }) {
  const calls = [];
  return {
    calls,
    async search(query) {
      calls.push(query);
      if (!url) throw unavailable();
      let body;
      try {
        const res = await fetch(`${url}?q=${encodeURIComponent(query)}&limit=3`, {
          headers: key ? { authorization: `Bearer ${key}` } : {},
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) throw unavailable();
        body = await res.json();
      } catch {
        throw unavailable();
      }
      if (!Array.isArray(body?.results)) throw unavailable();
      return body.results.map(map);
    },
  };
}
