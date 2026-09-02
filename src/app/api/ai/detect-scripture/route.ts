import { NextResponse } from "next/server";

import { detectScriptureReference } from "@/features/ai-brain/services/scripture-detection";
import { logServerEvent } from "@/lib/server-logger";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });

  let transcript: unknown;
  try {
    ({ transcript } = (await request.json()) as { transcript?: unknown });
  } catch {
    return NextResponse.json({ error: "A transcript is required." }, { status: 400 });
  }
  if (typeof transcript !== "string" || !transcript.trim()) {
    return NextResponse.json({ error: "A transcript is required." }, { status: 400 });
  }

  try {
    const suggestion = await detectScriptureReference(transcript);
    return NextResponse.json({ suggestion });
  } catch (error) {
    const failure = error as { code?: string; status?: number; message?: string };
    logServerEvent("error", {
      operation: "detect-scripture-reference",
      category: "ai-brain",
      userId: user.id,
      code: failure.code,
      status: failure.status,
      message: failure.message ?? "Scripture detection failed",
    });
    return NextResponse.json(
      { error: "Scripture detection is temporarily unavailable." },
      { status: 503 },
    );
  }
}
