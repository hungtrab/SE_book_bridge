import { redirect } from "next/navigation";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    const item = Array.isArray(value) ? value[0] : value;
    if (item) query.set(key, item);
  }
  redirect(query.size > 0 ? `/search?${query.toString()}` : "/search");
}
