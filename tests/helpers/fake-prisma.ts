// fake-prisma.ts — minimal in-memory stand-in for PrismaClient.
//
// The project has no test database (see tests/__mocks__/prisma-client.ts,
// a type-only stub). To integration-test service functions that talk to
// `prisma` directly (transactions, updates, cascades), we swap the module
// with this fake via `vi.mock("@/server/lib/prisma", ...)`. It implements
// only the operations actually used by the services under test — it is a
// test double, not a generic query engine.

type Row = Record<string, any>;
type Where = Record<string, any> | undefined;

function isOperatorObject(value: unknown): value is Row {
  return (
    typeof value === "object" &&
    value !== null &&
    !(value instanceof Date) &&
    ("gte" in (value as Row) || "lte" in (value as Row) || "gt" in (value as Row) ||
      "lt" in (value as Row) || "not" in (value as Row) || "in" in (value as Row))
  );
}

/** Composite-unique `where` clauses (e.g. `userId_communityId: { userId, communityId }`)
 * are nested objects without comparison operators — flatten them to plain equality checks. */
function flattenWhere(where: Where): Row {
  if (!where) return {};
  const flat: Row = {};
  for (const [key, value] of Object.entries(where)) {
    if (key === "AND" || key === "OR") {
      flat[key] = value;
    } else if (value && typeof value === "object" && !(value instanceof Date) && !isOperatorObject(value) && !Array.isArray(value)) {
      Object.assign(flat, value);
    } else {
      flat[key] = value;
    }
  }
  return flat;
}

function matchWhere(row: Row, where: Where): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, cond]) => {
    if (key === "AND") return (cond as Row[]).every((c) => matchWhere(row, c));
    if (key === "OR") return (cond as Row[]).some((c) => matchWhere(row, c));
    const value = row[key];
    if (isOperatorObject(cond)) {
      const c = cond as Row;
      if ("gte" in c && !(value >= c.gte)) return false;
      if ("lte" in c && !(value <= c.lte)) return false;
      if ("gt" in c && !(value > c.gt)) return false;
      if ("lt" in c && !(value < c.lt)) return false;
      if ("not" in c && value === c.not) return false;
      if ("in" in c && !c.in.includes(value)) return false;
      return true;
    }
    return value === cond;
  });
}

function applyData(row: Row, data: Row) {
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object" && !(value instanceof Date)) {
      if ("increment" in value) { row[key] = (row[key] ?? 0) + value.increment; continue; }
      if ("decrement" in value) { row[key] = (row[key] ?? 0) - value.decrement; continue; }
      if ("set" in value) { row[key] = value.set; continue; }
    }
    row[key] = value;
  }
}

function project(row: Row, selector?: Row) {
  if (!selector) return { ...row };
  const result: Row = {};
  for (const [key, val] of Object.entries(selector)) {
    if (val === true) result[key] = row[key];
  }
  return result;
}

let idCounter = 0;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
}

