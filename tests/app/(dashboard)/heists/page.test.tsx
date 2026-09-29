import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useHeists, type HeistsMode } from "@/hooks/useHeists";

// component imports
import HeistsPage from "@/app/(dashboard)/heists/page";

vi.mock("@/hooks/useHeists", () => ({ useHeists: vi.fn() }));

type HeistsResult = ReturnType<typeof useHeists>;

const done = (titles: string[]): HeistsResult =>
  ({
    heists: titles.map((title, i) => ({ id: `${title}-${i}`, title })),
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

  it("shows loading and empty states", () => {
    mockResults({
      active: { heists: [], loading: true, error: null },
      assigned: done([]),
      expired: done([]),
    });
    render(<HeistsPage />);

    expect(
      section("Your Active Heists").getByText("Loading..."),
    ).toBeInTheDocument();
    expect(
      section("Heists You've Assigned").getByText("No heists here yet."),
    ).toBeInTheDocument();
  });
});
