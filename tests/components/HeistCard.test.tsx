import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import type { Heist } from "@/types/firestore";

// component imports
import HeistCard from "@/components/HeistCard";

const heist: Heist = {
  id: "heist-1",
  createdAt: new Date(2026, 11, 2, 15, 0),
  title: "Hide a rubber duck somewhere in the office",
  description: "Somewhere sneaky",
  createdBy: "uid-1",
  createdByCodename: "MidnightCoder",
  assignedTo: "uid-2",
  assignedToCodename: "StealthyPanda",
  deadline: new Date(2026, 11, 4, 15, 0),
  finalStatus: null,
};

describe("HeistCard", () => {
  it("renders the title, codenames and deadline", () => {
    render(<HeistCard heist={heist} />);

    expect(screen.getByText(heist.title)).toBeInTheDocument();
    expect(screen.getByText("@StealthyPanda")).toBeInTheDocument();
    expect(screen.getByText("@MidnightCoder")).toBeInTheDocument();
    expect(screen.getByText(/Dec 4, 03:00 PM/)).toBeInTheDocument();
  });

  it("links the title to the heist details page", () => {
    render(<HeistCard heist={heist} />);

    expect(screen.getByRole("link", { name: heist.title })).toHaveAttribute(
      "href",
      "/heists/heist-1",
    );
  });

  it("falls back to @unknown when a codename is missing", () => {
    render(
      <HeistCard
        heist={{ ...heist, assignedToCodename: "", createdByCodename: "" }}
      />,
    );

    expect(screen.getAllByText("@unknown")).toHaveLength(2);
  });
});
