"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const [token, setToken] = useState(params.get("token") ?? "");
  const [email, setEmail] = useState("");
  const [devToken, setDevToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    setPending(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Verification failed");
      return;
    }
    setMessage("Email verified. You can sign in now.");
  }

  async function resend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setDevToken(null);
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Could not resend verification");
      return;
    }
    setMessage(body.message ?? "If verification is required, a new email has been sent.");
    if (body.devToken) {
      setDevToken(body.devToken);
      setToken(body.devToken);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Verify email</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <span className="text-sm">Verification token</span>
          <textarea
            className="mt-1 block w-full rounded border px-2 py-1"
            required
            rows={3}
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && (
          <p className="text-sm text-green-700">
            {message} <Link className="underline" href="/login">Sign in</Link>
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Verifying..." : "Verify"}
        </button>
      </form>
      <form onSubmit={resend} className="space-y-3 border-t pt-4">
        <h2 className="font-semibold">Resend verification</h2>
        <label className="block">
          <span className="text-sm">Email</span>
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {devToken && (
          <p className="rounded bg-yellow-50 p-2 text-xs text-yellow-900">
            Dev verification token: <code className="break-all">{devToken}</code>
          </p>
        )}
        <button type="submit" className="w-full rounded bg-gray-700 px-3 py-2 text-white">
          Resend
        </button>
      </form>
    </div>
  );
}
