"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      setMessage(json.message);
      setStatus("sent");
    } catch {
      setMessage("Could not reach the server. Please try again later.");
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-[34px] tracking-tight">Forgot password?</h2>
        <p className="mt-2 text-sm text-white/60">
          Tell us the email on your account and we’ll send reset instructions.
        </p>
      </div>

      <Input
        label="Email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        onDark
      />

      {message ? (
        <div
          className="rounded-xl border border-[rgba(71,209,140,0.3)] bg-[rgba(71,209,140,0.1)] p-3 text-sm text-[#9ce8c0]"
          role="status"
        >
          {message}
        </div>
      ) : null}

      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send reset instructions"}
      </Button>

      <p className="text-sm text-white/65">
        Back to{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--gold)] hover:underline"
        >
          sign in
        </Link>
      </p>
    </form>
  );
}
