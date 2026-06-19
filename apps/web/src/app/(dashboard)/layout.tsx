"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { getWorkspaceId, setWorkspaceId } from "@/lib/workspace";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { CommandPalette } from "@/components/command-palette";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/sign-in");
    }
  }, [session, isPending, router]);

  // Bootstrap workspaceId into localStorage if missing
  useEffect(() => {
    if (!session?.session?.token) return;
    if (getWorkspaceId()) return;
    fetch(`${API_URL}/api/workspaces/me`, {
      headers: { Authorization: `Bearer ${session.session.token}` },
    })
      .then((r) => r.json())
      .then((body) => {
        const memberships = body?.data as { workspaceId: string }[] | undefined;
        if (memberships?.[0]?.workspaceId) {
          setWorkspaceId(memberships[0].workspaceId);
          // force re-render so hooks pick up the new value
          router.refresh();
        }
      })
      .catch(() => {});
  }, [session?.session?.token, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar className="hidden md:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
