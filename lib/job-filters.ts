export const JOB_PAGE_SIZE = 20;
export type JobFilters = { query: string; match: "all" | "high" | "low"; sort: "score" | "newest" | "oldest"; page: number };
export function parseJobFilters(input: Record<string, string | string[] | undefined>): JobFilters {
  const value = (key: string) => typeof input[key] === "string" ? input[key] as string : "";
  const match = value("match"), sort = value("sort"), page = Number(value("page"));
  return { query: value("query").slice(0, 100), match: match === "high" || match === "low" ? match : "all", sort: sort === "newest" || sort === "oldest" ? sort : "score", page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 100000) : 1 };
}
