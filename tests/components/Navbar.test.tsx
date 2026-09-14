import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useUser } from "@/hooks/useUser";

// component imports
import Navbar from "@/components/Navbar";

vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));
vi.mock("@/lib/firebase", () => ({ auth: {} }));

describe("Navbar", () => {
  beforeEach(() => {
    vi.mocked(useUser).mockReturnValue({ user: null, loading: false });
  });

  it("renders the main heading", () => {
    render(<Navbar />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it("renders the Create Heist link", () => {
    render(<Navbar />);

    const createLink = screen.getByRole("link", { name: /create heist/i });
    expect(createLink).toBeInTheDocument();
    expect(createLink).toHaveAttribute("href", "/heists/create");
  });
});
