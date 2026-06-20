import { prisma } from "../lib/prisma";

const COMMUNITY_NAME = process.env.BULLETIN_COMMUNITY_NAME ?? "Book News & Discoveries";
const AUTHOR_EMAIL = process.env.BULLETIN_AUTHOR_EMAIL ?? "admin@bookbridge.local";
const AUTHOR_DISPLAY_NAME = "BookBridge Bulletin Desk";
const DISABLED_PASSWORD_HASH = "system-account-disabled";
const MAX_PER_SOURCE = 8;
const FETCH_TIMEOUT_MS = 10_000;

type Bulletin = {
  sourceName: string;
  externalId: string;
  sourceUrl: string;
  title: string;
  summary: string;
  imageUrl?: string;
  publishedAt?: Date;
};

export type BulletinCommunitySummary = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  ownerId: string;
  owner: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

type BulletinSource = {
  key: string;
  label: string;
  fetch: () => Promise<Bulletin[]>;
};

const BULLETIN_SOURCES: BulletinSource[] = [
  { key: "openLibrary", label: "Open Library", fetch: fetchOpenLibraryTrending },
  { key: "libraryOfCongress", label: "Library of Congress", fetch: fetchLibraryOfCongressFeeds },
  { key: "projectGutenberg", label: "Project Gutenberg", fetch: fetchProjectGutenbergDaily },
  { key: "internetArchive", label: "Internet Archive", fetch: fetchInternetArchiveTexts },
  { key: "newYorkTimes", label: "NYT Best Sellers", fetch: fetchNewYorkTimesBestSellers },
  { key: "guardianBooks", label: "Guardian Books", fetch: fetchGuardianBooks },
  { key: "nprBooks", label: "NPR Book of the Day", fetch: fetchNprBookOfTheDay },
  { key: "apBooks", label: "AP Books & Literature", fetch: fetchApBooksAndLiterature },
];

export async function runDailyBulletinImport() {
  const results = await Promise.allSettled(BULLETIN_SOURCES.map((source) => source.fetch()));
  const items = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);

  if (items.length === 0) {
    throw new Error("All bulletin sources failed or returned no usable entries");
  }
  const { community, author } = await ensureBulletinInfrastructure();

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
    sources: sourceCounts(results),
  };
}

export async function listBulletins(options: { importIfEmpty?: boolean } = {}) {
  let bulletins = await queryBulletins();
  if (bulletins.length === 0 && options.importIfEmpty) {
    try {
      await runDailyBulletinImport();
      bulletins = await queryBulletins();
    } catch (error) {
      console.error("Automatic bulletin import failed", error);
    }
  }
  return bulletins;
}

