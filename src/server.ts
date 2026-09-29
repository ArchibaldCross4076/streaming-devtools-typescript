import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { streamRelease } from "./devtools_stream.js";

const requestSchema = z.object({ prompt: z.string().min(1).max(4000) });

function sendJson(res: import("node:http").ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/api/releases") {
    sendJson(res, 404, { error: "Route not found" });
    return;
  }
  let raw = "";
  for await (const part of req) raw += part;
  let body: unknown;
  try {
    body = JSON.parse(raw || "{}");
  } catch {
    sendJson(res, 400, { error: "Invalid JSON request body" });
    return;
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    sendJson(res, 400, { error: parsed.error.flatten() });
    return;
  }
  res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" });
  try {
    for await (const event of streamRelease(parsed.data.prompt, randomUUID())) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    res.end();
  } catch (error) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: error instanceof Error ? error.message : "Release failed" })}\n\n`);
    res.end();
  }
});

server.listen(Number(process.env.PORT ?? 3000), () => {
  console.log("release stream listening on http://localhost:" + (process.env.PORT ?? 3000));
});
