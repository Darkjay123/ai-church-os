import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  maybeSingle: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/server-logger", () => ({ logServerEvent: vi.fn() }));

import { GET } from "./route";

const { createClient, exchangeCodeForSession, maybeSingle, rpc } = mocks;

function callbackRequest(query = "") {
  return new Request(`https://church.example/auth/callback${query}`);
}

function authenticatedClient({ profile = { id: "profile-id" } } = {}) {
  return {
    auth: {
      exchangeCodeForSession,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      })),
    })),
    rpc,
    profile,
  };
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "user-id" } },
      error: null,
    });
    maybeSingle.mockResolvedValue({ data: { id: "profile-id" }, error: null });
    rpc.mockResolvedValue({ error: null });
  });

  it("returns a safe error state when the provider is cancelled", async () => {
    const response = await GET(callbackRequest("?error=access_denied"));

    expect(response.headers.get("location")).toBe(
      "https://church.example/login?error=provider_cancelled",
    );
    expect(createClient).not.toHaveBeenCalled();
  });

  it("returns a safe error state when the callback code is missing", async () => {
    const response = await GET(callbackRequest());

    expect(response.headers.get("location")).toBe(
      "https://church.example/login?error=missing_code",
    );
  });

  it("returns a safe error state when Supabase configuration is unavailable", async () => {
    createClient.mockRejectedValue(new Error("missing configuration"));

    const response = await GET(callbackRequest("?code=valid"));

    expect(response.headers.get("location")).toBe(
      "https://church.example/login?error=configuration_failed",
    );
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("returns a safe error state when the code exchange fails", async () => {
    createClient.mockResolvedValue(authenticatedClient());
    exchangeCodeForSession.mockResolvedValue({
      data: { user: null },
      error: { code: "bad_code", status: 400, message: "Invalid code" },
    });

    const response = await GET(callbackRequest("?code=invalid"));

    expect(response.headers.get("location")).toBe(
      "https://church.example/login?error=exchange_failed",
    );
  });

  it("redirects an existing Google user with a profile to the dashboard", async () => {
    const client = authenticatedClient();
    createClient.mockResolvedValue(client);

    const response = await GET(callbackRequest("?code=valid"));

    expect(exchangeCodeForSession).toHaveBeenCalledWith("valid");
    expect(response.headers.get("location")).toBe("https://church.example/dashboard");
  });

  it("sends a first-time Google user to secure workspace completion", async () => {
    createClient.mockResolvedValue(authenticatedClient());
    maybeSingle.mockResolvedValue({ data: null, error: null });

    const response = await GET(callbackRequest("?code=valid"));

    expect(response.headers.get("location")).toBe(
      "https://church.example/complete-workspace",
    );
  });

  it("accepts an invitation only after the authenticated code exchange", async () => {
    createClient.mockResolvedValue(authenticatedClient());

    const response = await GET(callbackRequest("?code=valid&invite=opaque-token"));

    expect(rpc).toHaveBeenCalledWith("accept_workspace_invitation", {
      invitation_token: "opaque-token",
    });
    expect(response.headers.get("location")).toBe("https://church.example/dashboard");
  });
});
