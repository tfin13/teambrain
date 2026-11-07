import { extractText } from "unpdf";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB, per the MVP scope

// Extension → stored mime type. Browsers report .md inconsistently ("", text/x-markdown,
// application/octet-stream), so the extension decides the type, and content checks back it up.
const SUPPORTED = {
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  markdown: "text/markdown",
} as const;

export type SupportedMimeType = (typeof SUPPORTED)[keyof typeof SUPPORTED];

export class IngestError extends Error {}

export function detectMimeType(fileName: string): SupportedMimeType | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return ext in SUPPORTED ? SUPPORTED[ext as keyof typeof SUPPORTED] : null;
}

/** Plain text of an uploaded file. Throws IngestError with a user-facing message. */
export async function extractFileText(bytes: Uint8Array, mimeType: SupportedMimeType): Promise<string> {
  const text = mimeType === "application/pdf" ? await extractPdf(bytes) : decodeText(bytes);
  // Postgres text columns reject NUL bytes.
  const clean = text.replace(/\u0000/g, "").trim();
  if (!clean) {
    throw new IngestError(
      mimeType === "application/pdf"
        ? "No text found in this PDF. Scanned or image-only PDFs aren't supported."
        : "This file is empty.",
    );
  }
  return clean;
}

async function extractPdf(bytes: Uint8Array): Promise<string> {
  if (!startsWith(bytes, "%PDF-")) throw new IngestError("This file isn't a valid PDF.");
  try {
    const { text } = await extractText(bytes, { mergePages: true });
    return text;
  } catch {
    throw new IngestError("Couldn't read this PDF. It may be encrypted or corrupted.");
  }
}

function decodeText(bytes: Uint8Array): string {
  // Non-fatal UTF-8 decoding; a NUL byte almost always means a binary file renamed to .txt/.md.
  if (bytes.includes(0)) throw new IngestError("This doesn't look like a text file.");
  return new TextDecoder("utf-8").decode(bytes); // strips a leading BOM
}

function startsWith(bytes: Uint8Array, prefix: string) {
  return prefix.split("").every((ch, i) => bytes[i] === ch.charCodeAt(0));
}
