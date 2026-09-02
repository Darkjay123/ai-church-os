import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/live-service/services/actions", () => ({
  createLiveService: vi.fn(),
  startLiveService: vi.fn(),
  endLiveService: vi.fn(),
}));

import { LiveServiceWorkspace } from "./live-service-workspace";

describe("LiveServiceWorkspace", () => {
  it("gives an authorised operator an accessible service creation control room", () => {
    render(
      <LiveServiceWorkspace
        data={{
          activeService: null,
          scheduledServices: [],
          permissions: { canManageServices: true, canOperateServices: true },
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Service control room" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Service title" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Create service" })).toBeEnabled();
  });

  it("keeps the microphone cue as an explicit local operator control", () => {
    render(
      <LiveServiceWorkspace
        data={{
          activeService: null,
          scheduledServices: [],
          permissions: { canManageServices: false, canOperateServices: false },
        }}
      />,
    );

    const cue = screen.getByRole("button", { name: "Cue closed" });
    fireEvent.click(cue);

    expect(screen.getByRole("button", { name: "Cue open" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
