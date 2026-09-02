import type { LiveContent } from "@/features/live-output/types";
import { createClient } from "@/lib/supabase/server";

export async function getLiveOutputContent({
  publicOutput = false,
}: { publicOutput?: boolean } = {}): Promise<LiveContent | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return null;

  const { data } = await supabase
    .from("live_output_states")
    .select("kind, payload")
    .eq("organization_id", profile.organization_id)
    .maybeSingle();
  if (!data) return null;

  return toLiveContent(data.kind, data.payload);
}

function toLiveContent(kind: string, payload: unknown): LiveContent | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const value = payload as Record<string, unknown>;

  if (
    (kind === "image" || kind === "video") &&
    typeof value.name === "string" &&
    typeof value.assetPath === "string"
  ) {
    return {
      kind,
      name: value.name,
      assetPath: value.assetPath,
      previewUrl: `/api/live-output/media?path=${encodeURIComponent(value.assetPath)}`,
    };
  }

  if (
    kind === "scripture" &&
    typeof value.reference === "string" &&
    typeof value.text === "string" &&
    (value.translation === "web" || value.translation === "kjv") &&
    typeof value.translationName === "string" &&
    typeof value.attribution === "string" &&
    typeof value.background === "string" &&
    typeof value.textSize === "number" &&
    (value.textAlign === "left" ||
      value.textAlign === "center" ||
      value.textAlign === "right") &&
    (value.textPosition === "top" ||
      value.textPosition === "center" ||
      value.textPosition === "bottom") &&
    (value.fontFamily === "serif" || value.fontFamily === "sans") &&
    typeof value.showReference === "boolean"
  ) {
    return {
      kind: "scripture",
      reference: value.reference,
      text: value.text,
      translation: value.translation,
      translationName: value.translationName,
      attribution: value.attribution,
      background: value.background,
      textSize: value.textSize,
      textAlign: value.textAlign,
      textPosition: value.textPosition,
      fontFamily: value.fontFamily,
      showReference: value.showReference,
    };
  }

  return null;
}
