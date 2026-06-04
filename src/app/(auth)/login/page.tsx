"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setPending(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Login failed");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[1fr_420px]">
      <section className="card-surface hidden rounded-3xl p-8 md:block">
        <p className="text-sm font-semibold text-blue-600">Welcome back</p>
        <h1 className="hero-title mt-2 text-4xl font-black tracking-tight">Continue your book exchange journey.</h1>
        <p className="mt-4 text-[color:var(--muted)]">
          Track transactions, chat with readers, and discover fresh books from communities you trust.
        </p>
      </section>
      <form onSubmit={onSubmit} className="card-surface space-y-4 rounded-3xl p-6 shadow-xl">
        <div>
          <h1 className="text-2xl font-black">Sign in</h1>
          <p className="text-sm text-[color:var(--muted)]">Use your BookBridge account to continue.</p>
        </div>
        <label className="block">
          <span className="text-sm font-semibold">Email</span>
          <input
            className="mt-1 block w-full rounded-xl border px-3 py-2"
            type="email" required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Password</span>
          <input
            className="mt-1 block w-full rounded-xl border px-3 py-2"
            type="password" required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-full px-3 py-3 disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-sm">
          <Link href="/reset-password" className="text-blue-700 underline">
            Forgot password?
          </Link>
        </p>
      </form>
    </div>
  );
}
