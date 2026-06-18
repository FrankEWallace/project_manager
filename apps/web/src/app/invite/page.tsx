"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { setWorkspaceId } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle, XCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface InviteInfo {
  email: string;
  role: string;
  workspaceName: string;
  expiresAt: string;
}

function InvitePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const { data: session, isPending: sessionLoading } = useSession();

  const [invite, setInvite] = React.useState<InviteInfo | null>(null);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [accepting, setAccepting] = React.useState(false);
  const [accepted, setAccepted] = React.useState(false);
  const [acceptError, setAcceptError] = React.useState<string | null>(null);

  // Load invite info (public endpoint — no auth headers)
  React.useEffect(() => {
    if (!token) { setFetchError("No invite token provided."); return; }
    fetch(`${API_URL}/api/invitations/accept?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Invalid invite");
        setInvite(body.data);
      })
      .catch((e) => setFetchError(e.message));
  }, [token]);

  async function handleAccept() {
    if (!token || !session?.session?.token) return;
    setAccepting(true);
    setAcceptError(null);
    try {
      const res = await fetch(`${API_URL}/api/invitations/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session.token}`,
        },
        body: JSON.stringify({ token }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to accept invite");
      setWorkspaceId(body.data.workspaceId);
      setAccepted(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (e) {
      setAcceptError(e instanceof Error ? e.message : "Failed to accept invite");
    } finally {
      setAccepting(false);
    }
  }

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (!token || sessionLoading || (!invite && !fetchError)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Invalid / expired token ─────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invite unavailable</CardTitle>
            <CardDescription>{fetchError}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ─── Accepted ────────────────────────────────────────────────────────────
  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>You&apos;re in!</CardTitle>
            <CardDescription>Redirecting to your dashboard…</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ─── Main invite card ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">You&apos;ve been invited</CardTitle>
          <CardDescription>
            Join <strong className="text-foreground">{invite!.workspaceName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Workspace</span>
            <span className="text-sm font-medium">{invite!.workspaceName}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Invited email</span>
            <span className="text-sm font-medium">{invite!.email}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Role</span>
            <Badge variant="secondary">{invite!.role}</Badge>
          </div>
          {acceptError && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">{acceptError}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {session?.user ? (
            <>
              <p className="text-xs text-muted-foreground text-center">
                Accepting as <strong>{session.user.email}</strong>
              </p>
              <Button className="w-full" onClick={handleAccept} disabled={accepting}>
                {accepting ? "Accepting…" : "Accept invitation"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground text-center">
                Sign in with <strong>{invite!.email}</strong> to accept.
              </p>
              <Button className="w-full" asChild>
                <Link href={`/sign-in?next=/invite?token=${encodeURIComponent(token!)}`}>
                  Sign in to accept
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/sign-up?next=/invite?token=${encodeURIComponent(token!)}`}>
                  Create account
                </Link>
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function InvitePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <InvitePageInner />
    </React.Suspense>
  );
}
