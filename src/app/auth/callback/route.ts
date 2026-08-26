import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const invitationToken = searchParams.get("invite");
  const next =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
  }

  if (invitationToken) {
    const { error: invitationError } = await supabase.rpc(
      "accept_workspace_invitation",
      {
        invitation_token: invitationToken,
      },
    );
    if (invitationError) {
      return NextResponse.redirect(
        `${origin}/login?error=invitation_acceptance_failed`,
      );
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
