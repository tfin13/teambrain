"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { ingestDocument } from "@/lib/documents";
import { IngestError } from "@/lib/ingest/extract";

export type UploadState = { ok: true; message: string } | { ok: false; error: string } | undefined;

export async function uploadDocument(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Choose a file to upload." };

  try {
    const { chunkCount } = await ingestDocument(user.id, file);
    revalidatePath("/documents");
    return { ok: true, message: `Uploaded “${file.name}” (${chunkCount} ${chunkCount === 1 ? "section" : "sections"}).` };
  } catch (error) {
    if (error instanceof IngestError) return { ok: false, error: error.message };
    console.error("Upload failed", error);
    return { ok: false, error: "Upload failed. Please try again." };
  }
}
