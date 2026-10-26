// Tool: search_encyclopedia. Searches the encyclopedia API for the user question.

import { createSearchTool } from "./search-tool.js";

export const mapEncyclopedia = item => ({ title: item?.title, url: item?.url, snippet: item?.extract });

export function createSearchEncyclopedia({ api, question, registry }) {
  return createSearchTool({
    name: "search_encyclopedia",
    source: "encyclopedia",
    description: "Search the encyclopedia for the user question. Returns a maximum of 3 numbered articles with title, URL and snippet.",
    api, question, registry,
    map: mapEncyclopedia,
  });
}
