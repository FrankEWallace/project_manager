"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, Settings, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/avatar";
import { NavLinks } from "@/components/nav";
import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

/**
 * Mobile-only app chrome: a sticky top bar with a hamburger that opens a
 * left slide-out drawer. Hidden at md and up (the desktop Sidebar takes over).
 */
export function MobileNav() {
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = React.useState(false);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/sign-in");
  }

  return (
    <header className="md:hidden sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-muted/30 shadow-xl outline-none",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-200"
            )}
          >
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>

            {/* Identity (top, establishes ownership) */}
            <div className="flex items-center gap-3 px-4 pt-5 pb-4">
              <UserAvatar
                name={session?.user?.name}
                email={session?.user?.email}
                src={session?.user?.image}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {session?.user?.name ?? "Loading…"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
              <Dialog.Close asChild>
                <button
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <NavLinks onNavigate={() => setOpen(false)} />

            <div className="space-y-0.5 px-2 pb-4">
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
              >
                <Settings className="h-4 w-4 shrink-0" />
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Sign out
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
        <Image src="/logo.jpg" alt="Logo" width={26} height={26} className="rounded-md shrink-0" />
        <span className="truncate text-sm font-semibold tracking-tight text-foreground">
          Project Manager
        </span>
      </Link>

      <div className="ml-auto">
        <UserAvatar
          name={session?.user?.name}
          email={session?.user?.email}
          src={session?.user?.image}
          size="sm"
        />
      </div>
    </header>
  );
}
