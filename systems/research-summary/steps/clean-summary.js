// Step: clean_summary. Checks each [n] marker against the source registry,
// removes markers and sentences that are not correct, and keeps the summary
// at 250 words or fewer.

import { SOURCES } from "./source-registry.js";

export const MAX_WORDS = 250;

const countWords = text => text.split(/\s+/).filter(Boolean).length;
const markers = text => [...text.matchAll(/\[(\d+)\]/g)].map(m => Number(m[1]));

export function cleanSummary(text, registry) {
  const warnings = [];
  const sentences = String(text ?? "").trim().split(/(?<=[.!?])\s+/).filter(Boolean);

  const kept = [];
  sentences.forEach((sentence, index) => {
    const i = index + 1;
    let valid = 0;
    // Remove each marker that is not in the registry, with one space in front of it.
    const cleaned = sentence.replace(/ ?\[(\d+)\]/g, (match, digits) => {
      const n = Number(digits);
      if (registry.has(n)) {
        valid++;
        return match;
      }
      warnings.push(`citation_removed:${n}`);
      return "";
    });
    if (valid === 0) {
      warnings.push(`sentence_removed:${i}`);
      return;
    }
    kept.push(cleaned);
  });

  let truncated = false;
  while (kept.length && countWords(kept.join(" ")) > MAX_WORDS) {
    kept.pop();
    truncated = true;
  }
  if (truncated) warnings.push("summary_truncated");

  const summary = kept.join(" ");
  const cited = new Set(markers(summary).map(n => registry.get(n)?.source));
  return { summary, warnings, cited_sources: SOURCES.filter(s => cited.has(s)) };
}
