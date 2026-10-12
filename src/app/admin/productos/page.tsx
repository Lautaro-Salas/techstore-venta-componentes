import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { FilterTabs } from "@/components/admin/filter-tabs";
import { PRODUCT_STATUS_LABEL } from "@/components/admin/labels";
import { PageHeader } from "@/components/admin/page-header";
import { hrefWith, readPage, readParam, type AdminSearchParams } from "@/components/admin/query";
import { SearchForm } from "@/components/admin/search-form";
import { PageTransition } from "@/components/navigation/page-transition";
import { ButtonLink } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { ProductsTable } from "@/features/admin/products/products-table";
import { requirePermissionPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { PRODUCT_STATUSES } from "@/schemas/admin";
import { PRODUCT_SORT_LABEL } from "@/components/admin/labels";
import {
  getCategoryOptions,
  listAdminProducts,
  PRODUCT_SORTS,
} from "@/services/admin/products.service";
import { readProductStatus, readProductSort } from "@/app/admin/_lib/filters";

export const metadata: Metadata = { title: "Productos" };

const BASE = "/admin/productos";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const user = await requirePermissionPage("products:read", BASE);
  const sp = await searchParams;
  const filters = {
    q: readParam(sp, "q"),
    estado: readParam(sp, "estado"),
    categoria: readParam(sp, "categoria"),
    orden: readParam(sp, "orden"),
  };
  const status = readProductStatus(filters.estado);
  const sort = readProductSort(filters.orden);
  const [result, categories] = await Promise.all([
    listAdminProducts({
      q: filters.q,
      status,
      categoryId: filters.categoria || undefined,
      sort,
      page: readPage(sp),
    }),
    getCategoryOptions(),
  ]);
  const canWrite = hasPermission(user, "products:write");

  const tabs = [
    {
      label: "Todos",
      href: hrefWith(BASE, filters, { estado: undefined, pagina: undefined }),
      active: !status,
    },
    ...PRODUCT_STATUSES.map((s) => ({
      label: PRODUCT_STATUS_LABEL[s],
      href: hrefWith(BASE, filters, { estado: s, pagina: undefined }),
      active: status === s,
    })),
  ];

  return (
    <PageTransition>
      <PageHeader
        title="Productos"
        description={`${result.total} productos encontrados`}
        actions={
          canWrite && (
            <ButtonLink href={`${BASE}/nuevo`} icon={<Plus className="size-4" aria-hidden />}>
              Nuevo producto
            </ButtonLink>
          )
        }
      />
      <div className="mb-4 flex flex-col gap-3">
        <SearchForm
          action={BASE}
          defaultValue={filters.q}
          placeholder="Buscar por nombre o SKU"
          label="Buscar productos"
          hidden={{ estado: filters.estado }}
        >
          <label className="sm:w-60">
            <span className="sr-only">Filtrar por categoría</span>
            <select
              name="categoria"
              defaultValue={filters.categoria}
              className="border-border bg-surface h-10 w-full rounded-xl border px-3 text-sm"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:w-52">
            <span className="sr-only">Ordenar por</span>
            <select
              name="orden"
              defaultValue={filters.orden}
              className="border-border bg-surface h-10 w-full rounded-xl border px-3 text-sm"
            >
              <option value="">Ordenar: última modificación</option>
              {PRODUCT_SORTS.map((s: string) => (
                <option key={s} value={s}>
                  {PRODUCT_SORT_LABEL[s as keyof typeof PRODUCT_SORT_LABEL]}
                </option>
              ))}
            </select>
          </label>
        </SearchForm>
        <FilterTabs tabs={tabs} label="Filtrar por estado" />
      </div>
      <ProductsTable
        products={result.items}
        canWrite={canWrite}
        canDelete={hasPermission(user, "products:delete")}
      />
      <div className="mt-6">
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          hrefFor={(p) => hrefWith(BASE, filters, { pagina: p })}
        />
      </div>
    </PageTransition>
  );
}
