import { toSearchParam } from "@/lib/utils";

export type AdminSearchParams = Record<string, string | string[] | undefined>;

export const ADMIN_PAGE_SIZE = 20;
const MAX_QUERY_LENGTH = 100;

export function readParam(params: AdminSearchParams, key: string): string {
  return (toSearchParam(params[key]) ?? "").trim().slice(0, MAX_QUERY_LENGTH);
}

export function readPage(params: AdminSearchParams): number {
  const page = Number.parseInt(readParam(params, "pagina"), 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function totalPages(total: number, pageSize = ADMIN_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function normalizeSearch(q: string): string {
  return q.trim();
}

export type ContainsField<T> = {
  [K in keyof T]?: boolean;
};

export function buildContainsOr<T>(q: string, fields: (keyof T)[]): Array<{ [K in keyof T]?: { contains: string } }> {
  const term = normalizeSearch(q);
  if (!term) return [];
  return fields.map((field) => ({ [field]: { contains: term } }) as { [K in keyof T]?: { contains: string } });
}

export function withSearchAnd<TWhere extends Record<string, unknown>>(
  and: Array<Partial<TWhere>>,
  q: string,
  fields: (keyof TWhere)[]
): void {
  const term = normalizeSearch(q);
  if (!term) return;
  const or = buildContainsOr<TWhere>(term, fields);
  if (or.length > 0) {
    and.push({ OR: or } as unknown as Partial<TWhere>);
  }
}

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
};

/** Arma una URL conservando los filtros actuales y aplicando cambios (valores vacíos se quitan). */
export function hrefWith(base: string, current: Record<string, string>, changes: Record<string, string | number | undefined> = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...changes })) {
    const text = value === undefined ? "" : String(value);
    if (text !== "" && !(key === "pagina" && text === "1")) params.set(key, text);
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
