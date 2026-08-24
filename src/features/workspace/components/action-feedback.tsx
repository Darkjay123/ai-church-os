import type { WorkspaceActionState } from "@/features/workspace/types";

export function ActionFeedback({ state }: { state: WorkspaceActionState }) {
  if (state.error)
    return (
      <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
        {state.error}
      </p>
    );
  if (state.success)
    return (
      <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">
        {state.success}
      </p>
    );
  return null;
}
