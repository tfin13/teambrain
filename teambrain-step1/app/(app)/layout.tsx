import { AppSidebar } from "@/components/app-sidebar";

// Shell for every signed-in page. Step 2 adds the session check here.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8">{children}</div>
      </main>
    </div>
  );
}
