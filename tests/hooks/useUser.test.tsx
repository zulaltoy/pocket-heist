import { renderHook, act, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { onAuthStateChanged } from "firebase/auth";

// component/hook imports
import AuthProvider from "@/components/AuthProvider";
import { useUser } from "@/hooks/useUser";

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn(),
}));
vi.mock("@/lib/firebase", () => ({
  auth: {},
}));

describe("useUser", () => {
  let authCallback: (user: unknown) => void;
  const unsubscribeSpy = vi.fn();

  beforeEach(() => {
    unsubscribeSpy.mockClear();
    vi.mocked(onAuthStateChanged).mockClear();
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, cb) => {
      authCallback = cb as (user: unknown) => void;
      return unsubscribeSpy;
    });
  });

  it("starts as not-yet-determined before the callback fires", () => {
    const { result } = renderHook(() => useUser(), { wrapper: AuthProvider });
    expect(result.current).toEqual({ user: null, loading: true });
  });

  it("resolves to signed-out state", () => {
    const { result } = renderHook(() => useUser(), { wrapper: AuthProvider });
    act(() => authCallback(null));
    expect(result.current).toEqual({ user: null, loading: false });
  });

  it("trims the Firebase user down to uid/email/displayName", () => {
    const { result } = renderHook(() => useUser(), { wrapper: AuthProvider });
    act(() =>
      authCallback({
        uid: "u1",
        email: "a@b.com",
        displayName: "Ay",
        photoURL: "x",
      }),
    );
    expect(result.current).toEqual({
      user: { uid: "u1", email: "a@b.com", displayName: "Ay" },
      loading: false,
    });
  });

  it("reacts to auth state changing while mounted", () => {
    const { result } = renderHook(() => useUser(), { wrapper: AuthProvider });
    act(() => authCallback({ uid: "u1", email: "a@b.com", displayName: "Ay" }));
    expect(result.current.user).not.toBeNull();
    act(() => authCallback(null));
    expect(result.current.user).toBeNull();
  });

  it("uses a single listener for multiple simultaneous consumers", () => {
    function TwoConsumers() {
      const a = useUser();
      const b = useUser();
      return (
        <div>
          {a.user?.uid ?? "none"}-{b.user?.uid ?? "none"}
        </div>
      );
    }
    render(
      <AuthProvider>
        <TwoConsumers />
      </AuthProvider>,
    );
    act(() => authCallback({ uid: "u1", email: "a@b.com", displayName: "Ay" }));
    expect(onAuthStateChanged).toHaveBeenCalledTimes(1);
    expect(screen.getByText("u1-u1")).toBeInTheDocument();
  });

  it("unsubscribes on unmount", () => {
    const { unmount } = renderHook(() => useUser(), { wrapper: AuthProvider });
    unmount();
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });

  it("throws when used outside an AuthProvider", () => {
    expect(() => renderHook(() => useUser())).toThrow(
      "useUser must be used within an AuthProvider",
    );
  });
});
