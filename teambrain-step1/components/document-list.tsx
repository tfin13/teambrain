import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DocumentListItem } from "@/lib/documents";

const TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "text/plain": "TXT",
  "text/markdown": "Markdown",
};

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList({ documents }: { documents: DocumentListItem[] }) {
  return (
    <Card className="gap-0 py-0">
      <ul className="divide-y">
        {documents.map((doc) => (
          <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
              <FileText className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" title={doc.name}>
                {doc.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {TYPE_LABELS[doc.mimeType] ?? doc.mimeType} · {formatSize(doc.sizeBytes)} · {doc.chunkCount}{" "}
                {doc.chunkCount === 1 ? "section" : "sections"}
              </p>
            </div>
            <time className="hidden shrink-0 text-xs text-muted-foreground sm:block" dateTime={doc.createdAt.toISOString()}>
              {dateFormat.format(doc.createdAt)}
            </time>
          </li>
        ))}
      </ul>
    </Card>
  );
}
