import { prisma } from "../lib/prisma";

const COMMUNITY_NAME = process.env.BULLETIN_COMMUNITY_NAME ?? "Book News & Discoveries";
const AUTHOR_EMAIL = process.env.BULLETIN_AUTHOR_EMAIL ?? "admin@bookbridge.local";
const MAX_PER_SOURCE = 8;

type Bulletin = {
  sourceName: string;
  externalId: string;
  sourceUrl: string;
  title: string;
  summary: string;
  imageUrl?: string;
  publishedAt?: Date;
};

export async function runDailyBulletinImport() {
  const [openLibrary, libraryOfCongress, nyt] = await Promise.allSettled([
    fetchOpenLibraryTrending(),
    fetchLibraryOfCongressFeeds(),
    fetchNewYorkTimesBestSellers(),
  ]);
  const items = [
    ...(openLibrary.status === "fulfilled" ? openLibrary.value : []),
    ...(libraryOfCongress.status === "fulfilled" ? libraryOfCongress.value : []),
    ...(nyt.status === "fulfilled" ? nyt.value : []),
  ];

  const [community, author] = await Promise.all([
    prisma.community.findUnique({ where: { name: COMMUNITY_NAME } }),
    prisma.user.findUnique({ where: { email: AUTHOR_EMAIL } }),
  ]);
  if (!community) throw new Error(`Bulletin community "${COMMUNITY_NAME}" does not exist`);
  if (!author) throw new Error(`Bulletin author "${AUTHOR_EMAIL}" does not exist`);

  let created = 0;
  let skipped = 0;
  for (const item of items) {
    const existing = await prisma.communityPost.findUnique({
      where: { sourceName_externalId: { sourceName: item.sourceName, externalId: item.externalId } },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }
    await prisma.communityPost.create({
      data: {
        communityId: community.id,
        authorId: author.id,
        kind: "BULLETIN",
        title: item.title.slice(0, 200),
        body: item.summary.slice(0, 5000),
        imageUrl: item.imageUrl,
        sourceName: item.sourceName,
        sourceUrl: item.sourceUrl,
        externalId: item.externalId,
        publishedAt: item.publishedAt,
      },
    });
    created += 1;
  }
  return {
    fetched: items.length,
    created,
    skipped,
    sources: {
      openLibrary: resultCount(openLibrary),
      libraryOfCongress: resultCount(libraryOfCongress),
      newYorkTimes: resultCount(nyt),
    },
  };
}

export async function listBulletins() {
  return prisma.communityPost.findMany({
    where: { kind: "BULLETIN" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 30,
    include: {
      community: { select: { id: true, name: true } },
      author: { select: { id: true, displayName: true, avatarUrl: true } },
      likes: { select: { userId: true, reaction: true } },
      comments: {
        where: { parentId: null },
        take: 10,
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, displayName: true, avatarUrl: true } },
          reactions: { select: { userId: true, reaction: true } },
          replies: {
            take: 5,
            orderBy: { createdAt: "asc" },
            include: {
              author: { select: { id: true, displayName: true, avatarUrl: true } },
              reactions: { select: { userId: true, reaction: true } },
            },
          },
        },
      },
    },
  });
}

async function fetchOpenLibraryTrending(): Promise<Bulletin[]> {
  const response = await fetch("https://openlibrary.org/trending/daily.json?limit=12", {
    headers: { "User-Agent": "BookBridge/1.0 (community book discovery)" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Open Library returned ${response.status}`);
  const body = await response.json() as { works?: Array<Record<string, unknown>> };
  return (body.works ?? []).slice(0, MAX_PER_SOURCE).flatMap((work) => {
    const key = text(work.key);
    const title = text(work.title);
    if (!key || !title) return [];
    const authors = Array.isArray(work.author_name) ? work.author_name.filter((value): value is string => typeof value === "string") : [];
    const coverId = typeof work.cover_i === "number" ? work.cover_i : undefined;
    const editions = typeof work.edition_count === "number" ? work.edition_count : undefined;
    return [{
      sourceName: "Open Library",
      externalId: key,
      sourceUrl: `https://openlibrary.org${key}`,
      title: `Trending today: ${title}`,
      summary: `${title}${authors.length ? ` by ${authors.join(", ")}` : ""} is trending among Open Library readers today.${editions ? ` Open Library lists ${editions} editions.` : ""} Discuss whether it belongs on your reading list or whether someone in the community has a copy to share.`,
      imageUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : undefined,
      publishedAt: new Date(),
    }];
  });
}

