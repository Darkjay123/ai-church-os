import { describe, expect, it } from "vitest";

import {
  isValidLiveContent,
  toLiveOutputPayload,
} from "@/features/live-output/services/content";

describe("live output content", () => {
  it("keeps canonical scripture data in the server payload", () => {
    const content = {
      kind: "scripture" as const,
      reference: "John 3:16",
      text: "For God so loved the world.",
      translation: "web" as const,
      translationName: "World English Bible",
      attribution: "World English Bible (WEB) · Public Domain",
      background: "#050505",
      textSize: 4.8,
      textAlign: "center" as const,
      textPosition: "center" as const,
      fontFamily: "serif" as const,
      showReference: true,
    };

    expect(isValidLiveContent(content)).toBe(true);
    expect(toLiveOutputPayload(content)).toEqual(content);
  });

  it("does not persist temporary media preview URLs", () => {
    const content = {
      kind: "image" as const,
      name: "Sunday flyer.png",
      assetPath: "org-id/flyer.png",
      previewUrl: "https://temporary.example/flyer.png",
    };

    expect(isValidLiveContent(content)).toBe(true);
    expect(toLiveOutputPayload(content)).toEqual({
      kind: "image",
      name: "Sunday flyer.png",
      assetPath: "org-id/flyer.png",
    });
  });

  it("rejects an incomplete item before it reaches the output RPC", () => {
    expect(
      isValidLiveContent({
        kind: "video",
        name: "",
        assetPath: "org-id/video.mp4",
        previewUrl: "https://temporary.example/video.mp4",
      }),
    ).toBe(false);
  });
});
