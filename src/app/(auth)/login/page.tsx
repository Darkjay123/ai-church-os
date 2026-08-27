import { AuthShell } from "@/components/layout/auth-shell";
import { AuthForm } from "@/features/auth/components/auth-form";

const authErrors: Record<string, string> = {
  configuration_failed: "Sign-in is temporarily unavailable. Please try again later.",
  confirmation_failed:
    "We could not confirm your account. Request a new confirmation email and try again.",
  exchange_failed: "We could not complete sign-in. Please try again.",
  invitation_acceptance_failed:
    "Your account was confirmed, but the invitation could not be accepted. Ask a workspace administrator for a new invitation.",
  invitation_failed:
    "Your account was confirmed, but the invitation could not be accepted. Ask a workspace administrator for a new invitation.",
  missing_code: "The sign-in response was incomplete. Please try again.",
  provider_cancelled: "Google sign-in was cancelled or could not be completed.",
  workspace_session_required: "Sign in again to create your workspace.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? authErrors[error] : undefined;

  return (
    <AuthShell>
      <div className="w-full">
        <p className="text-primary text-sm font-medium">Welcome back</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Sign in to your workspace
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          Your service control room is ready when you are.
        </p>
        {message ? (
          <p className="border-destructive/30 bg-destructive/10 text-destructive mt-6 rounded-lg border px-3 py-2 text-sm">
            {message}
          </p>
        ) : null}
        <div className="mt-8">
          <AuthForm mode="sign-in" />
        </div>
      </div>
    </AuthShell>
  );
}
