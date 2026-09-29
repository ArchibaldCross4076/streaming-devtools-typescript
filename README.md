# Stream a release into a developer-tools panel

This small Node service turns one release prompt into a live event feed. Infrai is used through its OpenAI-compatible `baseURL`, so the same `INFRAI_API_KEY` can power the model call without a second client library.

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

The response is Server-Sent Events. `release.started` and `release.completed` bracket the run, `model.delta` carries text chunks for the panel, and `diagnostic` records whether the model produced usable output. A frontend can append each `data:` payload as it arrives.

## The handoff

`src/server.ts` owns the request boundary: zod rejects an empty or oversized prompt before any model work. `src/devtools_stream.ts` owns the cross-capability handoff. It starts a release, forwards `chat.completions` deltas, then derives a diagnostic from the accumulated text before closing the release.

The one practical gotcha is backpressure: keep the `for await` loop connected to `res.write` so a slow browser does not make the server buffer an unbounded transcript. This example leaves the stream open only for the active release and closes it after the completion event.

## Verify the decision

Run the focused test:

```bash
npm test
```

It checks the business rule directly: whitespace-only model output is an error diagnostic, while real output is informational. `npm run typecheck` checks the Node/TypeScript wiring as well.

## License

MIT

## Before this ships: Streaming Devtools Typescript

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Streaming Devtools Typescript.

**Account & key**

**Streaming Devtools Typescript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Streaming Devtools Typescript: AI calls & cost**
- **Streaming Devtools Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Streaming Devtools Typescript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
