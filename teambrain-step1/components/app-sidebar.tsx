"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, FileText, MessageSquare, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/search", label: "Search", icon: Search },
  { href: "/chat", label: "Chat", icon: MessageSquare },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b bg-muted/30 md:h-dvh md:w-60 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Brain className="size-4" />
        </div>
        <span className="font-semibold tracking-tight">TeamBrain</span>
      </div>

      <nav className="flex gap-1 px-2 pb-3 md:flex-col md:pb-0">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Step 2: user menu + sign out goes here */}
    </aside>
  );
}
