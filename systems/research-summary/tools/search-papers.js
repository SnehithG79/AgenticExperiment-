// Tool: search_papers. Searches the academic papers API for the user question.

import { createSearchTool } from "./search-tool.js";

export const mapPapers = item => ({ title: item?.title, url: item?.url, snippet: item?.abstract, authors: item?.authors, year: item?.year });

export function createSearchPapers({ api, question, registry }) {
  return createSearchTool({
    name: "search_papers",
    source: "papers",
    description: "Search the academic papers index for the user question. Returns a maximum of 3 numbered papers with title, URL, authors, year and snippet.",
    api, question, registry,
    map: mapPapers,
  });
}
