import { describe, expect, it } from "vitest";

import {
  enabledOAuthProviders,
  getCallbackFailureDestination,
  getOAuthCallbackUrl,
  getSafeCallbackDestination,
} from "./oauth";

describe("OAuth provider configuration", () => {
  it("exposes Google as the only configured provider", () => {
    expect(enabledOAuthProviders).toEqual([
      { id: "google", label: "Continue with Google" },
    ]);
  });

  it("uses the same-origin secure callback with a dashboard destination", () => {
    expect(getOAuthCallbackUrl("https://church.example")).toBe(
      "https://church.example/auth/callback?next=%2Fdashboard",
    );
  });

  it("preserves an invitation through the same-origin callback", () => {
    expect(getOAuthCallbackUrl("https://church.example", "a".repeat(43))).toBe(
      "https://church.example/auth/callback?next=%2Fdashboard&invite=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
  });

  it("rejects external callback destinations", () => {
    expect(getSafeCallbackDestination("https://attacker.example")).toBe("/dashboard");
    expect(getSafeCallbackDestination("//attacker.example")).toBe("/dashboard");
    expect(getSafeCallbackDestination("/settings")).toBe("/settings");
  });

  it("maps callback failures to a safe login state", () => {
    expect(getCallbackFailureDestination("provider_cancelled")).toBe(
      "/login?error=provider_cancelled",
    );
  });
});
