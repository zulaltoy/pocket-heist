import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useUser } from "@/hooks/useUser";

// component imports
import PublicLayout from "@/app/(public)/layout";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));

describe("PublicLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the loading indicator and does not render children while auth is loading", () => {
    vi.mocked(useUser).mockReturnValue({ user: null, loading: true });
    render(
      <PublicLayout>
        <div>Public content</div>
      </PublicLayout>,
    );

    expect(screen.queryByText("Public content")).not.toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("redirects to /heists and renders no children for an authenticated user", () => {
    vi.mocked(useUser).mockReturnValue({
      user: { uid: "u1", email: "a@b.com", displayName: "Ay" },
      loading: false,
    });
    render(
      <PublicLayout>
        <div>Public content</div>
      </PublicLayout>,
    );

    expect(pushMock).toHaveBeenCalledWith("/heists");
    expect(screen.queryByText("Public content")).not.toBeInTheDocument();
  });

  it("renders children for an unauthenticated user without redirecting", () => {
    vi.mocked(useUser).mockReturnValue({ user: null, loading: false });
    render(
      <PublicLayout>
        <div>Public content</div>
      </PublicLayout>,
    );

    expect(screen.getByText("Public content")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
