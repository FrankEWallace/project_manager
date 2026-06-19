"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  BarChart3,
  Wallet,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = { label: string; href: string; icon: LucideIcon };

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Timeline", href: "/timeline", icon: CalendarDays },
  { label: "Finances", href: "/finances", icon: Wallet },
  { label: "Actors", href: "/actors", icon: Users },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/** Shared nav list used by the desktop sidebar and the mobile drawer. */
export function NavLinks({
  collapsed = false,
  onNavigate,
  className,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <nav className={cn("flex-1 px-2 py-2 space-y-0.5", className)}>
      {navItems.map(({ label, href, icon: Icon }) => {
        const active = isNavActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
              collapsed ? "justify-center" : "",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
            )}
          >
            {active && !collapsed && (
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
            )}
            <Icon
              className={cn("h-4 w-4 shrink-0", active && "text-primary")}
              strokeWidth={2}
            />
            {!collapsed && label}
          </Link>
        );
      })}
    </nav>
  );
}
