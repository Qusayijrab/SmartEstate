"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"buyer" | "seller" | "investor">("buyer");
  const [busy, setBusy] = useState(false);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setIssues({});
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName, email, password, role }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setIssues(json.issues || {});
        setError(json.message || "Could not create account.");
        toast(json.message || "Could not create account.", "error");
        return;
      }
      toast("Account created. Welcome to SmartEstate.", "success");
      router.refresh();
      router.push("/dashboard");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-[34px] tracking-tight">Create your account</h2>
        <p className="mt-2 text-sm text-white/60">
          Save listings, post properties, and unlock AI insights tuned for the
          Jordanian market.
        </p>
      </div>

      <Input
        label="Full name"
        autoComplete="name"
        required
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Layla Al-Hashimi"
        error={issues.fullName}
        onDark
      />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        error={issues.email}
        onDark
      />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
        error={issues.password}
        onDark
      />
      <Select
        label="I am a"
        value={role}
        onChange={(e) =>
          setRole(e.target.value as "buyer" | "seller" | "investor")
        }
        options={[
          { value: "buyer", label: "Buyer" },
          { value: "seller", label: "Seller" },
          { value: "investor", label: "Investor" },
        ]}
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
        {busy ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-sm text-white/65">
        Already have one?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--gold)] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
