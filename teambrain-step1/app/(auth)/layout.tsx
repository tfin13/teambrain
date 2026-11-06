import { Brain } from "lucide-react";

// Shell for signed-out pages (login, register).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-muted/30 px-4 py-12">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Brain className="size-4" />
        </div>
        <span className="font-semibold tracking-tight">TeamBrain</span>
      </div>
      {children}
    </div>
  );
}
