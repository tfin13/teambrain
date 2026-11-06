import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function ChatPage() {
  return (
    <>
      <PageHeader
        title="Chat"
        description="Ask questions and get answers cited from your documents."
      />
      {/* Steps 7–8: chat panel with streamed answers and sources */}
      <EmptyState
        icon={MessageSquare}
        title="Chat is coming"
        description="Answers will cite the exact passages they came from."
      />
    </>
  );
}
