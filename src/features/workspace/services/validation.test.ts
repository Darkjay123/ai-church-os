import { describe, expect, it } from "vitest";

import {
  invitationSchema,
  organizationSettingsSchema,
  roleAssignmentSchema,
  teamSchema,
} from "@/features/workspace/services/validation";

describe("workspace validation", () => {
  it("accepts a complete organization profile", () => {
    expect(
      organizationSettingsSchema.safeParse({
        name: "Grace Community Church",
        denomination: "Non-denominational",
        timezone: "Africa/Lagos",
        country: "Nigeria",
        defaultLanguage: "en",
      }).success,
    ).toBe(true);
  });

  it("rejects malformed invitations", () => {
    expect(
      invitationSchema.safeParse({ email: "not-an-email", roleId: "owner" }).success,
    ).toBe(false);
  });

  it("requires real identifiers for a role assignment", () => {
    expect(
      roleAssignmentSchema.safeParse({ profileId: "a", roleId: "b" }).success,
    ).toBe(false);
  });

  it("requires an actionable team name", () => {
    expect(teamSchema.safeParse({ name: "M" }).success).toBe(false);
  });
});
