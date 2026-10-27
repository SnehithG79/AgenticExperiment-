// Configuration checks: T1 (lib/ equals the template), T6 with T7 and T10 (.env.example),
// T11 (README table agrees with .env.example).

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const TEMPLATE_LIB = new URL("../../../okati/templates/agent-system/lib/", import.meta.url);
const EXPECTED_KEYS = [
  "PORT", "AGENT_MODE", "AGENT_PROVIDER", "OPENAI_API_KEY", "OPENAI_MODEL",
  "TICKET_ADAPTER", "TICKET_API_URL", "TICKET_API_TOKEN", "TRIAGE_CONFIG", "TRIAGE_INTERVAL_MINUTES", "TRIAGE_CLOCK", "TRIAGE_LOG",
];

const envText = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
const envLines = envText.split(/\r?\n/);
const envEntries = envLines.map(l => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean).map(m => [m[1], m[2]]);

test("T1: lib/ files are byte copies of the template lib/", { skip: existsSync(TEMPLATE_LIB) ? false : "template folder not found" }, () => {
  for (const file of ["llm.js", "agent-loop.js", "schema.js"]) {
    const own = readFileSync(new URL(`../lib/${file}`, import.meta.url));
    const template = readFileSync(new URL(file, TEMPLATE_LIB));
    assert.ok(own.equals(template), `${file} differs from the template`);
  }
});

test("T6, T7, T10: .env.example has the OpenAI model keys and no Anthropic variables", () => {
  assert.deepEqual(envEntries.map(([k]) => k), EXPECTED_KEYS);
  const values = Object.fromEntries(envEntries);
  assert.equal(values.AGENT_PROVIDER, "openai");
  assert.equal(values.OPENAI_API_KEY, "");
  assert.equal(values.OPENAI_MODEL, "");
  for (const line of envLines) {
    assert.doesNotMatch(line, /\bANTHROPIC_API_KEY\b/);
    assert.doesNotMatch(line, /\bAGENT_MODEL\b/);
  }
});

test("T11: README environment variable table agrees with .env.example", () => {
  const lines = readFileSync(new URL("../README.md", import.meta.url), "utf8").split(/\r?\n/);
  const start = lines.indexOf("## Environment variables");
  assert.ok(start >= 0, "README has ## Environment variables");
  const table = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("|")) table.push(line);
    else if (table.length) break;
  }
  const names = table.slice(2).map(row => row.split("|")[1].trim().replaceAll("`", ""));
  assert.deepEqual(new Set(names), new Set(envEntries.map(([k]) => k)));
  assert.equal(names.length, EXPECTED_KEYS.length);
  assert.ok(!names.includes("ANTHROPIC_API_KEY"));
  assert.ok(!names.includes("AGENT_MODEL"));
});