function makeTable(name: string, rows: Row[]) {
  return {
    rows,
    async findUnique({ where, select }: { where: Where; select?: Row }) {
      const row = rows.find((r) => matchWhere(r, flattenWhere(where)));
      return row ? project(row, select) : null;
    },
    async findUniqueOrThrow(args: { where: Where; select?: Row }) {
      const row = rows.find((r) => matchWhere(r, flattenWhere(args.where)));
      if (!row) throw new Error(`${name}: row not found`);
      return project(row, args.select);
    },
    async findFirst({ where, select }: { where: Where; select?: Row }) {
      const row = rows.find((r) => matchWhere(r, where));
      return row ? project(row, select) : null;
    },
    async findMany({ where, select, orderBy, take }: { where?: Where; select?: Row; orderBy?: Row; take?: number } = {}) {
      let result = rows.filter((r) => matchWhere(r, where));
      if (orderBy) {
        const [[field, dir]] = Object.entries(orderBy as Row);
        result = [...result].sort((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0) * (dir === "desc" ? -1 : 1));
      }
      if (take) result = result.slice(0, take);
      return result.map((r) => project(r, select));
    },
    async create({ data, select }: { data: Row; select?: Row }) {
      const row: Row = { id: data.id ?? nextId(name), createdAt: new Date(), updatedAt: new Date(), ...data };
      rows.push(row);
      return project(row, select);
    },
    async createMany({ data }: { data: Row[] }) {
      for (const item of data) rows.push({ id: nextId(name), createdAt: new Date(), ...item });
      return { count: data.length };
    },
    async update({ where, data }: { where: Where; data: Row }) {
      const row = rows.find((r) => matchWhere(r, flattenWhere(where)));
      if (!row) throw new Error(`${name}: row not found for update`);
      applyData(row, data);
      return { ...row };
    },
    async updateMany({ where, data }: { where: Where; data: Row }) {
      const matched = rows.filter((r) => matchWhere(r, where));
      matched.forEach((r) => applyData(r, data));
      return { count: matched.length };
    },
    async upsert({ where, create, update }: { where: Where; create: Row; update: Row }) {
      const row = rows.find((r) => matchWhere(r, flattenWhere(where)));
      if (row) { applyData(row, update); return { ...row }; }
      const created: Row = { id: nextId(name), createdAt: new Date(), updatedAt: new Date(), ...create };
      rows.push(created);
      return created;
    },
    async delete({ where }: { where: Where }) {
      const flat = flattenWhere(where);
      const idx = rows.findIndex((r) => matchWhere(r, flat));
      if (idx === -1) throw new Error(`${name}: row not found for delete`);
      const [removed] = rows.splice(idx, 1);
      return removed;
    },
    async deleteMany({ where }: { where?: Where } = {}) {
      const before = rows.length;
      const keep = rows.filter((r) => !matchWhere(r, where));
      rows.length = 0;
      rows.push(...keep);
      return { count: before - keep.length };
    },
    async count({ where }: { where?: Where } = {}) {
      return rows.filter((r) => matchWhere(r, where)).length;
    },
    async groupBy({ by, where, _sum, _count }: { by: string[]; where?: Where; _sum?: Row; _count?: boolean }) {
      const matched = rows.filter((r) => matchWhere(r, where));
      const groups = new Map<string, Row[]>();
      for (const r of matched) {
        const key = by.map((k) => r[k]).join("|");
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(r);
      }
      return [...groups.entries()].map(([key, items]) => {
        const entry: Row = {};
        key.split("|").forEach((v, i) => { entry[by[i]] = v; });
        if (_sum) entry._sum = Object.fromEntries(Object.keys(_sum).map((f) => [f, items.reduce((s, it) => s + (it[f] ?? 0), 0)]));
        if (_count) entry._count = items.length;
        return entry;
      });
    },
  };
}

export interface FakePrismaSeed {
  users?: Row[];
  reports?: Row[];
  moderationActions?: Row[];
  listings?: Row[];
  transactions?: Row[];
  messages?: Row[];
  conversations?: Row[];
  communities?: Row[];
  communityMemberships?: Row[];
  communityPosts?: Row[];
  communityPostComments?: Row[];
  communityPostLikes?: Row[];
  communityCommentReactions?: Row[];
  reputationEvents?: Row[];
  notifications?: Row[];
}

