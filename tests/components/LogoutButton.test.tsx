import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUser } from "@/hooks/useUser";

// component imports
import LogoutButton from "@/components/LogoutButton";

vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));
vi.mock("firebase/auth", () => ({ signOut: vi.fn() }));
vi.mock("@/lib/firebase", () => ({ auth: {} }));

describe("LogoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(signOut).mockResolvedValue(undefined);
  });

  it("is not rendered when signed out", () => {
    vi.mocked(useUser).mockReturnValue({ user: null, loading: false });
    render(
      <ul>
        <LogoutButton />
      </ul>,
    );
    expect(
      screen.queryByRole("button", { name: /log out/i }),
    ).not.toBeInTheDocument();
  });

  it("is not rendered while auth state is still loading, even if a user is present", () => {
    vi.mocked(useUser).mockReturnValue({
      user: { uid: "u1", email: "a@b.com", displayName: "Ay" },
      loading: true,
    });
    render(
      <ul>
        <LogoutButton />
      </ul>,
    );
    expect(
      screen.queryByRole("button", { name: /log out/i }),
    ).not.toBeInTheDocument();
  });

  it("is rendered when a user is authenticated", () => {
    vi.mocked(useUser).mockReturnValue({
      user: { uid: "u1", email: "a@b.com", displayName: "Ay" },
      loading: false,
    });
    render(
      <ul>
        <LogoutButton />
      </ul>,
    );
    expect(
      screen.getByRole("button", { name: /log out/i }),
    ).toBeInTheDocument();
  });

  it("calls Firebase's signOut with the app's auth instance when clicked", async () => {
    vi.mocked(useUser).mockReturnValue({
      user: { uid: "u1", email: "a@b.com", displayName: "Ay" },
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <ul>
        <LogoutButton />
      </ul>,
    );

    await user.click(screen.getByRole("button", { name: /log out/i }));

    expect(signOut).toHaveBeenCalledWith(auth);
  });
});
