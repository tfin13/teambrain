import { Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function SearchPage() {
  return (
    <>
      <PageHeader title="Search" description="Find any passage across your documents." />
      {/* Step 6: search box + results */}
      <EmptyState
        icon={Search}
        title="Search is coming"
        description="Once documents are uploaded, search them by keyword here."
      />
    </>
  );
}
