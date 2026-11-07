import { auth } from "@/lib/auth";
import { answerQuestion, describeChatError, type ChatEvent, type ChatTurn } from "@/lib/ai/answer";

const MAX_TURNS = 20;
const MAX_CHARS = 4000;

// POST { messages: [{ role, content }, ...] } → NDJSON stream of ChatEvent lines.
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: "Not signed in." }, { status: 401 });

  const history = parseHistory(await request.json().catch(() => null));
  if (!history) return Response.json({ error: "Invalid chat request." }, { status: 400 });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        for await (const event of answerQuestion(userId, history)) send(event);
      } catch (error) {
        console.error("Chat failed", error);
        send({ type: "error", message: describeChatError(error) });
        send({ type: "done" });
      }
      controller.close();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}

// Accept only alternating user/assistant text turns that start and end with the user.
function parseHistory(body: unknown): ChatTurn[] | null {
  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages) || messages.length === 0) return null;

  const turns = messages.slice(-MAX_TURNS);
  if (turns[0]?.role !== "user") turns.shift(); // trimming may leave an assistant turn first

  const valid = turns.every(
    (t, i) =>
      t &&
      t.role === (i % 2 === 0 ? "user" : "assistant") &&
      typeof t.content === "string" &&
      t.content.trim().length > 0 &&
      t.content.length <= MAX_CHARS,
  );
  if (!valid || turns.length === 0 || turns[turns.length - 1].role !== "user") return null;

  return turns.map((t) => ({ role: t.role, content: t.content.trim() }));
}
