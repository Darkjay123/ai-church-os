import type { Provider } from "@supabase/supabase-js";

export type OAuthProviderDefinition = {
  id: Provider;
  label: string;
};

export const enabledOAuthProviders: readonly OAuthProviderDefinition[] = [
  { id: "google", label: "Continue with Google" },
];

export type CallbackFailure =
  | "configuration_failed"
  | "exchange_failed"
  | "invitation_failed"
  | "missing_code"
  | "provider_cancelled"
  | "workspace_session_required";

export function getOAuthCallbackUrl(origin: string, invitationToken?: string) {
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", "/dashboard");
  if (invitationToken) callback.searchParams.set("invite", invitationToken);
  return callback.toString();
}

export function getSafeCallbackDestination(next: string | null) {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export function getCallbackFailureDestination(failure: CallbackFailure) {
  const login = new URL("/login", "http://localhost");
  login.searchParams.set("error", failure);
  return `${login.pathname}${login.search}`;
}
