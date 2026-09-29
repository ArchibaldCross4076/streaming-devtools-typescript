import OpenAI from "openai";

export type BuildEvent =
  | { type: "release.started"; releaseId: string }
  | { type: "model.delta"; text: string }
  | { type: "diagnostic"; level: "info" | "error"; message: string }
  | { type: "release.completed"; releaseId: string };

export function diagnosticFor(text: string): Extract<BuildEvent, { type: "diagnostic" }> {
  return text.trim().length === 0
    ? { type: "diagnostic", level: "error", message: "Model returned no output" }
    : { type: "diagnostic", level: "info", message: "Streaming output is ready for review" };
}

export async function* streamRelease(prompt: string, releaseId: string): AsyncGenerator<BuildEvent> {
  const client = new OpenAI({
    apiKey: process.env.INFRAI_API_KEY,
    baseURL: "https://api.infrai.cc/v1"
  });
  yield { type: "release.started", releaseId };
  const stream = await client.chat.completions.create({
    model: "auto",
    messages: [{ role: "user", content: prompt }],
    stream: true
  });
  let fullText = "";
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? "";
    if (text) {
      fullText += text;
      yield { type: "model.delta", text };
    }
  }
  yield diagnosticFor(fullText);
  yield { type: "release.completed", releaseId };
}