export function createFakePrisma(seed: FakePrismaSeed = {}) {
  const user = makeTable("user", seed.users ?? []);
  const report = makeTable("report", seed.reports ?? []);
  const moderationAction = makeTable("moderationAction", seed.moderationActions ?? []);
  const listing = makeTable("listing", seed.listings ?? []);
  const transaction = makeTable("transaction", seed.transactions ?? []);
  const message = makeTable("message", seed.messages ?? []);
  const community = makeTable("community", seed.communities ?? []);
  const communityMembership = makeTable("communityMembership", seed.communityMemberships ?? []);
  const communityPost = makeTable("communityPost", seed.communityPosts ?? []);
  const communityPostComment = makeTable("communityPostComment", seed.communityPostComments ?? []);
  const communityPostLike = makeTable("communityPostLike", seed.communityPostLikes ?? []);
  const communityCommentReaction = makeTable("communityCommentReaction", seed.communityCommentReactions ?? []);
  const reputationEvent = makeTable("reputationEvent", seed.reputationEvents ?? []);
  const notification = makeTable("notification", seed.notifications ?? []);
  const conversations: Row[] = seed.conversations ?? [];

  // Schema has `parent` (CommunityPostComment self-relation) as `onDelete: Cascade` —
  // deleting a parent row in real Postgres removes its replies too. Mirror that here
  // so tests exercising the cascade see the same row-count behaviour as production.
  const originalCommentDelete = communityPostComment.delete.bind(communityPostComment);
  (communityPostComment as any).delete = async (args: { where: Where }) => {
    const removed = await originalCommentDelete(args);
    const childIds = communityPostComment.rows.filter((r) => r.parentId === removed.id).map((r) => r.id);
    communityPostComment.rows.splice(0, communityPostComment.rows.length, ...communityPostComment.rows.filter((r) => !childIds.includes(r.id)));
    return removed;
  };

  // CommunityPost cascades comments and likes too (both relations are `onDelete: Cascade`).
  const originalPostDelete = communityPost.delete.bind(communityPost);
  (communityPost as any).delete = async (args: { where: Where }) => {
    const removed = await originalPostDelete(args);
    communityPostComment.rows.splice(0, communityPostComment.rows.length, ...communityPostComment.rows.filter((r) => r.postId !== removed.id));
    communityPostLike.rows.splice(0, communityPostLike.rows.length, ...communityPostLike.rows.filter((r) => r.postId !== removed.id));
    return removed;
  };

  // `message.findUnique` is the one call site that selects a nested relation
  // (`conversation: { select: {...} } }`) — resolve that one join by hand.
  // Reads `message.rows`/`conversations` live (not a snapshot) so rows pushed
  // by tests after construction are visible.
  (message as any).findUnique = async ({ where, select }: { where: Where; select?: Row }) => {
    const row = message.rows.find((r) => matchWhere(r, flattenWhere(where)));
    if (!row) return null;
    const result = project(row, select);
    if (select?.conversation) {
      const convo = conversations.find((c) => c.id === row.conversationId);
      result.conversation = convo ? project(convo, select.conversation.select) : null;
    }
    return result;
  };

  // `report.findFirst` with a `targetListing.community.memberships.some(...)` filter is how
  // queue.ts scopes community moderators to their own community's reports — emulate that one join.
  const originalReportFindFirst = report.findFirst.bind(report);
  (report as any).findFirst = async (args: { where: Row; select?: Row }) => {
    const { where } = args;
    if (where?.targetListing?.community?.memberships?.some) {
      const row = report.rows.find((r) => r.id === where.id);
      if (!row || !row.targetListingId) return null;
      const targetListing = listing.rows.find((l) => l.id === row.targetListingId);
      if (!targetListing) return null;
      const { userId, role } = where.targetListing.community.memberships.some;
      const member = communityMembership.rows.find(
        (m) => m.userId === userId && m.communityId === targetListing.communityId && (role ? m.role === role : true),
      );
      return member ? { id: row.id } : null;
    }
    return originalReportFindFirst(args);
  };

  // `report.findMany` with a `targetListing: { communityId: { in: [...] } }` filter is how
  // queue.ts's `listModerationQueue` scopes a community moderator's queue — same join, list form.
  const originalReportFindMany = report.findMany.bind(report);
  (report as any).findMany = async (args: { where?: Row; orderBy?: Row; take?: number } = {}) => {
    const { where } = args;
    if (where?.targetListing?.communityId?.in) {
      const allowedCommunityIds: string[] = where.targetListing.communityId.in;
      const allowedListingIds = new Set(listing.rows.filter((l) => allowedCommunityIds.includes(l.communityId)).map((l) => l.id));
      const { targetListing, ...rest } = where;
      void targetListing;
      return originalReportFindMany({ ...args, where: rest }).then((rows: Row[]) =>
        rows.filter((r) => allowedListingIds.has(r.targetListingId)));
    }
    return originalReportFindMany(args);
  };

  const client: Row = {
    user, report, moderationAction, listing, transaction, message, community,
    communityMembership, communityPost, communityPostComment, communityPostLike,
    communityCommentReaction, reputationEvent, notification, conversations,
    async $transaction(arg: any) {
      if (typeof arg === "function") return arg(client);
      return Promise.all(arg);
    },
  };
  return client;
}
