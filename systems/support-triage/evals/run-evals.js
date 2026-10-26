// Sends each case in cases.json to the system and compares the result.
// Usage: node evals/run-evals.js            (in process)
//        node evals/run-evals.js --url http://localhost:3142   (running server)

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { run } from "../orchestrator.js";

export async function loadCases() {
  return JSON.parse(await readFile(new URL("./cases.json", import.meta.url), "utf8"));
}

// Every key in `expected` must equal the same key in the output.
// An expected `error` must equal the returned error code.
export function matches(expected, result) {
  if ("error" in expected) return result.error === expected.error;
  if (result.error) return false;
  return Object.entries(expected).every(([k, v]) => JSON.stringify(result.output?.[k]) === JSON.stringify(v));
}

export async function runEvals({ url } = {}) {
  const rows = [];
  for (const c of await loadCases()) {
    const result = url
      ? await (await fetch(`${url}/run`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ input: c.input }) })).json()
      : await run(c.input);
    rows.push({ id: c.id, expected: c.expected, actual: result.error ? { error: result.error } : result.output, pass: matches(c.expected, result) });
  }
  return rows;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf("--url");
  const rows = await runEvals({ url: i > 0 ? process.argv[i + 1] : undefined });
  for (const r of rows) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.id}  expected ${JSON.stringify(r.expected)}  actual ${JSON.stringify(r.actual)}`);
  const failed = rows.filter(r => !r.pass).length;
  console.log(failed ? `${failed} of ${rows.length} cases failed` : `all ${rows.length} cases passed`);
  process.exit(failed ? 1 : 0);
}
