import { render, screen } from "@testing-library/react";

import Home from "@/app/(public)/page";

describe("Home (welcome page)", () => {
  it("renders the headline", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: /tiny missions/i }),
    ).toBeInTheDocument();
  });

  it("links the register button to /signup", () => {
    render(<Home />);
    expect(
      screen.getByRole("link", { name: "Create an account" }),
    ).toHaveAttribute("href", "/signup");
  });

  it("offers a log in link for existing users", () => {
    render(<Home />);
    const loginLinks = screen.getAllByRole("link", { name: "Log in" });
    expect(loginLinks.length).toBeGreaterThan(0);
    loginLinks.forEach((link) =>
      expect(link).toHaveAttribute("href", "/login"),
    );
  });
});
