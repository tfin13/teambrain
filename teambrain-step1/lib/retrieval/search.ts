import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { chunks, documents } from "@/lib/db/schema";

// ts_headline wraps matches in these. Control characters can't collide with real
// document text the way HTML tags could, and the UI turns them into <mark> safely.
export const HIGHLIGHT_START = "\u0001";
export const HIGHLIGHT_END = "\u0002";

export const MAX_QUERY_LENGTH = 200;

export type SearchResult = {
  chunkId: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string; // full chunk text, for chat context later
  snippet: string; // excerpt with HIGHLIGHT_START/END around matched terms
  rank: number;
};

/**
 * Keyword search over one user's chunks with Postgres full-text search.
 * websearch_to_tsquery accepts what people type: plain words, "quoted phrases", -exclusions, OR.
 * userId must come from the session.
 */
export async function searchChunks(userId: string, rawQuery: string, limit = 20): Promise<SearchResult[]> {
  const q = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);
  if (!q) return [];

  const query = sql`websearch_to_tsquery('english', ${q})`;
  const rank = sql<number>`ts_rank(${chunks.tsv}, ${query})`;
  const headlineOptions = `StartSel=${HIGHLIGHT_START}, StopSel=${HIGHLIGHT_END}, MaxWords=40, MinWords=20, MaxFragments=2, FragmentDelimiter=" … "`;

  return db
    .select({
      chunkId: chunks.id,
      documentId: chunks.documentId,
      documentName: documents.name,
      chunkIndex: chunks.chunkIndex,
      content: chunks.content,
      snippet: sql<string>`ts_headline('english', ${chunks.content}, ${query}, ${headlineOptions})`,
      rank,
    })
    .from(chunks)
    .innerJoin(documents, eq(documents.id, chunks.documentId))
    // Filter both tables by the session user; the GIN index serves the @@ match.
    .where(and(eq(chunks.userId, userId), eq(documents.userId, userId), sql`${chunks.tsv} @@ ${query}`))
    .orderBy(desc(rank), chunks.chunkIndex)
    .limit(limit);
}
