import { ChatPanel } from "@/components/chat-panel";
import { PageHeader } from "@/components/page-header";

export default function ChatPage() {
  return (
    <>
      <PageHeader
        title="Chat"
        description="Ask questions and get answers cited from your documents."
      />
      <ChatPanel />
    </>
  );
}
