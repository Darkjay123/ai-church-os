import { WorkspaceSettings } from "@/features/workspace/components/workspace-settings";
import { getWorkspaceSettingsData } from "@/features/workspace/services/workspace";

export default async function SettingsPage() {
  const data = await getWorkspaceSettingsData();
  return <WorkspaceSettings data={data} />;
}
