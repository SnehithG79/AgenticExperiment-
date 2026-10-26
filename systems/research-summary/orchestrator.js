// Runs the agent graph for one request:
// validate_input -> researcher (search_web, search_encyclopedia, search_papers)
// -> check_results -> clean_summary -> output.
// Each request creates new adapters, a new source registry, new tools and a
// new agent. Nothing is kept after the request.

import { readFileSync } from "node:fs";
import { runAgent, AgentError } from "./lib/agent-loop.js";
import { createModel } from "./lib/llm.js";
import { createResearcher } from "./agents/researcher.js";
import { createSearchWeb } from "./tools/search-web.js";
import { createSearchEncyclopedia } from "./tools/search-encyclopedia.js";
import { createSearchPapers } from "./tools/search-papers.js";
import { createSourceRegistry, SOURCES } from "./steps/source-registry.js";
import { cleanSummary } from "./steps/clean-summary.js";
import { createFakeSearch } from "./adapters/fake-search.js";
import { createHttpSearch } from "./adapters/http-search.js";

export const MAX_INPUT = 500;

const fixture = name => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
const FIXTURES = {
  web: fixture("web_results.json"),
  encyclopedia: fixture("encyclopedia_results.json"),
  papers: fixture("paper_results.json"),
};

// Node validate_input.
export function validateInput(input) {
  if (typeof input !== "string") return { error: "invalid_input" };
  if (!input.trim()) return { error: "empty_input" };
  if (input.length > MAX_INPUT) return { error: "invalid_input" };
  return { question: input.trim() };
}

// Node check_results: true when the registry has 1 or more items.
export function checkResults(registry) {
  return registry.items().length > 0;
}

// Adapters for one request. Default: 3 new fakes from the fixtures.
export function createApis() {
  if ((process.env.SEARCH_ADAPTER || "fake") === "http") {
    return {
      web: createHttpSearch({ url: process.env.WEB_SEARCH_URL, key: process.env.WEB_SEARCH_KEY, map: i => ({ title: i?.title, url: i?.url, snippet: i?.snippet }) }),
      encyclopedia: createHttpSearch({ url: process.env.ENCYCLOPEDIA_URL, map: i => ({ title: i?.title, url: i?.url, extract: i?.extract }) }),
      papers: createHttpSearch({ url: process.env.PAPERS_URL, key: process.env.PAPERS_KEY, map: i => ({ title: i?.title, url: i?.url, authors: i?.authors, year: i?.year, abstract: i?.abstract }) }),
    };
  }
  return {
    web: createFakeSearch(FIXTURES.web),
    encyclopedia: createFakeSearch(FIXTURES.encyclopedia),
    papers: createFakeSearch(FIXTURES.papers),
  };
}

export async function run(input, { apis, modelFor = createModel } = {}) {
  const valid = validateInput(input);
  if (valid.error) return { error: valid.error };
  const { question } = valid;

  try {
    const adapters = apis ?? createApis();
    const registry = createSourceRegistry();
    const ctx = { question, registry };
    const tools = [
      createSearchWeb({ ...ctx, api: adapters.web }),
      createSearchEncyclopedia({ ...ctx, api: adapters.encyclopedia }),
      createSearchPapers({ ...ctx, api: adapters.papers }),
    ];
    const agent = createResearcher(tools);

    const base = modelFor(agent);
    let model_calls = 0;
    const model = {
      mode: base.mode,
      call(request) {
        model_calls++;
        return base.call(request);
      },
    };

    let result;
    let agentError;
    try {
      result = await runAgent(agent, question, { model });
    } catch (err) {
      if (!(err instanceof AgentError)) throw err;
      agentError = err;
    }

    if (!checkResults(registry)) return { error: "no_results" };
    if (agentError) return { error: agentError.code };

    const cleaned = cleanSummary(result.summary, registry);
    if (!cleaned.summary) return { error: "summary_invalid" };

    const search_calls = {};
    for (const source of SOURCES) search_calls[source] = [...(adapters[source]?.calls ?? [])];

    return {
      output: {
        summary: cleaned.summary,
        sources: registry.items(),
        warnings: [...registry.sourceWarnings(), ...cleaned.warnings],
        cited_sources: cleaned.cited_sources,
        search_calls,
        model_calls,
      },
    };
  } catch {
    return { error: "internal_error" };
  }
}
