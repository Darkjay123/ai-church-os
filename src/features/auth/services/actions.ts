"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";

import { getInvitationTokenDigest } from "@/features/auth/services/invitation";
import { signInSchema, signUpSchema } from "@/features/auth/services/validation";
import type { AuthFormState } from "@/features/auth/types";
import { logServerEvent } from "@/lib/server-logger";
import { createClient } from "@/lib/supabase/server";

function formError(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}): AuthFormState {
  return { fieldErrors: error.flatten().fieldErrors };
}

async function getRequestId() {
  return (await headers()).get("x-request-id") ?? crypto.randomUUID();
}

export async function signIn(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return formError(parsed.error);

  const requestId = await getRequestId();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    logAuthFailure("sign-in", requestId, error);
    return { error: "We could not sign you in. Check your details and try again." };
  }

  logServerEvent("info", {
    operation: "sign-in",
    requestId,
    userId: data.user.id,
    category: "auth",
  });
  redirect("/dashboard");
}

export async function signUp(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const invitationToken =
    typeof formData.get("invitationToken") === "string"
      ? (formData.get("invitationToken") as string).trim() || undefined
      : undefined;
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    churchName: invitationToken ? "invited" : formData.get("churchName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return formError(parsed.error);

  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? crypto.randomUUID();
  const origin = requestHeaders.get("origin");
  if (!origin) {
    logServerEvent("error", {
      operation: "sign-up",
      requestId,
      category: "configuration",
      message: "Missing request origin",
    });
    return { error: "We could not start secure account creation. Please try again." };
  }

  const supabase = await createClient();
  if (invitationToken) {
    const tokenDigest = getInvitationTokenDigest(invitationToken);
    if (!tokenDigest) return { error: "Invitation is invalid or expired." };

    const { data: invitation, error: invitationError } = await supabase
      .rpc("validate_workspace_invitation", { token_digest: tokenDigest })
      .maybeSingle();
    if (invitationError) {
      logServerEvent("error", {
        operation: "validate-invitation",
        requestId,
        category: "database",
        code: invitationError.code,
        status: 400,
        message: invitationError.message,
      });
      return { error: "We could not validate this invitation. Please try again." };
    }
    if (
      !invitation ||
      invitation.email.toLowerCase() !== parsed.data.email.toLowerCase()
    ) {
      return {
        error: "Invitation is invalid, expired, or does not match this email address.",
      };
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        church_name: invitationToken ? undefined : parsed.data.churchName,
      },
      emailRedirectTo: invitationToken
        ? `${origin}/auth/callback?invite=${encodeURIComponent(invitationToken)}`
        : `${origin}/auth/callback`,
    },
  });
  if (error) {
    logAuthFailure("sign-up", requestId, error);
    return { error: signUpErrorMessage(error) };
  }

  logServerEvent("info", {
    operation: "sign-up",
    requestId,
    userId: data.user?.id,
    category: "auth",
    message: data.session ? "session-created" : "confirmation-required",
  });
  if (data.session) redirect("/dashboard");

  return {
    success:
      "Check your email to confirm your account, then sign in to your workspace.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function signUpErrorMessage(error: AuthError) {
  if (error.message.toLowerCase().includes("already registered")) {
    return "An account already exists for this email address. Sign in instead.";
  }
  if (error.message.toLowerCase().includes("database error")) {
    return "Your account could not be provisioned. Our team has been notified.";
  }
  return "We could not create your account. Please try again.";
}

function logAuthFailure(
  operation: "sign-in" | "sign-up",
  requestId: string,
  error: AuthError,
) {
  logServerEvent("error", {
    operation,
    requestId,
    category: "auth",
    code: error.code,
    status: error.status,
    message: error.message,
  });
}
