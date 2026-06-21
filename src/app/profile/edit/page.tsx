"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Me = {
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  preferredGenres: string[];
  locationDistrict: string | null;
};

export default function EditProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<Me>({
    displayName: "",
    avatarUrl: "",
    bio: "",
    preferredGenres: [],
    locationDistrict: "",
  });
  const [genresText, setGenresText] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => {
        if (!res.ok) throw new Error("Please sign in first");
        return res.json();
      })
      .then((data) => {
        setForm({
          displayName: data.displayName ?? "",
          avatarUrl: data.avatarUrl ?? "",
          bio: data.bio ?? "",
          preferredGenres: data.preferredGenres ?? [],
          locationDistrict: data.locationDistrict ?? "",
        });
        setGenresText((data.preferredGenres ?? []).join(", "));
      })
      .catch((err) => setError(err.message));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    let avatarUrl = form.avatarUrl || null;
    if (avatarFile) {
      const upload = new FormData();
      upload.append("avatar", avatarFile);
      const uploadRes = await fetch("/api/users/me/avatar", { method: "POST", body: upload });
      const uploadBody = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) {
        setPending(false);
        setError(uploadBody.error ?? "Avatar upload failed");
        return;
      }
      avatarUrl = uploadBody.url;
    }
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        avatarUrl,
        bio: form.bio || null,
        locationDistrict: form.locationDistrict || null,
        preferredGenres: genresText
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      }),
    });
    setPending(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Profile update failed");
      return;
    }
    router.push(`/profile/${body.id}`);
    router.refresh();
  }

  async function changeAccountPassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordPending(true);
    setPasswordError(null);
    setPasswordMessage(null);
    const res = await fetch("/api/auth/change-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passwordForm),
    });
    setPasswordPending(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPasswordError(body.error ?? "Password change failed");
      return;
    }
    setPasswordForm({ currentPassword: "", newPassword: "" });
    setPasswordMessage(body.message ?? "Password changed.");
  }

  async function deleteAccount() {
    if (deleteConfirm !== "DELETE") {
      setError("Type DELETE to confirm account deletion.");
      return;
    }
    const res = await fetch("/api/users/me", { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Account deletion failed");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="text-2xl font-bold">Edit profile</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <span className="text-sm">Display name</span>
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            required
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-sm">Profile picture</span>
          <div className="mt-2 flex items-center gap-4">
            <span className="grid size-20 place-items-center overflow-hidden rounded-full bg-blue-600 text-lg font-black text-white">
              {(avatarFile || form.avatarUrl) ? (
                <img
                  src={avatarFile ? URL.createObjectURL(avatarFile) : form.avatarUrl ?? ""}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : form.displayName.slice(0, 2).toUpperCase()}
            </span>
            <input
              className="field"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <span className="mt-1 block text-xs text-gray-500">JPEG, PNG, or WebP up to 5MB.</span>
        </label>
        <label className="block">
          <span className="text-sm">Bio</span>
          <textarea
            className="mt-1 block w-full rounded border px-2 py-1"
            rows={4}
            value={form.bio ?? ""}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-sm">Preferred genres</span>
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            placeholder="fiction, textbook, non-fiction"
            value={genresText}
            onChange={(e) => setGenresText(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm">District</span>
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            value={form.locationDistrict ?? ""}
            onChange={(e) => setForm({ ...form, locationDistrict: e.target.value })}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save profile"}
        </button>
      </form>
      <section className="space-y-3 rounded border p-4">
        <h2 className="font-semibold">Change password</h2>
        <form onSubmit={changeAccountPassword} className="space-y-3">
          <label className="block">
            <span className="text-sm">Current password</span>
            <input
              className="mt-1 block w-full rounded border px-2 py-1"
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({
                ...passwordForm,
                currentPassword: e.target.value,
              })}
            />
          </label>
          <label className="block">
            <span className="text-sm">New password</span>
            <input
              className="mt-1 block w-full rounded border px-2 py-1"
              type="password"
              required
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({
                ...passwordForm,
                newPassword: e.target.value,
              })}
            />
            <span className="text-xs text-gray-500">
              Minimum 8 characters, with uppercase, lowercase, and digit.
            </span>
          </label>
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          {passwordMessage && <p className="text-sm text-green-700">{passwordMessage}</p>}
          <button
            type="submit"
            disabled={passwordPending}
            className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
          >
            {passwordPending ? "Changing..." : "Change password"}
          </button>
        </form>
      </section>
      <section className="space-y-3 rounded border border-red-200 p-4">
        <h2 className="font-semibold text-red-700">Danger zone</h2>
        <p className="text-sm text-gray-600">
          Delete anonymises your account but keeps transaction history for audit.
        </p>
        <input
          className="block w-full rounded border px-2 py-1"
          placeholder="Type DELETE"
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
        />
        <button
          type="button"
          onClick={deleteAccount}
          className="rounded bg-red-600 px-3 py-2 text-white"
        >
          Delete account
        </button>
      </section>
    </div>
  );
}
