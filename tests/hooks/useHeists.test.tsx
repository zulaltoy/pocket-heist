import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { onSnapshot, orderBy, where } from "firebase/firestore";

// hook imports
import { useHeists } from "@/hooks/useHeists";

const { userState, unsubscribeSpy } = vi.hoisted(() => ({
  userState: { user: { uid: "me" } as { uid: string } | null },
  unsubscribeSpy: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_db, name) => ({ withConverter: () => ({ name }) })),
  query: vi.fn((ref, ...constraints) => ({ ref, constraints })),
  where: vi.fn((field, op, value) => ({ where: [field, op, value] })),
  orderBy: vi.fn((field, dir) => ({ orderBy: [field, dir] })),
  onSnapshot: vi.fn(),
}));
vi.mock("@/lib/firebase", () => ({ db: {} }));
vi.mock("@/hooks/useUser", () => ({
  useUser: () => ({ user: userState.user, loading: false }),
}));

const HEIST = { id: "h1", title: "Swap the stapler" };

describe("useHeists", () => {
  let next: (snapshot: unknown) => void;
  let onError: (err: unknown) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    userState.user = { uid: "me" };
    vi.mocked(onSnapshot).mockImplementation(((
      _q: unknown,
      nextCb: (s: unknown) => void,
      errorCb: (e: unknown) => void,
    ) => {
      next = nextCb;
      onError = errorCb;
      return unsubscribeSpy;
    }) as never);
  });

  it("queries heists assigned to the current user for 'active'", () => {
    renderHook(() => useHeists("active"));
    expect(where).toHaveBeenCalledWith("assignedTo", "==", "me");
    expect(where).toHaveBeenCalledWith("deadline", ">", expect.any(Date));
    expect(orderBy).toHaveBeenCalledWith("deadline", "asc");
  });

  it("queries heists created by the current user for 'assigned'", () => {
    renderHook(() => useHeists("assigned"));
    expect(where).toHaveBeenCalledWith("createdBy", "==", "me");
    expect(where).toHaveBeenCalledWith("deadline", ">", expect.any(Date));
  });

  it("queries resolved, past-deadline heists from all users for 'expired'", () => {
    renderHook(() => useHeists("expired"));
    expect(where).toHaveBeenCalledWith("deadline", "<=", expect.any(Date));
    expect(where).toHaveBeenCalledWith("finalStatus", "!=", null);
    expect(orderBy).toHaveBeenCalledWith("deadline", "desc");
    expect(where).not.toHaveBeenCalledWith(
      expect.stringMatching(/assignedTo|createdBy/),
      expect.anything(),
      expect.anything(),
    );
  });

  it("returns snapshot data and stops loading", () => {
    const { result } = renderHook(() => useHeists("active"));
    expect(result.current.loading).toBe(true);

    act(() => next({ docs: [{ data: () => HEIST }] }));
    expect(result.current).toEqual({
      heists: [HEIST],
      loading: false,
      error: null,
    });
  });

  it("exposes listener errors without throwing", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useHeists("expired"));
    const err = new Error("missing index");

    act(() => onError(err));
    expect(result.current).toEqual({ heists: [], loading: false, error: err });
  });

  it("does not subscribe for user-scoped modes without a user", () => {
    userState.user = null;
    renderHook(() => useHeists("active"));
    renderHook(() => useHeists("assigned"));
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it("unsubscribes on unmount", () => {
    const { unmount } = renderHook(() => useHeists("active"));
    unmount();
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });
});
