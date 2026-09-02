import type { LiveContent } from "@/features/live-output/types";

export function toLiveOutputPayload(content: LiveContent) {
  if (content.kind === "scripture") return content;
  const { previewUrl: _, ...payload } = content;
  return payload;
}

export function isValidLiveContent(content: LiveContent): boolean {
  if (content.kind === "image" || content.kind === "video") {
    return Boolean(content.name && content.assetPath && content.previewUrl);
  }

  if (content.kind !== "scripture") return false;

  return Boolean(
    content.reference &&
    content.text &&
    content.translation &&
    content.translationName &&
    content.attribution &&
    content.background &&
    Number.isFinite(content.textSize),
  );
}
