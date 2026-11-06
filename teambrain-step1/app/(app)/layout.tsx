import { AppSidebar } from "@/components/app-sidebar";
import { requireUser } from "@/lib/auth";

// Shell for every signed-in page. Middleware already redirects signed-out users;
// this check is the second line of defense and supplies the user to the sidebar.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <AppSidebar email={user.email} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8">{children}</div>
      </main>
    </div>
  );
}
