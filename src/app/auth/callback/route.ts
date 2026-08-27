import { NextResponse } from "next/server";

import {
  getCallbackFailureDestination,
  getSafeCallbackDestination,
} from "@/features/auth/services/oauth";
import { logServerEvent } from "@/lib/server-logger";
import { createClient } from "@/lib/supabase/server";

function callbackErrorRedirect(
  origin: string,
  reason:
    | "configuration_failed"
    | "exchange_failed"
    | "missing_code"
    | "provider_cancelled"
    | "invitation_failed",
) {
  return NextResponse.redirect(new URL(getCallbackFailureDestination(reason), origin));
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const code = searchParams.get("code");
  const providerError = searchParams.get("error");
  const invitationToken = searchParams.get("invite");
  const next = getSafeCallbackDestination(searchParams.get("next"));

  if (providerError) {
    logServerEvent("error", {
      operation: "auth-callback",
      requestId,
      category: "oauth",
      code: providerError,
      message: "OAuth provider returned an error",
    });
    return callbackErrorRedirect(origin, "provider_cancelled");
  }
  if (!code) {
    logServerEvent("error", {
      operation: "auth-callback",
      requestId,
      category: "oauth",
      code: "missing_code",
      message: "Missing callback code",
    });
    return callbackErrorRedirect(origin, "missing_code");
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    logServerEvent("error", {
      operation: "auth-callback",
      requestId,
      category: "configuration",
      message: "Supabase configuration unavailable",
    });
    return callbackErrorRedirect(origin, "configuration_failed");
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    logServerEvent("error", {
      operation: "auth-callback",
      requestId,
      category: "oauth",
      code: error?.code,
      status: error?.status,
      message: error?.message ?? "OAuth code exchange did not return a user",
    });
    return callbackErrorRedirect(origin, "exchange_failed");
  }

  logServerEvent("info", {
    operation: "auth-callback",
    requestId,
    userId: data.user.id,
    category: "oauth",
  });

  if (invitationToken) {
    const { error: invitationError } = await supabase.rpc(
      "accept_workspace_invitation",
      { invitation_token: invitationToken },
    );
    if (invitationError) {
      logServerEvent("error", {
        operation: "accept-workspace-invitation",
        requestId,
        userId: data.user.id,
        category: "database",
        code: invitationError.code,
        message: invitationError.message,
      });
      return callbackErrorRedirect(origin, "invitation_failed");
    }
  } else {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profileError) {
      logServerEvent("error", {
        operation: "load-oauth-profile",
        requestId,
        userId: data.user.id,
        category: "database",
        code: profileError.code,
        message: profileError.message,
      });
      return callbackErrorRedirect(origin, "exchange_failed");
    }
    if (!profile) {
      return NextResponse.redirect(new URL("/complete-workspace", origin));
    }
  }

  return NextResponse.redirect(new URL(next, origin));
}
