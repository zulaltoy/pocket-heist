import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { addDoc, getDocs } from "firebase/firestore";

// component imports
import CreateHeistForm from "@/components/CreateHeistForm";
import { HEIST_DURATION_MS } from "@/types/firestore";

const { pushMock, SERVER_TIMESTAMP } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  SERVER_TIMESTAMP: { __serverTimestamp: true },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_db, name) => ({ name })),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: () => SERVER_TIMESTAMP,
}));
vi.mock("@/lib/firebase", () => ({ db: {} }));
vi.mock("@/hooks/useUser", () => ({
  useUser: () => ({
    user: { uid: "me", email: "me@example.com", displayName: "MeCodename" },
    loading: false,
  }),
}));

function mockUsers(users: { id: string; codename: string }[]) {
  vi.mocked(getDocs).mockResolvedValue({
    docs: users.map((u) => ({ id: u.id, data: () => u })),
  } as never);
}

const USERS = [
  { id: "me", codename: "SneakyInternStapler" },
  { id: "u1", codename: "DaringCourierBinder" },
  { id: "u2", codename: "SilentAuditorThermos" },
];

async function fillForm(title: string, description: string, assigneeId = "u1") {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Title"), title);
  await user.type(screen.getByLabelText("Description"), description);
  await user.selectOptions(screen.getByLabelText("Assign To"), assigneeId);
  return user;
}

describe("CreateHeistForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsers(USERS);
    vi.mocked(addDoc).mockResolvedValue({ id: "heist1" } as never);
  });

  it("renders fields and lists other users, excluding the current user", async () => {
    render(<CreateHeistForm />);

    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "DaringCourierBinder" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "SilentAuditorThermos" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "SneakyInternStapler" }),
    ).not.toBeInTheDocument();
  });

  it("creates the heist with the expected fields and redirects", async () => {
    render(<CreateHeistForm />);
    await screen.findByLabelText("Title");

    const user = await fillForm("  Steal the stapler  ", "  From accounting  ");
    const before = Date.now();
    await user.click(screen.getByRole("button", { name: "Create Heist" }));
    const after = Date.now();

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/heists"));
    expect(addDoc).toHaveBeenCalledTimes(1);

    const [ref, payload] = vi.mocked(addDoc).mock.calls[0];
    expect(ref).toEqual({ name: "heists" });
    expect(payload).toMatchObject({
      createdAt: SERVER_TIMESTAMP,
      title: "Steal the stapler",
      description: "From accounting",
      createdBy: "me",
      createdByCodename: "SneakyInternStapler",
      assignedTo: "u1",
      assignedToCodename: "DaringCourierBinder",
      finalStatus: null,
    });
    const deadline = (payload as { deadline: Date }).deadline.getTime();
    expect(deadline).toBeGreaterThanOrEqual(before + HEIST_DURATION_MS);
    expect(deadline).toBeLessThanOrEqual(after + HEIST_DURATION_MS);
  });

  it("does not create a heist when fields are only whitespace", async () => {
    render(<CreateHeistForm />);
    await screen.findByLabelText("Title");

    const user = await fillForm("   ", "   ");
    await user.click(screen.getByRole("button", { name: "Create Heist" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please fill in all fields.",
    );
    expect(addDoc).not.toHaveBeenCalled();
  });

  it("does not create a heist when no assignee is selected", async () => {
    const user = userEvent.setup();
    render(<CreateHeistForm />);

    await user.type(await screen.findByLabelText("Title"), "Title");
    await user.type(screen.getByLabelText("Description"), "Description");
    await user.click(screen.getByRole("button", { name: "Create Heist" }));

    expect(addDoc).not.toHaveBeenCalled();
  });

  it("disables the submit button while the heist is being created", async () => {
    vi.mocked(addDoc).mockReturnValue(new Promise(() => {}));
    render(<CreateHeistForm />);
    await screen.findByLabelText("Title");

    const user = await fillForm("Title", "Description");
    await user.click(screen.getByRole("button", { name: "Create Heist" }));

    const button = await screen.findByRole("button", { name: "Creating..." });
    expect(button).toBeDisabled();
  });

  it("shows an error and does not redirect when creation fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(addDoc).mockRejectedValue(new Error("permission-denied"));
    render(<CreateHeistForm />);
    await screen.findByLabelText("Title");

    const user = await fillForm("Title", "Description");
    await user.click(screen.getByRole("button", { name: "Create Heist" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not create the heist.",
    );
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Title")).toHaveValue("Title");
  });

  it("shows a message instead of the form when there are no other users", async () => {
    mockUsers([{ id: "me", codename: "SneakyInternStapler" }]);
    render(<CreateHeistForm />);

    expect(
      await screen.findByText("No other agents to assign a heist to yet."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
  });
});
