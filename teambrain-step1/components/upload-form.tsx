"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CircleAlert, CircleCheck, Loader2, Upload } from "lucide-react";
import { uploadDocument } from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown";

export function UploadForm() {
  const [state, formAction, pending] = useActionState(uploadDocument, undefined);
  const [clientError, setClientError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the file input after a successful upload so the next one starts fresh.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  // Catch oversized files before sending 5 MB+ to the server. The server re-checks everything.
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setClientError(file && file.size > MAX_BYTES ? "Files must be 5 MB or smaller." : null);
  }

  const error = clientError ?? (state && !state.ok ? state.error : null);

  return (
    <Card className="mb-6">
      <CardContent>
        <form ref={formRef} action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            name="file"
            type="file"
            accept={ACCEPT}
            required
            disabled={pending}
            onChange={onFileChange}
            aria-label="Document file"
            className="sm:flex-1"
          />
          <Button type="submit" disabled={pending || !!clientError}>
            {pending ? <Loader2 className="animate-spin" /> : <Upload />}
            {pending ? "Uploading…" : "Upload"}
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">PDF, TXT or Markdown, up to 5 MB.</p>
        {error && (
          <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-destructive">
            <CircleAlert className="size-4 shrink-0" /> {error}
          </p>
        )}
        {!error && state?.ok && (
          <p role="status" className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <CircleCheck className="size-4 shrink-0" /> {state.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
