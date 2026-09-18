import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// component imports
import AuthForm from "@/components/AuthForm";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
}));
vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db, collectionName, id) => ({ collectionName, id })),
  setDoc: vi.fn(),
}));
vi.mock("@/lib/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/lib/codename", () => ({
  generateCodename: () => "SneakyInternStapler",
}));

describe("AuthForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateProfile).mockResolvedValue(undefined);
    vi.mocked(setDoc).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders login fields with the correct submit label", () => {
    render(<AuthForm mode="login" />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show password" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log In" })).toBeInTheDocument();
  });

  it("renders signup fields with the correct submit label", () => {
    render(<AuthForm mode="signup" />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show password" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Hide password" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(
      screen.getByRole("button", { name: "Show password" }),
    ).toBeInTheDocument();
  });

  it("shows a success message and does not redirect on successful login", async () => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
      user: { uid: "abc123" },
    } as never);
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    expect(await screen.findByText("Login successful.")).toBeInTheDocument();
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      {},
      "user@example.com",
      "hunter2",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows an error and no success message for invalid login credentials", async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValue({
      code: "auth/invalid-credential",
    });
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    expect(
      await screen.findByText("Incorrect email or password. Please try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Login successful.")).not.toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("disables the submit button and shows a loading label while logging in", async () => {
    let resolveSignIn!: (value: { user: { uid: string } }) => void;
    vi.mocked(signInWithEmailAndPassword).mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      }) as never,
    );
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    const submitButton = screen.getByRole("button", { name: "Logging In..." });
    expect(submitButton).toBeDisabled();

    resolveSignIn({ user: { uid: "abc123" } });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
  });

  it("clears the previous error message when resubmitting the login form", async () => {
    vi.mocked(signInWithEmailAndPassword)
      .mockRejectedValueOnce({ code: "auth/invalid-credential" })
      .mockResolvedValueOnce({ user: { uid: "abc123" } } as never);
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Log In" }));
    expect(
      await screen.findByText("Incorrect email or password. Please try again."),
    ).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Password"));
    await user.type(screen.getByLabelText("Password"), "hunter2");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    expect(await screen.findByText("Login successful.")).toBeInTheDocument();
    expect(
      screen.queryByText("Incorrect email or password. Please try again."),
    ).not.toBeInTheDocument();
  });

  it("creates a Firebase account, sets a codename, and redirects on successful signup", async () => {
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
      user: { uid: "abc123" },
    } as never);
    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);

    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/heists"));

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      {},
      "new@example.com",
      "hunter2",
    );
    expect(updateProfile).toHaveBeenCalledWith(
      { uid: "abc123" },
      { displayName: "SneakyInternStapler" },
    );
    expect(doc).toHaveBeenCalledWith({}, "users", "abc123");
    expect(setDoc).toHaveBeenCalledWith(
      { collectionName: "users", id: "abc123" },
      { codename: "SneakyInternStapler", id: "abc123" },
    );
  });

  it("shows an error and does not redirect when the email is already in use", async () => {
    vi.mocked(createUserWithEmailAndPassword).mockRejectedValue({
      code: "auth/email-already-in-use",
    });
    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);

    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(
      await screen.findByText("An account with this email already exists."),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    expect(updateProfile).not.toHaveBeenCalled();
    expect(setDoc).not.toHaveBeenCalled();
  });

  it("shows a weak-password-specific error message", async () => {
    vi.mocked(createUserWithEmailAndPassword).mockRejectedValue({
      code: "auth/weak-password",
    });
    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);

    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "a");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(
      await screen.findByText(
        "Password is too weak. Please use at least 6 characters.",
      ),
    ).toBeInTheDocument();
  });

  it("disables the submit button and shows a loading label while signing up", async () => {
    let resolveCreate!: (value: { user: { uid: string } }) => void;
    vi.mocked(createUserWithEmailAndPassword).mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }) as never,
    );
    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);

    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    const submitButton = screen.getByRole("button", { name: "Signing Up..." });
    expect(submitButton).toBeDisabled();

    resolveCreate({ user: { uid: "abc123" } });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/heists"));
  });

  it("still redirects and logs an error if updating the profile or Firestore doc fails after account creation", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
      user: { uid: "abc123" },
    } as never);
    vi.mocked(updateProfile).mockRejectedValue(new Error("network error"));
    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);

    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter2");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/heists"));
    expect(errorSpy).toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("links to the signup form from login", () => {
    render(<AuthForm mode="login" />);

    const link = screen.getByRole("link", { name: /sign up/i });
    expect(link).toHaveAttribute("href", "/signup");
  });

  it("links to the login form from signup", () => {
    render(<AuthForm mode="signup" />);

    const link = screen.getByRole("link", { name: /log in/i });
    expect(link).toHaveAttribute("href", "/login");
  });
});
