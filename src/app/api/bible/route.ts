import { NextResponse } from "next/server";

import {
  lookupBibleReference,
  type BibleTranslation,
} from "@/features/live-output/services/bible";

const availableTranslations = new Set<BibleTranslation>(["web", "kjv"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference")?.trim() ?? "";
  const translation = searchParams.get("translation") ?? "web";

  if (!reference) {
    return NextResponse.json(
      { error: "Enter a scripture reference." },
      { status: 400 },
    );
  }
  if (!availableTranslations.has(translation as BibleTranslation)) {
    return NextResponse.json(
      { error: "That translation is not available yet." },
      { status: 400 },
    );
  }

  try {
    const scripture = await lookupBibleReference(
      reference,
      translation as BibleTranslation,
    );
    return NextResponse.json({ scripture });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "This scripture could not be found.",
      },
      { status: 404 },
    );
  }
}
