import { describe, expect, it } from "vitest";

import {
  liveServiceSchema,
  parseScheduledFor,
} from "@/features/live-service/services/validation";

describe("live-service validation", () => {
  it("accepts a planned service with optional scheduling details", () => {
    expect(
      liveServiceSchema.safeParse({
        title: "Sunday Celebration",
        serviceType: "Sunday service",
        scheduledFor: "2026-09-13T09:00",
        speaker: "Pastor Ada",
      }).success,
    ).toBe(true);
  });

  it("requires a meaningful title and service type", () => {
    expect(liveServiceSchema.safeParse({ title: "S", serviceType: "" }).success).toBe(
      false,
    );
  });

  it("normalises a local schedule to an ISO timestamp", () => {
    const result = parseScheduledFor("2026-09-13T09:00");
    expect("data" in result && result.data).toMatch(/^2026-09-13T/);
  });

  it("rejects an invalid schedule", () => {
    expect(parseScheduledFor("not a date")).toEqual({
      error: "Enter a valid service date and time.",
    });
  });
});
