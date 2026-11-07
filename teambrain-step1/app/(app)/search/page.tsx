import { Search, SearchX } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SearchResults } from "@/components/search-results";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { MAX_QUERY_LENGTH, searchChunks } from "@/lib/retrieval/search";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const user = await requireUser();
  const { q: rawQ } = await searchParams;
  const q = (Array.isArray(rawQ) ? rawQ[0] : rawQ)?.trim() ?? "";
  const results = q ? await searchChunks(user.id, q) : [];

  return (
    <>
      <PageHeader title="Search" description="Find any passage across your documents." />

      {/* Plain GET form: the query lives in the URL, so results are shareable and need no client JS. */}
      <form action="/search" role="search" className="mb-6 flex gap-2">
        <Input
          name="q"
          type="search"
          defaultValue={q}
          maxLength={MAX_QUERY_LENGTH}
          placeholder={'e.g. vacation policy, "expense report", refund -damaged'}
          aria-label="Search documents"
          autoFocus
          className="flex-1"
        />
        <Button type="submit">
          <Search /> Search
        </Button>
      </form>

      {!q ? (
        <EmptyState
          icon={Search}
          title="Search your documents"
          description="Type keywords to find matching passages. Use quotes for exact phrases."
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No matches"
          description={`Nothing in your documents matches “${q}”. Try fewer or different words.`}
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            {results.length === 20 ? "Top 20" : results.length} {results.length === 1 ? "match" : "matches"} for “{q}”
          </p>
          <SearchResults results={results} />
        </>
      )}
    </>
  );
}
