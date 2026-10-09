import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { useHeist } from "@/hooks/useHeist";

// component imports
import HeistDetails from "@/components/HeistDetails";

vi.mock("@/hooks/useHeist", () => ({ useHeist: vi.fn() }));

type HeistResult = ReturnType<typeof useHeist>;

const NOW = new Date("2026-10-09T12:00:00Z");

const HEIST = {
  id: "h1",
  title: "Swap the stapler",
  description: "Replace the boss's red stapler with a blue one.",
  createdBy: "u1",
  createdByCodename: "SneakyInternStapler",
  assignedTo: "u2",
  assignedToCodename: "NimbleCourierBinder",
  createdAt: NOW,
  deadline: new Date(NOW.getTime() + 90 * 1000),
  finalStatus: null,
};

function mockResult(result: Partial<HeistResult>) {
  vi.mocked(useHeist).mockReturnValue({
    heist: null,
    loading: false,
    error: null,
    ...result,
  } as HeistResult);
}

function valueFor(label: string) {
  return screen.getByText(label).nextElementSibling;
}

describe("HeistDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads the heist with the given id", () => {
    mockResult({ loading: true });
    render(<HeistDetails id="h1" />);
    expect(useHeist).toHaveBeenCalledWith("h1");
    expect(screen.getByRole("status")).toHaveTextContent("Loading heist...");
  });

  it("shows the title, agents, details and time left", () => {
    mockResult({ heist: HEIST });
    render(<HeistDetails id="h1" />);

    expect(
      screen.getByRole("heading", { name: "Swap the stapler" }),
    ).toBeInTheDocument();
    expect(valueFor("Assigned to")).toHaveTextContent("NimbleCourierBinder");
    expect(valueFor("Created by")).toHaveTextContent("SneakyInternStapler");
    expect(valueFor("Time left")).toHaveTextContent("1m 30s");
    expect(screen.getByText(HEIST.description)).toBeInTheDocument();
  });

  it("counts down every second", () => {
    mockResult({ heist: HEIST });
    render(<HeistDetails id="h1" />);

    act(() => vi.advanceTimersByTime(1000));
    expect(valueFor("Time left")).toHaveTextContent("1m 29s");
  });

  it("says time's up once the deadline has passed", () => {
    mockResult({ heist: HEIST });
    render(<HeistDetails id="h1" />);

    act(() => vi.advanceTimersByTime(90 * 1000));
    expect(valueFor("Time left")).toHaveTextContent("Time's up");
  });

  it("shows the outcome of a resolved heist", () => {
    mockResult({ heist: { ...HEIST, finalStatus: "success" } });
    render(<HeistDetails id="h1" />);
    expect(valueFor("Outcome")).toHaveTextContent("Heist succeeded");
  });

  it("hides the outcome for an unresolved heist", () => {
    mockResult({ heist: HEIST });
    render(<HeistDetails id="h1" />);
    expect(screen.queryByText("Outcome")).not.toBeInTheDocument();
  });

  it("shows a message when the heist doesn't exist", () => {
    mockResult({ heist: null });
    render(<HeistDetails id="missing" />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "This heist doesn't exist.",
    );
  });

  it("shows an error when loading fails", () => {
    mockResult({ error: new Error("nope") as HeistResult["error"] });
    render(<HeistDetails id="h1" />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't load this heist.",
    );
  });
});
