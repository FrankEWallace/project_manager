"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  BarChart3,
  Wallet,
  CalendarDays,
  Settings,
  Search,
  Plus,
  FileText,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";

/** Custom event the sidebar (or anything) can dispatch to open the palette. */
export const OPEN_COMMAND_PALETTE = "open-command-palette";

type CommandGroup = "Navigation" | "Actions" | "Recent";

type Command = {
  id: string;
  label: string;
  group: CommandGroup;
  icon: LucideIcon;
  href: string;
  /** Extra terms to match against beyond the label. */
  keywords?: string;
};

const COMMANDS: Command[] = [
  { id: "nav-dashboard", label: "Dashboard", group: "Navigation", icon: LayoutDashboard, href: "/dashboard", keywords: "home overview" },
  { id: "nav-projects", label: "Projects", group: "Navigation", icon: FolderKanban, href: "/projects", keywords: "board kanban" },
  { id: "nav-timeline", label: "Timeline", group: "Navigation", icon: CalendarDays, href: "/timeline", keywords: "schedule gantt calendar" },
  { id: "nav-finances", label: "Finances", group: "Navigation", icon: Wallet, href: "/finances", keywords: "money invoices income expense" },
  { id: "nav-actors", label: "Actors", group: "Navigation", icon: Users, href: "/actors", keywords: "people team clients contacts" },
  { id: "nav-analytics", label: "Analytics", group: "Navigation", icon: BarChart3, href: "/analytics", keywords: "reports charts metrics" },
  { id: "nav-settings", label: "Settings", group: "Navigation", icon: Settings, href: "/settings", keywords: "preferences account workspace" },
  { id: "action-new-project", label: "New project", group: "Actions", icon: Plus, href: "/projects/new", keywords: "create add" },
  { id: "action-new-invoice", label: "New invoice", group: "Actions", icon: FileText, href: "/finances/invoices/new", keywords: "create bill finances" },
];

const RECENTS_KEY = "command-palette-recents";
const MAX_RECENTS = 4;

function readRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

function pushRecent(id: string) {
  try {
    const next = [id, ...readRecents().filter((x) => x !== id)].slice(0, MAX_RECENTS);
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / serialization errors — recents are best-effort
  }
}

/** Highlights the matched substring of `text` for the given `query`. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent font-semibold text-foreground">
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  );
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Global ⌘K / Ctrl+K + custom open event.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_COMMAND_PALETTE, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_COMMAND_PALETTE, onOpenEvent);
    };
  }, []);

  // Reset transient state whenever the palette opens/closes.
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const q = query.trim().toLowerCase();

  // Flat, ordered list of the commands currently shown.
  const results = React.useMemo(() => {
    if (!q) {
      const recents = readRecents()
        .map((id) => COMMANDS.find((c) => c.id === id))
        .filter((c): c is Command => Boolean(c))
        .map((c) => ({ ...c, group: "Recent" as const }));
      return [...recents, ...COMMANDS];
    }
    return COMMANDS.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.keywords?.toLowerCase().includes(q) ?? false)
    );
  }, [q]);

  // Keep the active index in range as results change.
  React.useEffect(() => {
    setActiveIndex((i) => (results.length === 0 ? 0 : Math.min(i, results.length - 1)));
  }, [results.length]);

  // Group the flat results in display order for sectioned rendering.
  const groups = React.useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, { command: Command & { group: string }; index: number }[]>();
    results.forEach((command, index) => {
      const g = command.group;
      if (!map.has(g)) {
        map.set(g, []);
        order.push(g);
      }
      map.get(g)!.push({ command, index });
    });
    return order.map((g) => ({ label: g, items: map.get(g)! }));
  }, [results]);

  function run(command: Command) {
    pushRecent(command.id);
    setOpen(false);
    router.push(command.href);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const command = results[activeIndex];
      if (command) run(command);
    }
  }

  // Scroll the active row into view as the user navigates.
  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed left-1/2 top-[15vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-background shadow-lg duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2"
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search for a page or action, then press Enter.
          </DialogPrimitive.Description>

          {/* Search row */}
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Search pages and actions…"
              aria-label="Search pages and actions"
              className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <Kbd className="shrink-0">Esc</Kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-2">
            {results.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <p className="text-sm font-medium text-foreground">No results</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try a different search term.
                </p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.label} className="mb-1 last:mb-0">
                  <p className="px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  {group.items.map(({ command, index }) => {
                    const active = index === activeIndex;
                    const Icon = command.icon;
                    return (
                      <button
                        key={command.id}
                        type="button"
                        data-index={index}
                        onMouseMove={() => setActiveIndex(index)}
                        onClick={() => run(command)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                          active
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground hover:bg-accent/60"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                        <span className="flex-1 truncate text-foreground">
                          <Highlight text={command.label} query={query} />
                        </span>
                        {active && (
                          <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Kbd>
                <ArrowUp className="h-3 w-3" />
              </Kbd>
              <Kbd>
                <ArrowDown className="h-3 w-3" />
              </Kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <Kbd>
                <CornerDownLeft className="h-3 w-3" />
              </Kbd>
              to select
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
