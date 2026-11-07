"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { CircleAlert, FileText, Loader2, MessageSquare, RotateCcw, SendHorizontal } from "lucide-react";
import { Snippet } from "@/components/snippet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ChatEvent, ChatSource, ChatTurn } from "@/lib/ai/answer";

type Message =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; sources: ChatSource[]; error?: string };

const CITATION = /\[(\d+)\]/g;

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || pending) return;

    const next: Message[] = [...messages, { role: "user", content: question }];
    setMessages([...next, { role: "assistant", content: "", sources: [] }]);
    setInput("");
    setPending(true);

    // Update the in-progress assistant message (always the last one).
    const patch = (fn: (m: Extract<Message, { role: "assistant" }>) => Partial<Message>) =>
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role !== "assistant") return prev;
        return [...prev.slice(0, -1), { ...last, ...fn(last) } as Message];
      });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: toHistory(next) }),
      });
      if (!res.ok || !res.body || !res.headers.get("content-type")?.includes("ndjson")) {
        throw new Error(res.status === 401 ? "Your session expired. Sign in again." : "Chat request failed.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line) continue;
          const event = JSON.parse(line) as ChatEvent;
          if (event.type === "sources") patch(() => ({ sources: event.sources }));
          else if (event.type === "text") patch((m) => ({ content: m.content + event.text }));
          else if (event.type === "error") patch(() => ({ error: event.message }));
        }
      }
    } catch (error) {
      patch(() => ({ error: error instanceof Error ? error.message : "Chat request failed." }));
    } finally {
      setPending(false);
    }
  }

  const last = messages[messages.length - 1];
  const waitingForFirstToken = pending && last?.role === "assistant" && !last.content;

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Ask about your documents</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Answers come only from documents you&apos;ve uploaded, with numbered citations to the passages used.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ol className="flex flex-col gap-4" aria-live="polite">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <li key={i} className="ml-auto max-w-[85%] rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
                {m.content}
              </li>
            ) : (
              <li key={i} className="max-w-[95%]">
                <AssistantMessage message={m} />
              </li>
            ),
          )}
          {waitingForFirstToken && (
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Reading your documents…
            </li>
          )}
        </ol>
      )}
      <div ref={bottomRef} />

      <form onSubmit={ask} className="sticky bottom-0 flex gap-2 bg-background py-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. How many vacation days do new employees get?"
          maxLength={4000}
          disabled={pending}
          aria-label="Your question"
          autoFocus
          className="flex-1"
        />
        <Button type="submit" disabled={pending || !input.trim()}>
          {pending ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
          Ask
        </Button>
        {messages.length > 0 && (
          <Button type="button" variant="outline" disabled={pending} onClick={() => setMessages([])} aria-label="New chat">
            <RotateCcw />
          </Button>
        )}
      </form>
    </div>
  );
}

function AssistantMessage({ message }: { message: Extract<Message, { role: "assistant" }> }) {
  // List only the sources the answer actually cites, in citation order.
  const cited = [...new Set([...message.content.matchAll(CITATION)].map((m) => Number(m[1])))]
    .map((n) => message.sources.find((s) => s.n === n))
    .filter((s): s is ChatSource => !!s);

  return (
    <div className="flex flex-col gap-3">
      {message.content && (
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          <WithCitations text={message.content} />
        </div>
      )}
      {message.error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
          <CircleAlert className="size-4 shrink-0" /> {message.error}
        </p>
      )}
      {cited.length > 0 && (
        <ul className="flex flex-col gap-2">
          {cited.map((s) => (
            <li key={s.n} className="rounded-md border bg-muted/30 px-3 py-2">
              <p className="mb-1 flex min-w-0 items-center gap-2 text-xs font-medium">
                <CitationBadge n={s.n} />
                <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate" title={s.documentName}>
                  {s.documentName}
                </span>
                <span className="shrink-0 font-normal text-muted-foreground">· section {s.chunkIndex + 1}</span>
              </p>
              <Snippet text={s.snippet} className="text-xs" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Render "[2]" in the answer as a small badge.
function WithCitations({ text }: { text: string }) {
  return text.split(/(\[\d+\])/).map((part, i) => {
    const match = /^\[(\d+)\]$/.exec(part);
    return match ? <CitationBadge key={i} n={Number(match[1])} /> : <Fragment key={i}>{part}</Fragment>;
  });
}

function CitationBadge({ n }: { n: number }) {
  return (
    <span className="mx-0.5 inline-flex size-4 items-center justify-center rounded bg-primary/15 align-text-top text-[10px] font-semibold text-foreground">
      {n}
    </span>
  );
}

// Send only completed exchanges, so the history always alternates user/assistant
// (an answer that failed before any text is dropped along with its question).
function toHistory(messages: Message[]): ChatTurn[] {
  const turns: ChatTurn[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const reply = messages[i + 1];
    if (m.role !== "user") continue;
    if (i === messages.length - 1) turns.push({ role: "user", content: m.content });
    else if (reply?.role === "assistant" && reply.content) {
      turns.push({ role: "user", content: m.content }, { role: "assistant", content: reply.content });
    }
  }
  return turns;
}
