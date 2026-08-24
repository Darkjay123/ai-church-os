"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { signIn, signUp } from "@/features/auth/services/actions";
import type { AuthFormState } from "@/features/auth/types";

type AuthMode = "sign-in" | "sign-up";
const initialState: AuthFormState = {};

export function AuthForm({
  mode,
  invitationToken,
}: {
  mode: AuthMode;
  invitationToken?: string;
}) {
  const action = mode === "sign-in" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initialState);
  const isSignUp = mode === "sign-up";
  return (
    <form action={formAction} className="space-y-5" noValidate>
      {invitationToken ? (
        <input name="invitationToken" type="hidden" value={invitationToken} />
      ) : null}
      {isSignUp ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            autoComplete="name"
            error={state.fieldErrors?.fullName}
            label="Your full name"
            name="fullName"
          />
          {!invitationToken ? (
            <Field
              autoComplete="organization"
              error={state.fieldErrors?.churchName}
              label="Church or ministry"
              name="churchName"
            />
          ) : null}
        </div>
      ) : null}
      <Field
        autoComplete="email"
        error={state.fieldErrors?.email}
        label="Email address"
        name="email"
        type="email"
      />
      <Field
        autoComplete={isSignUp ? "new-password" : "current-password"}
        error={state.fieldErrors?.password}
        hint={
          isSignUp
            ? "At least 12 characters, with upper- and lowercase letters and a number."
            : undefined
        }
        label="Password"
        name="password"
        type="password"
      />
      {state.error ? (
        <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">
          {state.success}
        </p>
      ) : null}
      <Button className="h-11 w-full" disabled={pending} type="submit">
        {pending
          ? "Please wait…"
          : isSignUp
            ? invitationToken
              ? "Join secure workspace"
              : "Create secure workspace"
            : "Sign in to your workspace"}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        {isSignUp ? "Already have an account?" : "New to AI Church OS?"}{" "}
        <Link
          className="text-primary font-medium hover:underline"
          href={isSignUp ? "/login" : "/sign-up"}
        >
          {isSignUp ? "Sign in" : "Create your workspace"}
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  error,
  hint,
}: {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  autoComplete: string;
  error?: string[];
  hint?: string;
}) {
  const id = `auth-${name}`;
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <input
        aria-describedby={error?.length ? `${id}-error` : undefined}
        aria-invalid={Boolean(error?.length)}
        autoComplete={autoComplete}
        className="border-input bg-background focus:border-primary focus:ring-primary/20 h-11 w-full rounded-lg border px-3 text-sm transition outline-none focus:ring-3"
        id={id}
        name={name}
        type={type}
      />
      {hint ? (
        <p className="text-muted-foreground text-xs leading-relaxed">{hint}</p>
      ) : null}
      {error?.map((message) => (
        <p className="text-destructive text-xs" id={`${id}-error`} key={message}>
          {message}
        </p>
      ))}
    </div>
  );
}
