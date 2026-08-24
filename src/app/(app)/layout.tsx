import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getWorkspaceShellContext } from "@/features/workspace/services/workspace";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { organization, profile } = await getWorkspaceShellContext();
  return (
    <AppShell organization={organization} profile={profile}>
      {children}
    </AppShell>
  );
}
