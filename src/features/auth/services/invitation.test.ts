import { describe, expect, it } from "vitest";

import { getInvitationTokenDigest } from "./invitation";

describe("getInvitationTokenDigest", () => {
  it("hashes a 32-byte base64url invitation token", () => {
    const token = "a".repeat(43);
    expect(getInvitationTokenDigest(token)).toBe(
      "66d34fba71f8f450f7e45598853e53bfc23bbd129027cbb131a2f4ffd7878cd0",
    );
  });

  it("rejects malformed invitation tokens before calling Supabase", () => {
    expect(getInvitationTokenDigest(undefined)).toBeNull();
    expect(getInvitationTokenDigest("not-a-secure-token")).toBeNull();
    expect(getInvitationTokenDigest("a".repeat(44))).toBeNull();
  });
});
