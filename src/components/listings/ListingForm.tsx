"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ListingFormInitial = {
  id?: string;
  title?: string;
  author?: string;
  isbn?: string | null;
  publisher?: string | null;
  publicationYear?: number | null;
  language?: string | null;
  genre?: string;
  condition?: string;
  description?: string;
  transactionType?: string;
  askingPriceVnd?: number | null;
  communityId?: string | null;
  photos?: Array<{ url: string }>;
};

type ListingFormProps = {
  mode: "create" | "edit";
  initial?: ListingFormInitial;
  communities?: Array<{ id: string; name: string }>;
};

const CONDITIONS = ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"];
const TYPES = ["GIFT", "EXCHANGE", "SELL"];

export function ListingForm({ mode, initial, communities = [] }: ListingFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    author: initial?.author ?? "",
    isbn: initial?.isbn ?? "",
    publisher: initial?.publisher ?? "",
    publicationYear: initial?.publicationYear?.toString() ?? "",
    language: initial?.language ?? "vi",
    genre: initial?.genre ?? "",
    condition: initial?.condition ?? "GOOD",
    description: initial?.description ?? "",
    transactionType: initial?.transactionType ?? "GIFT",
    askingPriceVnd: initial?.askingPriceVnd?.toString() ?? "",
    communityId: initial?.communityId ?? "",
  });
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    initial?.photos?.map((photo) => photo.url) ?? [],
  );
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [isbnPending, setIsbnPending] = useState(false);

  async function autoFillFromIsbn() {
    if (!form.isbn.trim()) {
      setError("Enter ISBN first.");
      return;
    }
    setIsbnPending(true);
    setError(null);
    const res = await fetch(`/api/isbn/lookup?isbn=${encodeURIComponent(form.isbn)}`);
    setIsbnPending(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "ISBN lookup failed");
      return;
    }
    setForm((current) => ({
      ...current,
      isbn: body.isbn ?? current.isbn,
      title: body.title ?? current.title,
      author: body.author ?? current.author,
      publisher: body.publisher ?? current.publisher,
      publicationYear: body.publicationYear?.toString() ?? current.publicationYear,
      language: body.language ?? current.language,
      genre: body.genre ?? current.genre,
    }));
    if (body.coverUrl && photoUrls.length === 0) {
      setPhotoUrls([body.coverUrl]);
    }
    setMessage("ISBN metadata loaded. Review before saving.");
  }

  async function uploadSelectedPhotos(): Promise<string[]> {
    if (!files || files.length === 0) return [];
    const body = new FormData();
    Array.from(files).forEach((file) => body.append("photos", file));
    const res = await fetch("/api/listings/photos", { method: "POST", body });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(out.error ?? "Photo upload failed");
    }
    return (out.photos ?? []).map((photo: { url: string }) => photo.url);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const uploaded = await uploadSelectedPhotos();
      const nextPhotoUrls = uploaded.length > 0 ? uploaded : photoUrls;
      if (nextPhotoUrls.length > 5) {
        throw new Error("Listing can have at most 5 photos.");
      }
      const payload = {
        ...form,
        askingPriceVnd: form.transactionType === "SELL" ? form.askingPriceVnd : undefined,
        photoUrls: nextPhotoUrls,
      };
      const res = await fetch(mode === "create" ? "/api/listings" : `/api/listings/${initial?.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(readApiError(body, "Listing save failed"));
      }
      router.push(`/listings/${body.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Listing save failed");
    } finally {
      setPending(false);
    }
  }

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm">ISBN</span>
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            value={form.isbn}
            onChange={(e) => update("isbn", e.target.value)}
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={autoFillFromIsbn}
            disabled={isbnPending}
            className="rounded border px-3 py-2 text-sm disabled:opacity-50"
          >
            {isbnPending ? "Looking up..." : "Auto-fill from ISBN"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextInput label="Title" value={form.title} onChange={(value) => update("title", value)} required />
        <TextInput label="Author" value={form.author} onChange={(value) => update("author", value)} required />
        <TextInput label="Publisher" value={form.publisher} onChange={(value) => update("publisher", value)} />
        <TextInput label="Publication year" value={form.publicationYear} onChange={(value) => update("publicationYear", value)} />
        <TextInput label="Language" value={form.language} onChange={(value) => update("language", value)} />
        <TextInput label="Genre" value={form.genre} onChange={(value) => update("genre", value)} required />
      </div>

      <label className="block">
        <span className="text-sm">Community</span>
        <select
          className="mt-1 block w-full rounded border px-2 py-1"
          value={form.communityId}
          onChange={(e) => update("communityId", e.target.value)}
        >
          <option value="">Global listing</option>
          {communities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm">Condition</span>
          <select
            className="mt-1 block w-full rounded border px-2 py-1"
            value={form.condition}
            onChange={(e) => update("condition", e.target.value)}
          >
            {CONDITIONS.map((condition) => <option key={condition}>{condition}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm">Type</span>
          <select
            className="mt-1 block w-full rounded border px-2 py-1"
            value={form.transactionType}
            onChange={(e) => update("transactionType", e.target.value)}
          >
            {TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
      </div>

      {form.transactionType === "SELL" && (
        <TextInput
          label="Asking price VND"
          value={form.askingPriceVnd}
          onChange={(value) => update("askingPriceVnd", value)}
          required
        />
      )}

      <label className="block">
        <span className="text-sm">Description</span>
        <textarea
          className="mt-1 block w-full rounded border px-2 py-1"
          rows={6}
          required
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
        <span className="text-xs text-gray-500">20 to 2000 characters.</span>
      </label>

      <label className="block">
        <span className="text-sm">Photos</span>
        <input
          className="mt-1 block w-full rounded border px-2 py-1"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => setFiles(e.target.files)}
        />
        <span className="text-xs text-gray-500">
          Optional for demo. Upload up to 5 JPEG, PNG, or WebP files. Each file must be at most 5MB.
        </span>
      </label>

      {photoUrls.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-3">
          {photoUrls.map((url) => (
            <img key={url} src={url} alt="" className="h-32 w-full rounded object-cover" />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Saving..." : mode === "create" ? "Create listing" : "Save changes"}
      </button>
    </form>
  );
}

function readApiError(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") return fallback;
  const payload = body as { error?: unknown; details?: unknown };
  const details = collectZodErrors(payload.details);
  if (details.length > 0) return details.join(" ");
  return typeof payload.error === "string" ? payload.error : fallback;
}

function collectZodErrors(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const node = value as { _errors?: unknown };
  const ownErrors = Array.isArray(node._errors)
    ? node._errors.filter((item): item is string => typeof item === "string")
    : [];
  const childErrors = Object.entries(value)
    .filter(([key]) => key !== "_errors")
    .flatMap(([, child]) => collectZodErrors(child));
  return [...ownErrors, ...childErrors];
}

function TextInput({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm">{label}</span>
      <input
        className="mt-1 block w-full rounded border px-2 py-1"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
