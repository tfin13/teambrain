import { FileText } from "lucide-react";
import { Snippet } from "@/components/snippet";
import { Card, CardContent } from "@/components/ui/card";
import type { SearchResult } from "@/lib/retrieval/search";

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
