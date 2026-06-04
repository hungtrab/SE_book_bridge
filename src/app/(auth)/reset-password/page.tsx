"use client";

import { useState } from "react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [devToken, setDevToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setDevToken(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Reset request failed");
      return;
    }
    setMessage(body.message ?? "If that email exists, a reset link has been sent.");
    if (body.devToken) {
      setDevToken(body.devToken);
      setToken(body.devToken);
    }
  }

  async function completeReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Password reset failed");
      return;
    }
    setMessage(body.message ?? "Password has been reset.");
  }

  return (
    <div className="mx-auto max-w-sm space-y-8">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <form onSubmit={requestReset} className="space-y-3">
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
          <button type="submit" className="w-full rounded bg-blue-600 px-3 py-2 text-white">
            Request reset
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Set new password</h2>
        {devToken && (
          <p className="rounded bg-yellow-50 p-2 text-xs text-yellow-900">
            Dev reset token: <code className="break-all">{devToken}</code>
          </p>
        )}
        <form onSubmit={completeReset} className="space-y-3">
          <label className="block">
            <span className="text-sm">Reset token</span>
            <textarea
              className="mt-1 block w-full rounded border px-2 py-1"
              required
              rows={3}
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm">New password</span>
            <input
              className="mt-1 block w-full rounded border px-2 py-1"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
          <button type="submit" className="w-full rounded bg-blue-600 px-3 py-2 text-white">
            Reset password
          </button>
        </form>
      </section>
    </div>
  );
}
