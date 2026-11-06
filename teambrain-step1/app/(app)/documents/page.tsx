import { FileText } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        title="Documents"
        description="Upload your company's handbooks, policies and SOPs."
      />
      {/* Step 4: upload dropzone. Step 5: document table. */}
      <EmptyState
        icon={FileText}
        title="No documents yet"
        description="Upload a PDF, TXT or Markdown file to start asking questions about it."
      />
    </>
  );
}
