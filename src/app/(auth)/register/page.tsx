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
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Create account</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <span className="text-sm">Display name</span>
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>
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
        <label className="block">
          <span className="text-sm">Password</span>
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
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
          className="w-full rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create account"}
        </button>
      </form>
    </div>
  );
}
