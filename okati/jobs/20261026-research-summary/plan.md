blocked: false

# Plan: Research summary agent

## Goal

The system gets a research question, searches three sources and writes a short summary with a citation for each claim.

## Tasks and acceptance criteria

| ID | Task | Acceptance criterion |
|----|------|----------------------|
| T1 | Get the research question from the `POST /run` body. | With input `{"input": "What is CRISPR?"}`, the system sends the same question text to each search tool. |
| T2 | Search the web search source. | For a fixture question, the web search double records exactly 1 call with that question as the query. |
| T3 | Search the encyclopedia source. | For a fixture question, the encyclopedia double records exactly 1 call with that question as the query. |
| T4 | Search the academic papers source. | For a fixture question, the papers double records exactly 1 call with that question as the query. |
| T5 | Keep a maximum of 3 results from each source. | When a double returns 10 results, the output `sources` list has a maximum of 3 items from that source. |
| T6 | Make one source list with no duplicates. | When two doubles return the same URL, the output `sources` list has that URL only 1 time. |
| T7 | Give each source a number, a title, a URL and the name of its source. | Each item in `sources` has a number from 1, a title, a URL and a source name that are not empty. |
| T8 | Write a summary from the search results. | The `summary` text is not empty and has a maximum of 250 words. |
| T9 | Add a citation to each sentence of the summary. | Each summary sentence has 1 or more markers in the form `[n]`. |
| T10 | Use only citations that are in the source list. | Each `[n]` marker in the summary is equal to a number in `sources`. No marker points to a missing number. |
| T11 | Use results from all sources that return results. | When all 3 doubles return results, the summary cites 1 or more items from each of the 3 sources. |
| T12 | Continue when one source fails. | When 1 double returns an error, the output has a summary, cites only the 2 other sources, and `warnings` names the failed source. |
| T13 | Stop when no source gives a result. | When all 3 doubles return 0 results or an error, the system returns `{"error": "no_results"}` and writes no summary. |
| T14 | Do not add facts that are not in the results. | On the fixture set of 5 questions, each cited sentence matches a fact in the fixture snippet of the cited source. A test checks key terms. |
| T15 | Stop in the turn limit. | For each evaluation case, the agent finishes in 5 model turns or fewer and does not return `max_turns`. |
| E1 | Empty input. | With input `""` or a text of only spaces, the system returns `{"error": "empty_input"}` and makes 0 search calls and 0 model calls. |
| E2 | Input that is not valid. | With a missing `input` key, an input that is not text, or a text longer than 500 characters, the system returns `{"error": "invalid_input"}` and makes 0 search calls. |

## External services and data

| Service | Use | Test double |
|---------|-----|-------------|
| Web search API (for example Brave Search, Bing or Exa) | Find general web pages about the question. | In-memory fake search tool. Fixture `web_results.json` maps 5 fixture questions to 4 results each, with title, URL and snippet. One question returns 10 results. One question returns 0 results. The fake records each call and can return an error on request. |
| Encyclopedia API (for example Wikipedia REST API) | Find a reference article about the question. | In-memory fake search tool. Fixture `encyclopedia_results.json` maps the 5 fixture questions to 1 or 2 articles each, with title, URL and extract. One article URL is also in `web_results.json` to test duplicate removal. The fake can return an error on request. |
| Academic papers API (for example arXiv, Semantic Scholar or Crossref) | Find research papers about the question. | In-memory fake search tool. Fixture `paper_results.json` maps the 5 fixture questions to 3 papers each, with title, URL, authors, year and abstract. One question returns 0 papers. The fake can return an error on request. |
| Language model API (Claude) | Select the search tools, then write the summary with `[n]` citation markers. | Deterministic mock policy in mock mode. It calls the 3 search tools in one turn. Then it writes a fixed summary from the fixture snippets. Fixture `model_responses.json` has one summary with a marker that points to a missing source, to test T10. |
| Evaluation cases | Check the full system through `POST /run`. | Fixture `evals/cases.json` with 5 normal questions, 1 empty input, 2 invalid inputs, 1 question with a failed source and 1 question with no results. |

## Open questions

| Question | Assumption |
|----------|------------|
| Which three sources does the system search? | The sources are a web search, an encyclopedia and an academic papers index. Each source has a generic adapter. Tests use the fakes. |
| Does "three sources" mean three search services or three cited documents? | It means three search services. The summary can cite more than three documents. |
| What is the format of the input? | The input is one research question as plain text. The maximum length is 500 characters. |
| What is the format of the output? | The output has `summary` (text), `sources` (numbered list) and `warnings` (list, can be empty). |
| What citation style does the summary use? | The summary uses numbered markers such as `[1]`. The `sources` list gives the title and URL for each number. |
| How long is the summary? | The summary has a maximum of 250 words. |
| Does the system read the full page at each URL? | No. The system uses only the title and snippet from each search result. This keeps the run in 5 model turns. |
| What happens when the sources disagree? | The summary states each view and cites the source for each view. |
| What languages does the system support? | Questions and results are in English. The system does not translate. |
| Does the system keep a history of past questions? | No. Each run is independent. The system stores no questions or results. |
| Is one agent sufficient, or does each source need its own agent? | The planner does not decide this. The design step decides. The 5-turn limit applies to each agent. |
| What happens when the model writes a marker for a missing source? | The system removes the sentence or the marker and adds a warning. It does not return a citation that points to nothing. |
