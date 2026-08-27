import { AuthShell } from "@/components/layout/auth-shell";
import { WorkspaceProvisioningForm } from "@/features/auth/components/workspace-provisioning-form";

export default function CompleteWorkspacePage() {
  return (
    <AuthShell>
      <div className="w-full">
        <p className="text-primary text-sm font-medium">One last step</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Name your workspace
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          Your Google account is connected. Create the church workspace you will own and
          manage.
        </p>
        <div className="mt-8">
          <WorkspaceProvisioningForm />
        </div>
      </div>
    </AuthShell>
  );
}
