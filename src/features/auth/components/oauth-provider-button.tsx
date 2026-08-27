"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  enabledOAuthProviders,
  getOAuthCallbackUrl,
} from "@/features/auth/services/oauth";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "sign-in" | "sign-up";

type OAuthProviderButtonProps = {
  mode: AuthMode;
  invitationToken?: string;
  onNavigate?: (url: string) => void;
};

export function OAuthProviderButton({
  mode,
  invitationToken,
  onNavigate = (url) => window.location.assign(url),
}: OAuthProviderButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const provider = enabledOAuthProviders[0];

  async function startGoogleOAuth() {
    if (!provider) {
      setError("Google sign-in is unavailable. Please use email and password.");
      return;
    }

    setPending(true);
    setError(undefined);

    try {
      const supabase = createClient();
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: provider.id,
        options: {
          redirectTo: getOAuthCallbackUrl(window.location.origin, invitationToken),
          skipBrowserRedirect: true,
        },
      });

      if (oauthError || !data.url) {
        setError("Google sign-in could not be started. Please try again.");
        setPending(false);
        return;
      }

      onNavigate(data.url);
    } catch {
      setError("Google sign-in could not be started. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        className="h-11 w-full gap-3"
        disabled={pending}
        onClick={startGoogleOAuth}
        type="button"
        variant="outline"
      >
        <GoogleMark />
        {pending ? "Connecting to Google…" : provider?.label}
      </Button>
      {error ? (
        <p
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {mode === "sign-up" ? (
        <p className="text-muted-foreground text-center text-xs leading-5">
          New Google accounts continue to secure workspace setup after sign-in.
        </p>
      ) : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
      <path
        d="M21.35 12.28c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.52h3.15c1.84-1.69 2.9-4.19 2.9-7.29Z"
        fill="#4285F4"
      />
      <path
        d="M12 21.78c2.62 0 4.82-.87 6.43-2.36l-3.15-2.52c-.87.59-1.99.94-3.28.94-2.53 0-4.68-1.71-5.45-4.01H3.3v2.6a9.71 9.71 0 0 0 8.7 5.35Z"
        fill="#34A853"
      />
      <path
        d="M6.55 13.83a5.84 5.84 0 0 1 0-3.66v-2.6H3.3a9.77 9.77 0 0 0 0 8.86l3.25-2.6Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.16c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.82 3.23 14.62 2.22 12 2.22A9.71 9.71 0 0 0 3.3 7.57l3.25 2.6C7.32 7.87 9.47 6.16 12 6.16Z"
        fill="#EA4335"
      />
    </svg>
  );
}
