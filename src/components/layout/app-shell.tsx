"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { ContextPanel } from "@/components/layout/context-panel";
import { TopStatusBar } from "@/components/layout/top-status-bar";
import { WorkspaceContextHydrator } from "@/components/layout/workspace-context-hydrator";

type WorkspaceContext = { id: string; name: string; timezone: string } | null;

export function AppShell({
  children,
  organization,
  profile,
}: {
  children: ReactNode;
  organization: WorkspaceContext;
  profile: { fullName: string | null; email: string } | null;
}) {
  const pathname = usePathname();
  return (
    <div className="bg-background flex min-h-screen">
      <WorkspaceContextHydrator organization={organization} />
      <AppSidebar pathname={pathname} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopStatusBar organization={organization} profile={profile} />
        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
      <ContextPanel />
    </div>
  );
}
