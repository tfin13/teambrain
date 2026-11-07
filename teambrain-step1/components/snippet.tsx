import { cn } from "@/lib/utils";
import { HIGHLIGHT_END, HIGHLIGHT_START } from "@/lib/retrieval/highlight";

const PARTS = new RegExp(`(${HIGHLIGHT_START}[^${HIGHLIGHT_END}]*${HIGHLIGHT_END})`);

// Turn ts_headline's highlight markers into <mark> elements. Text is rendered by React,
// never as HTML, so document content can't inject markup. Safe in server and client components.
export function Snippet({ text, className }: { text: string; className?: string }) {
  return (
    <p className={cn("text-sm leading-relaxed text-muted-foreground", className)}>
      {text.split(PARTS).map((part, i) =>
        part.startsWith(HIGHLIGHT_START) ? (
          <mark key={i} className="rounded-sm bg-primary/15 px-0.5 font-medium text-foreground">
            {part.slice(1, -1)}
          </mark>
        ) : (
          part
        ),
      )}
    </p>
  );
}
