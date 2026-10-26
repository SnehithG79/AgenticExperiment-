import { test } from "node:test";
import assert from "node:assert/strict";
import { countWords } from "../tools/count-words.js";
import { validate } from "../lib/schema.js";

test("count_words counts words separated by white space", async () => {
  assert.deepEqual(await countWords.run({ text: "a b\tc\nd" }), { words: 4 });
});

test("count_words returns 0 for white space only", async () => {
  assert.deepEqual(await countWords.run({ text: "   " }), { words: 0 });
});

test("count_words schema refuses a missing or long text", () => {
  assert.ok(validate(countWords.inputSchema, {}).length > 0);
  assert.ok(validate(countWords.inputSchema, { text: "x".repeat(10001) }).length > 0);
  assert.ok(validate(countWords.inputSchema, { text: "ok", extra: 1 }).length > 0);
});
