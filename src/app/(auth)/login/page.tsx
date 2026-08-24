import { AuthShell } from "@/components/layout/auth-shell";
import { AuthForm } from "@/features/auth/components/auth-form";

export default function LoginPage() {
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
        <div className="mt-8">
          <AuthForm mode="sign-in" />
        </div>
      </div>
    </AuthShell>
  );
}