async function queryBulletins() {
  return prisma.communityPost.findMany({
    where: { kind: "BULLETIN" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 30,
    include: {
      community: {
        select: {
          id: true,
          name: true,
          description: true,
          memberCount: true,
          ownerId: true,
          owner: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
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

async function ensureBulletinInfrastructure() {
  return prisma.$transaction(async (tx) => {
    const authorEmail = AUTHOR_EMAIL.toLowerCase();
    const preferredAuthor = await tx.user.findUnique({ where: { email: authorEmail } });
    const fallbackAuthor = preferredAuthor ?? await tx.user.findFirst({
      where: { status: "ACTIVE" },
      orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    });
    const author = fallbackAuthor ?? await tx.user.create({
      data: {
        email: authorEmail,
        passwordHash: DISABLED_PASSWORD_HASH,
        displayName: AUTHOR_DISPLAY_NAME,
        bio: "System account used to publish source-attributed BookBridge bulletins.",
        status: "SUSPENDED",
        emailVerifiedAt: new Date(),
      },
    });

    const community = await tx.community.upsert({
      where: { name: COMMUNITY_NAME },
      update: {
        description: "Main BookBridge space for source-attributed book bulletins and reading discoveries.",
        isPrivate: false,
      },
      create: {
        ownerId: author.id,
        name: COMMUNITY_NAME,
        scope: "GENRE",
        description: "Main BookBridge space for source-attributed book bulletins and reading discoveries.",
        isPrivate: false,
        memberCount: 0,
      },
    });

    const membership = await tx.communityMembership.findUnique({
      where: { userId_communityId: { userId: author.id, communityId: community.id } },
    });
    if (membership) {
      if (membership.role !== "MODERATOR") {
        await tx.communityMembership.update({
          where: { userId_communityId: { userId: author.id, communityId: community.id } },
          data: { role: "MODERATOR" },
        });
      }
    } else {
      await tx.communityMembership.create({
        data: { userId: author.id, communityId: community.id, role: "MODERATOR" },
      });
      await tx.community.update({
        where: { id: community.id },
        data: { memberCount: { increment: 1 } },
      });
    }

    return { community, author };
  });
}

async function fetchOpenLibraryTrending(): Promise<Bulletin[]> {
  const response = await fetch("https://openlibrary.org/trending/daily.json?limit=12", {
    headers: { "User-Agent": "BookBridge/1.0 (community book discovery; admin@bookbridge.local)" },
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
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
    const response = await fetch(url, {
      headers: { "User-Agent": "BookBridge/1.0 (admin@bookbridge.local)" },
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`${name} returned ${response.status}`);
    return parseRss(await response.text(), name);
  }));
  return batches.flat().slice(0, MAX_PER_SOURCE);
}

async function fetchProjectGutenbergDaily(): Promise<Bulletin[]> {
  const response = await fetch("https://www.gutenberg.org/cache/epub/feeds/today.rss", {
    headers: { "User-Agent": "BookBridge/1.0 (community book discovery; admin@bookbridge.local)" },
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Project Gutenberg returned ${response.status}`);
  return parseRss(await response.text(), "Project Gutenberg")
    .map((item) => ({
      ...item,
      title: item.title.startsWith("New public-domain ebook:")
        ? item.title
        : `New public-domain ebook: ${item.title}`,
      summary: item.summary || "A new or updated public-domain ebook is available from Project Gutenberg. Open the source to inspect the edition, then discuss whether the community should read it.",
    }))
    .slice(0, MAX_PER_SOURCE);
}

async function fetchInternetArchiveTexts(): Promise<Bulletin[]> {
  const params = new URLSearchParams({
    q: "mediatype:texts AND collection:internetarchivebooks",
    rows: String(MAX_PER_SOURCE),
    page: "1",
    output: "json",
  });
  for (const field of ["identifier", "title", "creator", "date", "description", "publicdate"]) {
    params.append("fl[]", field);
  }
  params.append("sort[]", "publicdate desc");

  const response = await fetch(`https://archive.org/advancedsearch.php?${params.toString()}`, {
    headers: { "User-Agent": "BookBridge/1.0 (community book discovery; admin@bookbridge.local)" },
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Internet Archive returned ${response.status}`);
  const body = await response.json() as { response?: { docs?: Array<Record<string, unknown>> } };
  return (body.response?.docs ?? []).flatMap((doc) => {
    const identifier = text(doc.identifier);
    const title = text(doc.title);
    if (!identifier || !title) return [];
    const creator = textValue(doc.creator);
    const date = textValue(doc.date);
    const description = stripHtml(textValue(doc.description) ?? "");
    const publicDate = new Date(textValue(doc.publicdate) ?? "");
    const byline = creator ? ` by ${creator}` : "";
    const dateText = date ? ` (${date.slice(0, 4)})` : "";
    return [{
      sourceName: "Internet Archive Texts",
      externalId: identifier,
      sourceUrl: `https://archive.org/details/${encodeURIComponent(identifier)}`,
      title: `Recently archived text: ${title}`,
      summary: description
        ? clip(description, 900)
        : `${title}${byline}${dateText} was recently added to Internet Archive's text collection. Open the record to inspect access options and discuss whether it is useful to BookBridge readers.`,
      publishedAt: Number.isNaN(publicDate.getTime()) ? undefined : publicDate,
    }];
  });
}

async function fetchNewYorkTimesBestSellers(): Promise<Bulletin[]> {
  const key = process.env.NYT_BOOKS_API_KEY;
  if (!key) return [];
  const response = await fetch(`https://api.nytimes.com/svc/books/v3/lists/current/hardcover-fiction.json?api-key=${encodeURIComponent(key)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
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

async function fetchGuardianBooks(): Promise<Bulletin[]> {
  const response = await fetch("https://www.theguardian.com/books/rss", {
    headers: { "User-Agent": "BookBridge/1.0 (community book discovery; admin@bookbridge.local)" },
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Guardian Books returned ${response.status}`);
  return parseRss(await response.text(), "Guardian Books")
    .map((item) => ({
      ...item,
      summary: item.summary || "Latest Guardian book coverage is available. Open the article to read the full piece and discuss it with the community.",
    }))
    .slice(0, MAX_PER_SOURCE);
}

async function fetchNprBookOfTheDay(): Promise<Bulletin[]> {
  const response = await fetch("https://feeds.npr.org/510364/podcast.xml", {
    headers: { "User-Agent": "BookBridge/1.0 (community book discovery; admin@bookbridge.local)" },
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`NPR Book of the Day returned ${response.status}`);
  return parseRss(await response.text(), "NPR Book of the Day")
    .map((item) => ({
      ...item,
      summary: item.summary || "NPR has a new Book of the Day episode. Open the episode page to read the show notes and discuss the book pick.",
    }))
    .slice(0, MAX_PER_SOURCE);
}

async function fetchApBooksAndLiterature(): Promise<Bulletin[]> {
  const response = await fetch("https://apnews.com/hub/books-and-literature", {
    headers: { "User-Agent": "BookBridge/1.0 (community book discovery; admin@bookbridge.local)" },
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`AP Books & Literature returned ${response.status}`);
  const html = await response.text();
  const items: Bulletin[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(/data-posted-date-timestamp="(\d+)"[\s\S]{0,2200}?<a class="Link" aria-label="([^"]+)" href="(https:\/\/apnews\.com\/article\/[^"]+)"/g)) {
    const publishedAt = new Date(Number.parseInt(match[1], 10));
    const title = decodeXml(match[2]);
    const sourceUrl = match[3];
    const externalId = sourceUrl.split("/article/").pop();
    if (!externalId || seen.has(externalId)) continue;
    seen.add(externalId);
    items.push({
      sourceName: "AP Books & Literature",
      externalId,
      sourceUrl,
      title,
      summary: `${title} is the latest AP Books & Literature coverage. Open the article to read the report and discuss it with the community.`,
      publishedAt: Number.isNaN(publishedAt.getTime()) ? undefined : publishedAt,
    });
    if (items.length >= MAX_PER_SOURCE) break;
  }
  return items;
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
      summary: description || "A new book-related story is available from this source. Open the source and discuss it with the community.",
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
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&nbsp;/g, " ")
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

function textValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => text(item)).filter(Boolean).join(", ") || undefined;
  }
  return text(value);
}

function clip(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}...`;
}

function sourceCounts(results: Array<PromiseSettledResult<Bulletin[]>>) {
  return Object.fromEntries(BULLETIN_SOURCES.map((source, index) => {
    const result = results[index];
    return [source.key, result?.status === "fulfilled" ? result.value.length : 0];
  }));
}
