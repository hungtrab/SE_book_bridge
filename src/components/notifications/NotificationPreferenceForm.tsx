"use client";

import { useState } from "react";

type Preference = "IMMEDIATE" | "DAILY" | "OFF";

export function NotificationPreferenceForm({ initial }: { initial: Preference }) {
  const [value, setValue] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save(next: Preference) {
    setValue(next);
    setPending(true);
    setMessage(null);
    const res = await fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailPreference: next }),
    });
    setPending(false);
    setMessage(res.ok ? "Email preference saved." : "Could not save preference.");
  }

  return (
    <section className="rounded border p-4">
      <h2 className="font-semibold">Email delivery</h2>
      <p className="mb-2 text-sm text-gray-600">In-app notifications remain available for every option.</p>
      <select
        value={value}
        disabled={pending}
        onChange={(event) => save(event.target.value as Preference)}
        className="rounded border px-2 py-1"
      >
        <option value="IMMEDIATE">Immediate email</option>
        <option value="DAILY">Daily digest</option>
        <option value="OFF">No notification email</option>
      </select>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </section>
  );
}
