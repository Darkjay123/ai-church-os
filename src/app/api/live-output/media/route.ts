import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path");
  if (!path)
    return NextResponse.json({ error: "Media path is required." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !path.startsWith(`${profile.organization_id}/`)) {
    return NextResponse.json({ error: "Media is unavailable." }, { status: 404 });
  }

  const { data, error } = await supabase.storage.from("church-media").download(path);
  if (error || !data)
    return NextResponse.json({ error: "Media is unavailable." }, { status: 404 });

  return new NextResponse(data.stream(), {
    headers: {
      "Cache-Control": "private, no-store",
      "Accept-Ranges": "bytes",
      "Content-Type": data.type || "application/octet-stream",
    },
  });
}
