import Anthropic from "@anthropic-ai/sdk";
import { searchChunks, type SearchResult } from "@/lib/retrieval/search";
import { buildUserTurn, NOT_FOUND_ANSWER, SYSTEM_PROMPT } from "./prompt";

const MODEL = "claude-opus-5-5";
const MAX_SOURCES = 6; // ~6 × 1,500 chars of context per question

// Created on first use (reads ANTHROPIC_API_KEY), so builds and pages without chat don't need the key.
let client: Anthropic | undefined;
const getClient = () => (client ??= new Anthropic());

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type ChatSource = {
  n: number; // the [n] Claude cites
  documentId: string;
  documentName: string;
  chunkIndex: number;
  snippet: string;
};

/** One line of the NDJSON stream sent to the browser. */
export type ChatEvent =
  | { type: "sources"; sources: ChatSource[] }
  | { type: "text"; text: string }
  | { type: "error"; message: string }
  | { type: "done" };

/**
 * Retrieve the user's most relevant chunks for the latest question, then stream
 * Claude's grounded answer. `history` ends with the user's question.
 * userId must come from the session; retrieval is scoped to it.
 */
export async function* answerQuestion(userId: string, history: ChatTurn[]): AsyncGenerator<ChatEvent> {
  const question = history[history.length - 1].content;

  // Include the previous question too, so short follow-ups ("what about part-time staff?") still retrieve.
  const previousQuestion = history.findLast((t, i) => t.role === "user" && i < history.length - 1)?.content ?? "";
  const retrieved = await searchChunks(userId, `${question} ${previousQuestion}`, { match: "any", limit: MAX_SOURCES });

  yield { type: "sources", sources: retrieved.map(toSource) };

  // Nothing in the user's documents matches: say so without spending a model call.
  if (retrieved.length === 0) {
    yield { type: "text", text: NOT_FOUND_ANSWER };
    yield { type: "done" };
    return;
  }

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...history.slice(0, -1).map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: buildUserTurn(question, retrieved) },
  ];

  const stream = getClient().beta.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages,
    output_config: { effort: "medium" },
    // If a safety classifier declines, the API retries on Anthropic's recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield { type: "text", text: event.delta.text };
    }
  }

  const final = await stream.finalMessage();
  if (final.stop_reason === "refusal") {
    yield { type: "error", message: "Claude declined to answer this question. Try rephrasing it." };
  } else if (final.stop_reason === "max_tokens") {
    yield { type: "error", message: "The answer was cut off because it was too long." };
  }
  yield { type: "done" };
}

function toSource(r: SearchResult, i: number): ChatSource {
  return { n: i + 1, documentId: r.documentId, documentName: r.documentName, chunkIndex: r.chunkIndex, snippet: r.snippet };
}

/** User-facing message for a failed Claude call. Details go to the server log. */
export function describeChatError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) return "The AI service isn't configured. Check ANTHROPIC_API_KEY.";
  if (error instanceof Anthropic.RateLimitError) return "The AI service is busy. Please try again in a moment.";
  if (error instanceof Anthropic.APIConnectionError) return "Couldn't reach the AI service. Check your connection.";
  // Thrown before any request, e.g. no credentials configured.
  if (error instanceof Anthropic.AnthropicError && !(error instanceof Anthropic.APIError)) {
    return "The AI service isn't configured. Set ANTHROPIC_API_KEY in .env.local and restart the server.";
  }
  return "Something went wrong while answering. Please try again.";
}
