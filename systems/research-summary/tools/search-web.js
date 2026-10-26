// Tool: search_web. Searches the web API for the user question.

import { createSearchTool } from "./search-tool.js";

export const mapWeb = item => ({ title: item?.title, url: item?.url, snippet: item?.snippet });

export function createSearchWeb({ api, question, registry }) {
  return createSearchTool({
    name: "search_web",
    source: "web",
    description: "Search the web for the user question. Returns a maximum of 3 numbered results with title, URL and snippet.",
    api, question, registry,
    map: mapWeb,
  });
}
