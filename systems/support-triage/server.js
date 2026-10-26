// HTTP entry point. POST /run {"input": ...} -> {"output": ...} or {"error": "<code>"}.
// GET /health -> 200 when ready. Listens on 127.0.0.1, port 3000 to 3999 only.
// Optional schedule: a run every TRIAGE_INTERVAL_MINUTES minutes when the value is more than 0.

import http from "node:http";
import { pathToFileURL } from "node:url";
import { run, createScheduledRunner } from "./orchestrator.js";
import { modelMode } from "./lib/llm.js";

const MAX_BODY = 64 * 1024;

export function createServer() {
  return http.createServer(async (req, res) => {
    const send = (status, body) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (req.method === "GET" && req.url === "/health") return send(200, { status: "ok", mode: modelMode() });
    if (req.method !== "POST" || req.url !== "/run") return send(404, { error: "not_found" });

    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_BODY) return send(413, { error: "payload_too_large" });
      chunks.push(chunk);
    }
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return send(400, { error: "bad_json" });
    }
    const result = await run(body?.input);
    send(result.error ? (result.error === "internal_error" ? 500 : 400) : 200, result);
  });
}

export function checkPort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 3000 || port > 3999) throw new Error(`PORT must be 3000 to 3999, got ${value}`);
  return port;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = checkPort(process.env.PORT || 3142);
  createServer().listen(port, "127.0.0.1", () => {
    console.log(`listening on http://localhost:${port} (model mode: ${modelMode()})`);
  });
  startSchedule(process.env.TRIAGE_INTERVAL_MINUTES);
}

// Starts the scheduled run. Returns the timer, or null when the schedule is off.
export function startSchedule(value) {
  const minutes = Number(value || 0);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  const scheduledRun = createScheduledRunner();
  return setInterval(scheduledRun, minutes * 60_000);
}
