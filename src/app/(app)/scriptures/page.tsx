import { LivePresentationWorkspace } from "@/features/live-output/components/live-presentation-workspace";
import { getLivePresentationScope } from "@/features/live-output/services/presentation";

export default async function ScripturesPage() {
  return (
    <LivePresentationWorkspace
      initialTab="scripture"
      scope={await getLivePresentationScope()}
    />
  );
}
