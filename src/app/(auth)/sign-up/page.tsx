import { AuthShell } from "@/components/layout/auth-shell";
import { AuthForm } from "@/features/auth/components/auth-form";

export default function SignUpPage() {
  return (
    <AuthShell>
      <div className="w-full">
        <p className="text-primary text-sm font-medium">Start your workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Set up AI Church OS
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          Create your secure church workspace. You will be the first workspace owner.
        </p>
        <div className="mt-8">
          <AuthForm mode="sign-up" />
        </div>
      </div>
    </AuthShell>
  );
}
