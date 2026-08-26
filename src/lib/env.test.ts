import { afterEach, describe, expect, it, vi } from "vitest";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
  vi.resetModules();
});

describe("getSupabaseConfig", () => {
  it("normalizes a REST endpoint to the Supabase project origin", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project-ref.supabase.co/rest/v1";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";

    const { getSupabaseConfig } = await import("./env");

    expect(getSupabaseConfig()).toEqual({
      url: "https://project-ref.supabase.co",
      publishableKey: "test-key",
    });
  });

  it("normalizes a REST endpoint with a trailing slash", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project-ref.supabase.co/rest/v1/";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";

    const { getSupabaseConfig } = await import("./env");

    expect(getSupabaseConfig()).toEqual({
      url: "https://project-ref.supabase.co",
      publishableKey: "test-key",
    });
  });

  it("rejects a non-absolute URL", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "/rest/v1";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";

    const { getSupabaseConfig } = await import("./env");

    expect(() => getSupabaseConfig()).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL must be an absolute Supabase project URL.",
    );
  });
});
