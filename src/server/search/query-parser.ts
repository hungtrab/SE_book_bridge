const QUALIFIERS = new Set(["author", "genre", "isbn", "type", "condition", "community", "district"]);

export type ParsedSearchQuery = {
  text: string;
  filters: Partial<Record<"author" | "genre" | "isbn" | "type" | "condition" | "community" | "district", string>>;
};

export function parseSearchQuery(raw = ""): ParsedSearchQuery {
  const filters: ParsedSearchQuery["filters"] = {};
  const text: string[] = [];
  for (const token of tokenize(raw.trim())) {
    const separator = token.indexOf(":");
    const key = separator > 0 ? token.slice(0, separator).toLowerCase() : "";
    const value = separator > 0 ? token.slice(separator + 1).trim().replace(/^"|"$/g, "") : "";
    if (QUALIFIERS.has(key) && value) {
      filters[key as keyof ParsedSearchQuery["filters"]] = value;
    } else if (token) {
      text.push(token);
    }
  }
  return { text: text.join(" "), filters };
}

function tokenize(value: string): string[] {
  const tokens: string[] = [];
  const pattern = /(?:[^\s"]+:"[^"]*"|"[^"]*"|[^\s"]+)/g;
  for (const match of value.matchAll(pattern)) {
    tokens.push(match[0].replace(/^"|"$/g, ""));
  }
  return tokens;
}
