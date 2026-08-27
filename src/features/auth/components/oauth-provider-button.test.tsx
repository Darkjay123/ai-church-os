import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithOAuth = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithOAuth } }),
}));

import { OAuthProviderButton } from "./oauth-provider-button";

describe("OAuthProviderButton", () => {
  beforeEach(() => {
    signInWithOAuth.mockReset();
  });

  it("renders the Google action on the sign-in form", () => {
    render(<OAuthProviderButton mode="sign-in" />);

    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument();
  });

  it("starts a Google OAuth redirect through the configured Supabase client", async () => {
    signInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.example/authorize" },
      error: null,
    });
    const onNavigate = vi.fn();
    render(
      <OAuthProviderButton
        invitationToken={"a".repeat(43)}
        mode="sign-up"
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    await waitFor(() =>
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo:
            "http://localhost:3000/auth/callback?next=%2Fdashboard&invite=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          skipBrowserRedirect: true,
        },
      }),
    );
    expect(onNavigate).toHaveBeenCalledWith(
      "https://accounts.google.example/authorize",
    );
  });

  it("shows a safe error when Supabase cannot start OAuth", async () => {
    signInWithOAuth.mockResolvedValue({
      data: { url: null },
      error: new Error("provider unavailable"),
    });
    render(<OAuthProviderButton mode="sign-in" />);

    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Google sign-in could not be started. Please try again.",
    );
  });
});
