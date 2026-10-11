import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useHeists, type HeistsMode } from "@/hooks/useHeists";

// component imports
import HeistsPage from "@/app/(dashboard)/heists/page";

vi.mock("@/hooks/useHeists", () => ({ useHeists: vi.fn() }));

type HeistsResult = ReturnType<typeof useHeists>;

const done = (titles: string[]): HeistsResult =>
  ({
    heists: titles.map((title, i) => ({
      id: `heist-${i}`,
      title,
      assignedToCodename: "Assignee",
      createdByCodename: "Creator",
      deadline: new Date(Date.now() + 60 * 60 * 1000),
    })),
    loading: false,
    error: null,
  }) as unknown as HeistsResult;

function mockResults(results: Record<HeistsMode, HeistsResult>) {
  vi.mocked(useHeists).mockImplementation((mode) => results[mode]);
}

function section(heading: string) {
  return within(screen.getByRole("heading", { name: heading }).parentElement!);
}

describe("HeistsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders each result set's titles under the matching heading", () => {
    mockResults({
      active: done(["Swap the stapler"]),
      assigned: done(["Hide the mouse"]),
      expired: done(["Rename the wifi"]),
    });
    render(<HeistsPage />);

    expect(
      section("Your Active Heists").getByText("Swap the stapler"),
    ).toBeInTheDocument();
    expect(
      section("Heists You've Assigned").getByText("Hide the mouse"),
    ).toBeInTheDocument();
    expect(
      section("All Expired Heists").getByText("Rename the wifi"),
    ).toBeInTheDocument();
    expect(
      section("Your Active Heists").queryByText("Hide the mouse"),
    ).not.toBeInTheDocument();
  });

  it("links active and assigned titles to their details page, but not expired", () => {
    mockResults({
      active: done(["Swap the stapler"]),
      assigned: done(["Hide the mouse"]),
      expired: done(["Rename the wifi"]),
    });
    render(<HeistsPage />);

    expect(
      section("Your Active Heists").getByRole("link", {
        name: "Swap the stapler",
      }),
    ).toHaveAttribute("href", "/heists/heist-0");
    expect(
      section("Heists You've Assigned").getByRole("link", {
        name: "Hide the mouse",
      }),
    ).toHaveAttribute("href", "/heists/heist-0");
    expect(
      section("All Expired Heists").queryByRole("link"),
    ).not.toBeInTheDocument();
  });

  it("shows loading and empty states", () => {
    mockResults({
      active: { heists: [], loading: true, error: null },
      assigned: done([]),
      expired: done([]),
    });
    render(<HeistsPage />);

    expect(section("Your Active Heists").getAllByRole("status")).toHaveLength(
      3,
    );
    expect(
      section("Heists You've Assigned").getByText("No heists here yet."),
    ).toBeInTheDocument();
  });
});
