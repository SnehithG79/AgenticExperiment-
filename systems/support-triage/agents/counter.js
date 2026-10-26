// Agent: counter. Role: report the number of words in the input text.
// Tools: count_words. Guardrail: the agent does not count words itself.

import { countWords } from "../tools/count-words.js";
import { lastToolResults } from "../lib/agent-loop.js";

export const counter = {
  name: "counter",
  model: "claude-sonnet-5-5",
  tools: [countWords],
  system: [
    "You count the words in the text that the user gives you.",
    "Always call the count_words tool with the full text. Do not count the words yourself.",
    'Then reply with JSON only, in the format {"words": <integer>}.',
  ].join("\n"),
  outputSchema: {
    type: "object",
    properties: { words: { type: "integer", minimum: 0 } },
    required: ["words"],
    additionalProperties: false,
  },
  // Deterministic policy for mock mode. It follows the same steps as the prompt.
  mock(messages) {
    const results = lastToolResults(messages);
    if (!results) {
      return [{ type: "tool_use", id: "toolu_mock_1", name: "count_words", input: { text: messages[0].content } }];
    }
    return [{ type: "text", text: JSON.stringify({ words: results[0].words }) }];
  },
};
