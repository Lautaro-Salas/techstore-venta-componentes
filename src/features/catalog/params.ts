import { SORT_OPTIONS, type CatalogFilters, type SortOption } from "@/types/catalog";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const SPEC_PARAM_PREFIX = "f_";
const MAX_PAGE = 500;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function list(value: string | string[] | undefined): string[] {
  const raw = first(value);
  return raw ? raw.split(",").map((v) => v.trim()).filter(Boolean).slice(0, 20) : [];
}

function positiveInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function isSort(value: string | undefined): value is SortOption {
  return value !== undefined && value in SORT_OPTIONS;
}

/** Convierte los query params de la URL en filtros tipados y saneados. */
export function parseCatalogParams(params: RawSearchParams): CatalogFilters {
  const specs: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(params)) {
    if (key.startsWith(SPEC_PARAM_PREFIX) && /^[a-z0-9_]+$/.test(key.slice(SPEC_PARAM_PREFIX.length))) {
      const values = list(value);
      if (values.length) specs[key.slice(SPEC_PARAM_PREFIX.length)] = values;
    }
  }
  const sort = first(params.orden);
  const page = positiveInt(first(params.pagina));
  return {
    q: first(params.q)?.trim().slice(0, 80) || undefined,
    brandSlugs: list(params.marca),
    minPrice: positiveInt(first(params.min)),
    maxPrice: positiveInt(first(params.max)),
    inStock: first(params.stock) === "1",
    specs,
    sort: isSort(sort) ? sort : undefined,
    page: page ? Math.min(Math.max(page, 1), MAX_PAGE) : 1,
  };
}

/** Construye una URL de catálogo preservando los filtros actuales y aplicando cambios. */
export function buildCatalogHref(basePath: string, params: RawSearchParams, changes: Record<string, string | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const v = first(value);
    if (v) search.set(key, v);
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === "") search.delete(key);
    else search.set(key, value);
  }
  if (!("pagina" in changes)) search.delete("pagina");
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function hasActiveFilters(filters: CatalogFilters): boolean {
  return Boolean(
    filters.brandSlugs?.length ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      filters.inStock ||
      Object.keys(filters.specs ?? {}).length,
  );
}
