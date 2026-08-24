"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { ContextPanel } from "@/components/layout/context-panel";
import { TopStatusBar } from "@/components/layout/top-status-bar";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="bg-background flex min-h-screen">
      <AppSidebar pathname={pathname} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopStatusBar />
        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
      <ContextPanel />
    </div>
  );
}
