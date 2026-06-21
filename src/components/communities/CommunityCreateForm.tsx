"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CommunityCreateForm({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", scope: "UNIVERSITY", description: "", isPrivate: false });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/communities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setPending(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Could not create community");
      return;
    }
    router.push(`/communities/${body.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className={embedded ? "space-y-3" : "card-surface space-y-3 rounded-2xl p-4"}>
      <h2 className="font-semibold">Create community</h2>
      <input
        required
        className="field"
        placeholder="Community name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <select
        className="field"
        value={form.scope}
        onChange={(e) => setForm({ ...form, scope: e.target.value })}
      >
        <option value="UNIVERSITY">University</option>
        <option value="LOCATION">Location</option>
        <option value="GENRE">Genre</option>
      </select>
      <textarea
        className="field"
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isPrivate}
          onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
        />
        Private community (join by invite code only)
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={pending} className="btn-primary w-full">
        {pending ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
