"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/features/auth/services/validation";
import type { AuthFormState } from "@/features/auth/types";

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

  if (error)
    return { error: "We could not sign you in. Check your details and try again." };

  redirect("/dashboard");
}

export async function signUp(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    churchName: formData.get("churchName"),
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
        church_name: parsed.data.churchName,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) return { error: "We could not create your account. Please try again." };

  if (data.session) redirect("/dashboard");

  return {
    success:
      "Check your email to confirm your account. Your church workspace will be created after confirmation.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
