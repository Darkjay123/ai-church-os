"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/features/auth/services/validation";
import type { AuthFormState } from "@/features/auth/types";
import type { AuthError } from "@supabase/supabase-js";

function formError(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}): AuthFormState {
  return { fieldErrors: error.flatten().fieldErrors };
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
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    logAuthFailure("sign-in", error);
    return { error: "We could not sign you in. Check your details and try again." };
  }
  redirect("/dashboard");
}

export async function signUp(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const invitationToken =
    typeof formData.get("invitationToken") === "string"
      ? (formData.get("invitationToken") as string)
      : undefined;
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    churchName: invitationToken ? "invited" : formData.get("churchName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return formError(parsed.error);
  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        church_name: invitationToken ? undefined : parsed.data.churchName,
        invitation_token: invitationToken,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) {
    logAuthFailure("sign-up", error);
    return { error: "We could not create your account. Please try again." };
  }
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

function logAuthFailure(operation: "sign-in" | "sign-up", error: AuthError) {
  if (process.env.NODE_ENV !== "production") {
    console.error("[auth] Supabase request failed", {
      operation,
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }
}
