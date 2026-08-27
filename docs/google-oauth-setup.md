# Google OAuth setup

AI Church OS uses Supabase Auth as the OAuth broker. Google OAuth credentials belong in Google Cloud and Supabase only; never commit them to this repository or place them in `.env.local`.

## 1. Create Google credentials

In Google Cloud Console, create an **OAuth 2.0 Client ID** for a **Web application**. Use the redirect URI supplied by the Supabase project’s **Authentication → Providers → Google** settings. It has this form:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

Copy the Google Client ID and Client Secret into **Supabase Dashboard → Authentication → Providers → Google**, then enable the provider.

## 2. Allow application callbacks in Supabase

In **Supabase Dashboard → Authentication → URL Configuration**, set the Site URL to the deployed application origin and add every exact callback URL used by AI Church OS:

```text
http://localhost:3000/auth/callback
https://<production-domain>/auth/callback
```

For a temporary Zo preview, add its exact HTTPS callback origin too:

```text
https://<preview-host>/auth/callback
```

Do not use broad wildcard redirects in production.

## 3. Local environment

AI Church OS needs only these public Supabase connection values in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<public-key>
```

A previously copied REST endpoint (`https://<project-ref>.supabase.co/rest/v1/`) is accepted and normalised by `src/lib/env.ts`, but the project origin is preferred. No Google secret belongs in `.env.local`.

## 4. Apply database migrations first

Before enabling live OAuth, apply all migrations in lexical order, including:

```text
202608250001_foundation.sql
202608250002_workspace_access.sql
202608250003_foundation_hardening.sql
202608250004_fix_initial_owner_provisioning.sql
202608250005_google_oauth_workspace_provisioning.sql
```

Use the Supabase CLI against the intended project or apply the files through the Supabase SQL Editor. The application cannot create profiles, organisations, owner roles, or workspaces until these migrations are present.

## Flow and verification

1. The user selects **Continue with Google** on `/login` or `/sign-up`.
2. Supabase redirects to Google and returns the user to `/auth/callback` using PKCE code exchange.
3. An existing user with a profile goes to `/dashboard`.
4. A first-time user goes to `/complete-workspace`; the authenticated server action calls `provision_oauth_workspace(text)` to create the organisation, system roles, owner profile, role assignment, and audit record.
5. An invited user’s callback accepts the prevalidated invitation rather than creating a new workspace.

Test with a real Google account only after Google and Supabase have both been configured. Automated tests deliberately verify initiation and callback error handling rather than simulating a Google identity-provider success.

## Remote migration status

The currently configured remote project has **not** had the AI Church OS schema applied: its REST schema cache does not expose `public.profiles`. The application code and unit tests are verified locally, but remote signup, workspace provisioning, RLS, and Google OAuth cannot be represented as remotely verified until the migrations are deployed.

From a trusted development machine with access to the intended Supabase project, apply and verify the ordered migrations:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
npx supabase migration list
```

Use a linked **non-production** project or a local Docker/Podman Supabase stack for `npx supabase test db`; do not run the destructive database test suite against production. After deployment, test Google OAuth with a real Google account.
