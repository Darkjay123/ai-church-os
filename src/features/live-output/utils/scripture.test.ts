import { describe, expect, it } from "vitest";

import {
  detectReferenceFromTranscript,
  normaliseReference,
} from "@/features/live-output/utils/scripture";

describe("scripture reference detection", () => {
  it("normalises an explicit Bible reference", () => {
    expect(normaliseReference("Romans 8:28")).toBe("Romans 8:28");
  });

  it("recognises spoken chapter and verse numbers", () => {
    expect(
      detectReferenceFromTranscript("Romans chapter eight verse twenty eight"),
    ).toEqual({
      reference: "Romans 8:28",
      confidence: 0.98,
    });
  });

  it("makes a suggestion for a well-known quotation without inventing verse text", () => {
    expect(detectReferenceFromTranscript("For God so loved the world")).toEqual({
      reference: "John 3:16",
      confidence: 0.9,
    });
  });

  it("returns no suggestion when there is no supported reference", () => {
    expect(detectReferenceFromTranscript("Welcome to our Sunday gathering")).toBeNull();
  });
});
