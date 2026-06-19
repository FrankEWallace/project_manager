import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommandPalette, OPEN_COMMAND_PALETTE } from "@/components/command-palette";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("CommandPalette", () => {
  beforeEach(() => {
    push.mockReset();
    window.localStorage.clear();
  });

  it("is closed until ⌘K is pressed", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);
    expect(screen.queryByPlaceholderText(/search pages and actions/i)).toBeNull();

    await user.keyboard("{Meta>}k{/Meta}");
    expect(screen.getByPlaceholderText(/search pages and actions/i)).toBeInTheDocument();
  });

  it("opens on the custom open event", () => {
    render(<CommandPalette />);
    act(() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE)));
    expect(screen.getByPlaceholderText(/search pages and actions/i)).toBeInTheDocument();
  });

  it("filters commands as you type, including keyword matches", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);
    act(() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE)));

    await user.type(screen.getByPlaceholderText(/search pages and actions/i), "invoice");
    // "New invoice" matches by label; "Finances" matches by keyword. The matched
    // substring is wrapped in a <mark>, so query by accessible button name.
    expect(screen.getByRole("button", { name: /new invoice/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /analytics/i })).toBeNull();
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);
    act(() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE)));

    await user.type(screen.getByPlaceholderText(/search pages and actions/i), "zzzzzz");
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("navigates and records a recent when a command is run", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);
    act(() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE)));

    await user.click(screen.getByText("Projects"));
    expect(push).toHaveBeenCalledWith("/projects");
    expect(window.localStorage.getItem("command-palette-recents")).toContain("nav-projects");
  });

  it("runs the active command via Enter and supports arrow navigation", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);
    act(() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE)));

    // First result is Dashboard; ArrowDown moves to Projects.
    await user.keyboard("{ArrowDown}{Enter}");
    expect(push).toHaveBeenCalledWith("/projects");
  });
});
