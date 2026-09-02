import type { BibleLookup, BibleTranslation } from "@/features/live-output/types";

export type { BibleTranslation } from "@/features/live-output/types";

const translations: Record<
  BibleTranslation,
  { id: string; name: string; attribution: string }
> = {
  web: {
    id: "web",
    name: "World English Bible",
    attribution: "World English Bible (WEB) · Public Domain",
  },
  kjv: {
    id: "kjv",
    name: "King James Version",
    attribution: "King James Version (KJV) · Public Domain",
  },
};

export async function lookupBibleReference(
  reference: string,
  translation: BibleTranslation,
): Promise<BibleLookup> {
  const source = translations[translation];
  const response = await fetch(
    `https://bible-api.com/${encodeURIComponent(reference)}?translation=${source.id}`,
    { next: { revalidate: 3600 } },
  );
  if (!response.ok) {
    throw new Error(
      "That scripture could not be found. Check the reference and try again.",
    );
  }

  const data = (await response.json()) as {
    reference?: unknown;
    text?: unknown;
    translation_name?: unknown;
    error?: unknown;
  };
  if (
    data.error ||
    typeof data.text !== "string" ||
    typeof data.reference !== "string"
  ) {
    throw new Error(
      "That scripture could not be found. Check the reference and try again.",
    );
  }

  return {
    reference: data.reference,
    text: data.text.replace(/\s+/g, " ").trim(),
    translation,
    translationName:
      typeof data.translation_name === "string" ? data.translation_name : source.name,
    attribution: source.attribution,
  };
}

export function getBibleTranslation(id: BibleTranslation) {
  return translations[id];
}

export const getBiblePassage = lookupBibleReference;
