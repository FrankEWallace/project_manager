"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/avatar";
import { NavLinks } from "@/components/nav";
import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function Sidebar({ className }: { className?: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", String(!prev));
      return !prev;
    });
  }

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  return (
    <aside
      className={cn(
        "flex flex-col bg-muted/30 h-screen sticky top-0 transition-all duration-200 overflow-hidden border-r border-border/40",
        collapsed ? "w-14" : "w-60",
        className
      )}
    >
      {/* Header */}
      <div className="px-3 pt-5 pb-4 flex items-center gap-3 min-w-0">
        <Image
          src="/logo.jpg"
          alt="Logo"
          width={32}
          height={32}
          className="rounded-md shrink-0"
        />
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="font-semibold text-foreground text-sm tracking-tight truncate">
              Project Manager
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Operational platform</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <NavLinks collapsed={collapsed} />

      {/* Bottom actions */}
      <div className="px-2 pb-2 space-y-0.5">
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-background/60 hover:text-foreground transition-colors",
            collapsed ? "justify-center" : ""
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && "Settings"}
        </Link>
        <button
          onClick={handleSignOut}
          title={collapsed ? "Sign out" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-background/60 hover:text-foreground transition-colors",
            collapsed ? "justify-center" : ""
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && "Sign out"}
        </button>
      </div>

      {/* User + collapse toggle */}
      <div
        className={cn(
          "mx-2 mb-3 px-2 py-3 rounded-xl bg-background/60 flex items-center gap-3 min-w-0",
          collapsed ? "flex-col" : ""
        )}
      >
        <UserAvatar
          name={session?.user?.name}
          email={session?.user?.email}
          src={session?.user?.image}
          size="md"
        />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {session?.user?.name ?? "Loading…"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
          </div>
        )}
        <button
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="shrink-0 p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
