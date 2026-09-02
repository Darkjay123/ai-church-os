import { NextResponse } from "next/server";

import { getLiveOutputContent } from "@/features/live-output/services/live-output";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { content: await getLiveOutputContent() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