async function fetchLibraryOfCongressFeeds(): Promise<Bulletin[]> {
  const feeds = [
    ["Library of Congress — Bookmarked", "https://blogs.loc.gov/bookmarked/feed/"],
    ["Library of Congress — Bibliomania", "https://blogs.loc.gov/bibliomania/feed/"],
  ] as const;
  const batches = await Promise.all(feeds.map(async ([name, url]) => {
    const response = await fetch(url, { headers: { "User-Agent": "BookBridge/1.0" }, cache: "no-store" });
    if (!response.ok) throw new Error(`${name} returned ${response.status}`);
    return parseRss(await response.text(), name);
  }));
  return batches.flat().slice(0, MAX_PER_SOURCE);
}

async function fetchNewYorkTimesBestSellers(): Promise<Bulletin[]> {
  const key = process.env.NYT_BOOKS_API_KEY;
  if (!key) return [];
  const response = await fetch(`https://api.nytimes.com/svc/books/v3/lists/current/hardcover-fiction.json?api-key=${encodeURIComponent(key)}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`New York Times Books API returned ${response.status}`);
  const body = await response.json() as { results?: { books?: Array<Record<string, unknown>> } };
  return (body.results?.books ?? []).slice(0, MAX_PER_SOURCE).flatMap((book) => {
    const isbn = text(book.primary_isbn13) ?? text(book.primary_isbn10);
    const title = text(book.title);
    const url = text(book.amazon_product_url);
    if (!isbn || !title || !url) return [];
    const author = text(book.author);
    const description = text(book.description);
    return [{
      sourceName: "The New York Times Best Sellers",
      externalId: isbn,
      sourceUrl: url,
      title: `Best seller: ${title}`,
      summary: `${title}${author ? ` by ${author}` : ""}.${description ? ` ${description}` : ""}`,
      imageUrl: text(book.book_image),
      publishedAt: new Date(),
    }];
  });
}

export function parseRss(xml: string, sourceName: string): Bulletin[] {
  return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].slice(0, MAX_PER_SOURCE).flatMap((match) => {
    const item = match[1];
    const title = decodeXml(tag(item, "title"));
    const url = decodeXml(tag(item, "link"));
    const guid = decodeXml(tag(item, "guid")) || url;
    if (!title || !url || !guid) return [];
    const description = stripHtml(decodeXml(cdataTag(item, "description"))).slice(0, 900);
    const imageUrl = firstImage(cdataTag(item, "content:encoded") || cdataTag(item, "description"));
    const publishedAt = new Date(decodeXml(tag(item, "pubDate")));
    return [{
      sourceName,
      externalId: guid,
      sourceUrl: url,
      title,
      summary: description || "A new book-related story from the Library of Congress. Open the source and discuss it with the community.",
      imageUrl,
      publishedAt: Number.isNaN(publishedAt.getTime()) ? undefined : publishedAt,
    }];
  });
}

function tag(xml: string, name: string) {
  return xml.match(new RegExp(`<${escapeRegExp(name)}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapeRegExp(name)}>`, "i"))?.[1]?.trim() ?? "";
}

function cdataTag(xml: string, name: string) {
  return tag(xml, name).replace(/^<!\[CDATA\[|\]\]>$/g, "").trim();
}

function firstImage(html: string) {
  return html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function resultCount(result: PromiseSettledResult<Bulletin[]>) {
  return result.status === "fulfilled" ? result.value.length : 0;
}
