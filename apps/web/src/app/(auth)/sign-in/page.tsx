"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn.email({ email, password });
    if (result.error) {
      setError(result.error.message ?? "Sign in failed");
      setLoading(false);
      return;
    }
    router.push(next);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg">{error}</p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="h-10"
          />
        </div>
        <Button type="submit" className="w-full h-10" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center">
        No account?{" "}
        <Link href="/sign-up" className="text-foreground font-medium hover:underline">
          Create one free
        </Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
