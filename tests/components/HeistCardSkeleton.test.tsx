import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

// component imports
import HeistCardSkeleton from "@/components/HeistCardSkeleton";

describe("HeistCardSkeleton", () => {
  it("renders an accessible loading placeholder", () => {
    render(<HeistCardSkeleton />);

    const skeleton = screen.getByRole("status", { name: "Loading heist" });
    expect(skeleton).toHaveAttribute("aria-busy", "true");
  });
});
