import { count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { chunks, documents } from "@/lib/db/schema";
import { chunkText } from "@/lib/ingest/chunk";
import { detectMimeType, extractFileText, IngestError, MAX_UPLOAD_BYTES } from "@/lib/ingest/extract";

// Every function takes userId from the session (requireUser), never from request input.

export type DocumentListItem = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  chunkCount: number;
};

export async function listDocuments(userId: string): Promise<DocumentListItem[]> {
  return db
    .select({
      id: documents.id,
      name: documents.name,
      mimeType: documents.mimeType,
      sizeBytes: documents.sizeBytes,
      createdAt: documents.createdAt,
      chunkCount: count(chunks.id),
    })
    .from(documents)
    .leftJoin(chunks, eq(chunks.documentId, documents.id))
    .where(eq(documents.userId, userId))
    .groupBy(documents.id)
    .orderBy(desc(documents.createdAt));
}

/** Validate, extract, chunk and store one upload. Throws IngestError with a user-facing message. */
export async function ingestDocument(userId: string, file: File) {
  const name = file.name.trim().slice(0, 255);
  if (!name || file.size === 0) throw new IngestError("Choose a file to upload.");
  if (file.size > MAX_UPLOAD_BYTES) throw new IngestError("Files must be 5 MB or smaller.");

  const mimeType = detectMimeType(name);
  if (!mimeType) throw new IngestError("Only PDF, TXT and Markdown (.md) files are supported.");

  const text = await extractFileText(new Uint8Array(await file.arrayBuffer()), mimeType);
  const pieces = chunkText(text);

  // One transaction: a document never exists without its chunks.
  return db.transaction(async (tx) => {
    const [doc] = await tx
      .insert(documents)
      .values({ userId, name, mimeType, sizeBytes: file.size })
      .returning({ id: documents.id });

    await tx
      .insert(chunks)
      .values(pieces.map((content, chunkIndex) => ({ documentId: doc.id, userId, chunkIndex, content })));

    return { id: doc.id, chunkCount: pieces.length };
  });
}
