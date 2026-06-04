import { BadRequestError, NotFoundError } from "../lib/errors";
import { normalizeListingGenre } from "@/lib/listing-genres";
import { IsbnSchema } from "./validation";

type OpenLibraryBook = {
  title?: string;
  authors?: Array<{ key?: string; name?: string }>;
  publishers?: string[];
  publish_date?: string;
  languages?: Array<{ key?: string }>;
  subjects?: string[];
  covers?: number[];
};

type OpenLibraryAuthor = {
  name?: string;
};

export type IsbnLookupResult = {
  isbn: string;
  title: string;
  author?: string;
  publisher?: string;
  publicationYear?: number;
  language?: string;
  genre?: string;
  coverUrl?: string;
};

export async function lookupIsbn(rawIsbn: string): Promise<IsbnLookupResult> {
  const parsed = IsbnSchema.safeParse(rawIsbn);
  if (!parsed.success) throw new BadRequestError("Invalid ISBN");

  const isbn = parsed.data;
  const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`, {
    headers: { accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 },
  });
  if (res.status === 404) throw new NotFoundError("ISBN not found");
  if (!res.ok) throw new BadRequestError("ISBN lookup failed");

  const book = await res.json() as OpenLibraryBook;
  if (!book.title) throw new NotFoundError("ISBN not found");

  const author = await resolveFirstAuthor(book);
  return {
    isbn,
    title: book.title,
    author,
    publisher: book.publishers?.[0],
    publicationYear: parsePublicationYear(book.publish_date),
    language: book.languages?.[0]?.key?.split("/").pop(),
    genre: normalizeSubjectGenre(book.subjects),
    coverUrl: book.covers?.[0] ? `https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg` : undefined,
  };
}

function normalizeSubjectGenre(subjects?: string[]) {
  for (const subject of subjects ?? []) {
    const genre = normalizeListingGenre(subject);
    if (genre) return genre;
  }
  return undefined;
}

async function resolveFirstAuthor(book: OpenLibraryBook): Promise<string | undefined> {
  const first = book.authors?.[0];
  if (!first) return undefined;
  if (first.name) return first.name;
  if (!first.key) return undefined;

  const res = await fetch(`https://openlibrary.org${first.key}.json`, {
    headers: { accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 },
  }).catch(() => null);
  if (!res?.ok) return undefined;
  const author = await res.json() as OpenLibraryAuthor;
  return author.name;
}

function parsePublicationYear(value?: string): number | undefined {
  const match = value?.match(/\b(1[5-9]\d{2}|20\d{2}|2100)\b/);
  return match ? Number(match[1]) : undefined;
}
