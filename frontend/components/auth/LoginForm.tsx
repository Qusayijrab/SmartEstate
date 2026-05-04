"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.message || "Login failed.");
        toast(json.message || "Login failed.", "error");
        return;
      }
      toast(json.message || "Welcome back.", "success");
      router.refresh();
      router.push(next);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-[34px] tracking-tight">Welcome back</h2>
        <p className="mt-2 text-sm text-white/60">
          Sign in to manage your listings, favourites, and AI evaluations.
        </p>
      </div>

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        onDark
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        onDark
      />

      {error ? (
        <div
          className="rounded-xl border border-[rgba(255,107,107,0.32)] bg-[rgba(255,107,107,0.12)] p-3 text-sm text-[#ff8a8a]"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <Button type="submit" disabled={busy} aria-busy={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link
          href="/forgot-password"
          className="text-white/65 underline-offset-4 hover:text-white hover:underline"
        >
          Forgot password?
        </Link>
        <span className="text-white/65">
          New here?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[var(--gold)] hover:underline"
          >
            Create an account
          </Link>
        </span>
      </div>
    </form>
  );
}
