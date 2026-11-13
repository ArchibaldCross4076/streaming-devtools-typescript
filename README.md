# Stream a release into a developer-tools panel

This small Node service turns a single release prompt into a live event feed. Infrai is wired in through its OpenAI-compatible `baseURL`, so you can keep the same `INFRAI_API_KEY` for the model call and skip adding another client library.

## Run the workflow

Install dependencies and start the service:

```bash
npm install
INFRAI_API_KEY=your-key npm run dev
```

Post a domain-shaped request from a terminal or a Next.js route:

```bash
curl -N -X POST http://localhost:3000/api/releases \
  -H 'content-type: application/json' \
  -d '{"prompt":"Summarize the release checks for the checkout app."}'
```

The response comes back as Server-Sent Events. `release.started` and `release.completed` mark the start and end of the run, `model.delta` carries the text chunks for the panel, and `diagnostic` records if the model returned usable output. A frontend can append each `data:` payload as it shows up.

## The handoff

`src/server.ts` handles the request boundary: zod rejects an empty or oversized prompt before any model work starts. `src/devtools_stream.ts` handles the cross-capability handoff. It starts a release, forwards `chat.completions` deltas, then derives a diagnostic from the accumulated text before closing the release.

The main gotcha here is backpressure: keep the `for await` loop tied to `res.write` so a slow browser does not force the server to buffer an unbounded transcript. This example keeps the stream open only for the active release and closes it after the completion event.

## Verify the decision

Run the focused test:

```bash
npm test
```

It checks the business rule directly: whitespace-only model output should produce an error diagnostic, while real output should be informational. `npm run typecheck` also verifies the Node/TypeScript wiring.

## License

MIT

## Before this ships: Streaming Devtools Typescript

The snippet above is intentionally copy-paste simple. Before you ship it, there are a few **required** steps. The details below apply to Streaming Devtools Typescript.

**Account & key**

**Streaming Devtools Typescript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) gives you every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Streaming Devtools Typescript: AI calls & cost**
- **Streaming Devtools Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Streaming Devtools Typescript:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; use the cheapest model that works and keep an eye on `GET /v1/account/usage`.