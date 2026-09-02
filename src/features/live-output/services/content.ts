import type { LiveContent } from "@/features/live-output/types";

export function toLiveOutputPayload(content: LiveContent) {
  if (content.kind === "scripture") return content;
  return {
    kind: content.kind,
    name: content.name,
    assetPath: content.assetPath,
  };
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
