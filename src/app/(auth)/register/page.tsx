"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    setDevToken(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, displayName, password }),
    });
    setPending(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Registration failed");
      return;
    }
    setMessage(body.message ?? "Account created. Check your email.");
    if (body.devToken) setDevToken(body.devToken);
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[1fr_420px]">
      <section className="card-surface hidden rounded-3xl p-8 md:block">
        <p className="text-sm font-semibold text-blue-600">Join BookBridge</p>
        <h1 className="hero-title mt-2 text-4xl font-black tracking-tight">Turn unused books into community value.</h1>
        <p className="mt-4 text-[color:var(--muted)]">
          Create listings, follow trusted readers, and build reputation with every completed exchange.
        </p>
      </section>
      <form onSubmit={onSubmit} className="card-surface space-y-4 rounded-3xl p-6 shadow-xl">
        <div>
          <h1 className="text-2xl font-black">Create account</h1>
          <p className="text-sm text-[color:var(--muted)]">Start sharing books with your community.</p>
        </div>
        <label className="block">
          <span className="text-sm font-semibold">Display name</span>
          <input
            className="mt-1 block w-full rounded-xl border px-3 py-2"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Email</span>
          <input
            className="mt-1 block w-full rounded-xl border px-3 py-2"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Password</span>
          <input
            className="mt-1 block w-full rounded-xl border px-3 py-2"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <p className="text-xs text-gray-600">
          At least 8 characters with uppercase, lowercase and a digit.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}
        {devToken && (
          <p className="rounded bg-yellow-50 p-2 text-xs text-yellow-900">
            Dev verification token: <code className="break-all">{devToken}</code>
            <br />
            <Link className="underline" href={`/verify-email?token=${devToken}`}>
              Open verification page
            </Link>
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-full px-3 py-3 disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create account"}
        </button>
      </form>
    </div>
  );
}
