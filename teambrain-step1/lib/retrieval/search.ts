import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { chunks, documents } from "@/lib/db/schema";
import { HIGHLIGHT_END, HIGHLIGHT_START } from "./highlight";

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

export type SearchOptions = {
  limit?: number;
  /**
   * "all" (Search page): every word must appear; supports "phrases", -exclusions, OR.
   * "any" (chat retrieval): a chunk matching any word qualifies, and ts_rank puts chunks
   * matching more words first. A natural-language question rarely has all its words in one chunk.
   */
  match?: "all" | "any";
};

/**
 * Keyword search over one user's chunks with Postgres full-text search.
 * userId must come from the session.
 */
export async function searchChunks(
  userId: string,
  rawQuery: string,
  { limit = 20, match = "all" }: SearchOptions = {},
): Promise<SearchResult[]> {
  const q = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);
  if (!q) return [];

  // plainto_tsquery stems and drops stop words, producing 'a' & 'b'; swapping & for | makes it match-any.
  const query =
    match === "all"
      ? sql`websearch_to_tsquery('english', ${q})`
      : sql`replace(plainto_tsquery('english', ${q})::text, '&', '|')::tsquery`;
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
