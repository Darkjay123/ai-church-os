import { describe, expect, it } from "vitest";

import { signInSchema, signUpSchema } from "@/features/auth/services/validation";

describe("auth validation", () => {
  it("accepts a valid sign-up request", () => {
    expect(
      signUpSchema.safeParse({
        fullName: "Ada Lovelace",
        churchName: "Grace Community Church",
        email: "ADA@EXAMPLE.COM",
        password: "StrongPassword2026",
      }).success,
    ).toBe(true);
  });

  it("rejects a weak password", () => {
    expect(
      signUpSchema.safeParse({
        fullName: "Ada Lovelace",
        churchName: "Grace Community Church",
        email: "ada@example.com",
        password: "weak",
      }).success,
    ).toBe(false);
  });

  it("requires an email and password to sign in", () => {
    expect(
      signInSchema.safeParse({ email: "not-an-email", password: "" }).success,
    ).toBe(false);
  });
});
