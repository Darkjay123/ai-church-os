import { AuthShell } from "@/components/layout/auth-shell";
import { AuthForm } from "@/features/auth/components/auth-form";

export default async function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  const { invite } = await searchParams;
  const invitationToken = typeof invite === "string" ? invite : undefined;
  return (
    <AuthShell>
      <div className="w-full">
        <p className="text-primary text-sm font-medium">
          {invitationToken ? "Join your church workspace" : "Start your workspace"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {invitationToken ? "Complete your secure invitation" : "Set up AI Church OS"}
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          {invitationToken
            ? "Create your account with the invited email address to join the workspace."
            : "Create your secure church workspace. You will be the first workspace owner."}
        </p>
        <div className="mt-8">
          <AuthForm invitationToken={invitationToken} mode="sign-up" />
        </div>
      </div>
    </AuthShell>
  );
}
