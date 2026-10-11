import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { doc, onSnapshot } from "firebase/firestore";

// hook imports
import { useHeist } from "@/hooks/useHeist";

const { unsubscribeSpy } = vi.hoisted(() => ({ unsubscribeSpy: vi.fn() }));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db, collection, id) => ({
    withConverter: () => ({ collection, id }),
  })),
  onSnapshot: vi.fn(),
}));
vi.mock("@/lib/firebase", () => ({ db: {} }));

const HEIST = { id: "h1", title: "Swap the stapler" };

describe("useHeist", () => {
  let next: (snapshot: unknown) => void;
  let onError: (err: unknown) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(onSnapshot).mockImplementation(((
      _ref: unknown,
      nextCb: (s: unknown) => void,
      errorCb: (e: unknown) => void,
    ) => {
      next = nextCb;
      onError = errorCb;
      return unsubscribeSpy;
    }) as never);
  });

  it("subscribes to the heist document with the given id", () => {
    renderHook(() => useHeist("h1"));
    expect(doc).toHaveBeenCalledWith({}, "heists", "h1");
    expect(onSnapshot).toHaveBeenCalledWith(
      { collection: "heists", id: "h1" },
      expect.any(Function),
      expect.any(Function),
    );
  });

  it("returns the heist and stops loading", () => {
    const { result } = renderHook(() => useHeist("h1"));
    expect(result.current.loading).toBe(true);

    act(() => next({ exists: () => true, data: () => HEIST }));
    expect(result.current).toEqual({
      heist: HEIST,
      loading: false,
      error: null,
    });
  });

  it("returns null when the heist doesn't exist", () => {
    const { result } = renderHook(() => useHeist("missing"));

    act(() => next({ exists: () => false, data: () => undefined }));
    expect(result.current).toEqual({ heist: null, loading: false, error: null });
  });

  it("exposes listener errors without throwing", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useHeist("h1"));
    const err = new Error("permission denied");

    act(() => onError(err));
    expect(result.current).toEqual({ heist: null, loading: false, error: err });
  });

  it("unsubscribes on unmount", () => {
    const { unmount } = renderHook(() => useHeist("h1"));
    unmount();
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });
});
