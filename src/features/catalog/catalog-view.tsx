import { Suspense } from "react";
import Link from "next/link";
import { SearchX, X } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ProductGrid } from "@/components/product/product-grid";
import { formatPrice, pluralize } from "@/lib/format";
import { getCatalogFacets } from "@/services/catalog/facets.service";
import { listProducts } from "@/services/catalog/products.service";
import { getInterestFreeHint } from "@/services/pricing/installments.service";
import { didYouMean } from "@/services/search/search.service";
import type { BreadcrumbItem, CatalogFilters, CategoryNode } from "@/types/catalog";
import { FiltersDrawerButton, FiltersSidebar } from "./filters-panel";
import {
  SPEC_PARAM_PREFIX,
  buildCatalogHref,
  hasActiveFilters,
  parseCatalogParams,
  type RawSearchParams,
} from "./params";
import { SortSelect } from "./sort-select";

interface CatalogViewProps {
  title: string;
  description?: string | null;
  breadcrumbs: BreadcrumbItem[];
  basePath: string;
  searchParams: RawSearchParams;
  /** Filtros fijos de la página (categoría, marca, ofertas). */
  scope: Pick<CatalogFilters, "categoryIds" | "brandSlugs" | "onSale">;
  subcategories?: CategoryNode[];
  hideBrandFilter?: boolean;
}

function ActiveChips({
  filters,
  basePath,
  searchParams,
  brandLabels,
}: {
  filters: CatalogFilters;
  basePath: string;
  searchParams: RawSearchParams;
  brandLabels: Map<string, string>;
}) {
  const chips: { label: string; href: string }[] = [];
  const without = (key: string, list: string[], value: string) =>
    buildCatalogHref(basePath, searchParams, {
      [key]: list.filter((v) => v !== value).join(",") || null,
    });
  for (const slug of filters.brandSlugs ?? [])
    chips.push({
      label: brandLabels.get(slug) ?? slug,
      href: without("marca", filters.brandSlugs ?? [], slug),
    });
  for (const [key, values] of Object.entries(filters.specs ?? {})) {
    for (const v of values)
      chips.push({ label: v, href: without(`${SPEC_PARAM_PREFIX}${key}`, values, v) });
  }
  if (filters.minPrice !== undefined)
    chips.push({
      label: `Desde ${formatPrice(filters.minPrice)}`,
      href: buildCatalogHref(basePath, searchParams, { min: null }),
    });
  if (filters.maxPrice !== undefined)
    chips.push({
      label: `Hasta ${formatPrice(filters.maxPrice)}`,
      href: buildCatalogHref(basePath, searchParams, { max: null }),
    });
  if (filters.inStock)
    chips.push({
      label: "Con stock",
      href: buildCatalogHref(basePath, searchParams, { stock: null }),
    });
  if (chips.length === 0) return null;
  const clearHref = filters.q ? `${basePath}?q=${encodeURIComponent(filters.q)}` : basePath;
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Filtros aplicados">
      {chips.map((chip) => (
        <li key={chip.href + chip.label}>
          <Link
            href={chip.href}
            scroll={false}
            className="bg-primary-soft text-primary inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium hover:opacity-80"
            aria-label={`Quitar filtro ${chip.label}`}
          >
            {chip.label} <X className="size-3" aria-hidden />
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={clearHref}
          className="text-muted text-xs font-medium underline-offset-2 hover:underline"
        >
          Limpiar filtros
        </Link>
      </li>
    </ul>
  );
}

export async function CatalogView({
  title,
  description,
  breadcrumbs,
  basePath,
  searchParams,
  scope,
  subcategories,
  hideBrandFilter,
}: CatalogViewProps) {
  const userFilters = parseCatalogParams(searchParams);
  const filters: CatalogFilters = {
    ...userFilters,
    categoryIds: scope.categoryIds,
    onSale: scope.onSale,
    brandSlugs: scope.brandSlugs?.length ? scope.brandSlugs : userFilters.brandSlugs,
  };
  const [result, facets, installments] = await Promise.all([
    listProducts(filters),
    getCatalogFacets(filters),
    getInterestFreeHint(),
  ]);
  const suggestion = filters.q && result.total === 0 ? await didYouMean(filters.q) : null;
  const brandLabels = new Map(facets.brands.map((b) => [b.value, b.label]));
  const activeCount =
    (userFilters.brandSlugs?.length ?? 0) +
    Object.values(userFilters.specs ?? {}).flat().length +
    (userFilters.inStock ? 1 : 0) +
    (userFilters.minPrice !== undefined || userFilters.maxPrice !== undefined ? 1 : 0);
  const filtered = hasActiveFilters(userFilters);

  return (
    <div className="container-page py-6 sm:py-10">
      <Breadcrumb items={breadcrumbs} />
      <header className="mt-6 mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{title}</h1>
        {description && (
          <p className="text-muted mt-2 max-w-2xl text-sm sm:text-base">{description}</p>
        )}
        {subcategories && subcategories.length > 0 && (
          <ul className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {subcategories.map((c) => (
              <li key={c.id} className="shrink-0">
                <Link
                  href={c.href}
                  className="border-border bg-surface hover:border-primary/50 hover:bg-primary-soft hover:text-primary inline-flex rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="flex gap-8">
        <Suspense>
          <FiltersSidebar facets={facets} hideBrands={hideBrandFilter} />
        </Suspense>
        <section className="min-w-0 flex-1" aria-label="Resultados">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted text-sm" aria-live="polite">
              {pluralize(result.total, "producto", "productos")}
            </p>
            <div className="flex items-center gap-2">
              <Suspense>
                <FiltersDrawerButton
                  facets={facets}
                  hideBrands={hideBrandFilter}
                  activeCount={activeCount}
                />
                <SortSelect hasQuery={Boolean(filters.q)} />
              </Suspense>
            </div>
          </div>
          <div className="mb-4">
            <ActiveChips
              filters={userFilters}
              basePath={basePath}
              searchParams={searchParams}
              brandLabels={brandLabels}
            />
          </div>

          {result.items.length === 0 ? (
            <EmptyState
              icon={<SearchX />}
              title="No encontramos productos que coincidan con tu búsqueda."
              description={
                suggestion ? undefined : "Probá con otros filtros o términos más generales."
              }
              action={
                <div className="flex flex-col items-center gap-3">
                  {suggestion && (
                    <p className="text-sm">
                      ¿Quisiste decir{" "}
                      <Link
                        className="text-primary font-semibold hover:underline"
                        href={`/productos?q=${encodeURIComponent(suggestion)}`}
                      >
                        {suggestion}
                      </Link>
                      ?
                    </p>
                  )}
                  {filtered ? (
                    <ButtonLink
                      href={filters.q ? `${basePath}?q=${encodeURIComponent(filters.q)}` : basePath}
                      variant="outline"
                    >
                      Limpiar filtros
                    </ButtonLink>
                  ) : (
                    <ButtonLink href="/productos" variant="outline">
                      Ver todos los productos
                    </ButtonLink>
                  )}
                </div>
              }
            />
          ) : (
            <>
              <ProductGrid products={result.items} installments={installments} priorityCount={4} />
              <div className="mt-10">
                <Pagination
                  page={result.page}
                  totalPages={result.totalPages}
                  hrefFor={(p) =>
                    buildCatalogHref(basePath, searchParams, { pagina: p === 1 ? null : String(p) })
                  }
                />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
