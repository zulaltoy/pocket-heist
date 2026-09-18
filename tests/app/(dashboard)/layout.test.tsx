import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useUser } from "@/hooks/useUser";

// component imports
import HeistsLayout from "@/app/(dashboard)/layout";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));
vi.mock("@/lib/firebase", () => ({ auth: {} }));

describe("HeistsLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the loading indicator and does not render children while auth is loading", () => {
    vi.mocked(useUser).mockReturnValue({ user: null, loading: true });
    render(
      <HeistsLayout>
        <div>Heists content</div>
      </HeistsLayout>,
    );

    expect(screen.queryByText("Heists content")).not.toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("redirects to /login and renders no children/Navbar for an unauthenticated user", () => {
    vi.mocked(useUser).mockReturnValue({ user: null, loading: false });
    render(
      <HeistsLayout>
        <div>Heists content</div>
      </HeistsLayout>,
    );

    expect(pushMock).toHaveBeenCalledWith("/login");
    expect(screen.queryByText("Heists content")).not.toBeInTheDocument();
  });

  it("renders Navbar and children for an authenticated user without redirecting", () => {
    vi.mocked(useUser).mockReturnValue({
      user: { uid: "u1", email: "a@b.com", displayName: "Ay" },
      loading: false,
    });
    render(
      <HeistsLayout>
        <div>Heists content</div>
      </HeistsLayout>,
    );

    expect(screen.getByText("Heists content")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
