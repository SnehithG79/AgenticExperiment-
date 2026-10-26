// Tool: count_words. Counts the words in a text.

export const countWords = {
  name: "count_words",
  description: "Count the words in a text. Words are separated by white space.",
  inputSchema: {
    type: "object",
    properties: { text: { type: "string", maxLength: 10000 } },
    required: ["text"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { words: { type: "integer", minimum: 0 } },
    required: ["words"],
  },
  async run({ text }) {
    const trimmed = text.trim();
    return { words: trimmed ? trimmed.split(/\s+/).length : 0 };
  },
};
