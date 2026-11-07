import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HIGHLIGHT_END, HIGHLIGHT_START, type SearchResult } from "@/lib/retrieval/search";

// Turn the snippet's highlight markers into <mark> elements. Text is rendered by React,
// never as HTML, so document content can't inject markup.
function Snippet({ text }: { text: string }) {
  const parts = text.split(new RegExp(`(${HIGHLIGHT_START}[^${HIGHLIGHT_END}]*${HIGHLIGHT_END})`));
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      {parts.map((part, i) =>
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

export function SearchResults({ results }: { results: SearchResult[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {results.map((r) => (
        <li key={r.chunkId}>
          <Card className="gap-0 py-0">
            <CardContent className="flex flex-col gap-2 py-4">
              <p className="flex min-w-0 items-center gap-2 text-sm font-medium">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate" title={r.documentName}>
                  {r.documentName}
                </span>
                <span className="shrink-0 text-xs font-normal text-muted-foreground">
                  · section {r.chunkIndex + 1}
                </span>
              </p>
              <Snippet text={r.snippet} />
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
