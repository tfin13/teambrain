import { FileText } from "lucide-react";
import { DocumentList } from "@/components/document-list";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { UploadForm } from "@/components/upload-form";
import { requireUser } from "@/lib/auth";
import { listDocuments } from "@/lib/documents";

export default async function DocumentsPage() {
  const user = await requireUser();
  const documents = await listDocuments(user.id);

  return (
    <>
      <PageHeader
        title="Documents"
        description="Upload your company's handbooks, policies and SOPs."
      />
      <UploadForm />
      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload a PDF, TXT or Markdown file to start asking questions about it."
        />
      ) : (
        <DocumentList documents={documents} />
      )}
    </>
  );
}
