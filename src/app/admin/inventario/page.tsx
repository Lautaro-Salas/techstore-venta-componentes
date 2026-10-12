import type { Metadata } from "next";
import { AlertTriangle, Boxes, PackageX } from "lucide-react";
import { FilterTabs } from "@/components/admin/filter-tabs";
import { PageHeader } from "@/components/admin/page-header";
import {
  hrefWith,
  readPage,
  readParam,
  type AdminSearchParams,
} from "@/components/admin/query";
import { SearchForm } from "@/components/admin/search-form";
import { StatCard } from "@/components/admin/stat-card";
import { PageTransition } from "@/components/navigation/page-transition";
import { Pagination } from "@/components/ui/pagination";
import { requirePermissionPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { InventoryTable } from "@/features/admin/inventory/inventory-table";
import { MovementsList } from "@/features/admin/inventory/movements-list";
import { StockAdjustModal } from "@/features/admin/inventory/stock-adjust-modal";
import {
  getInventoryRow,
  getInventorySummary,
  getProductMovements,
  INVENTORY_FILTERS,
  listInventory,
  type InventoryFilter,
} from "@/services/admin/inventory.service";

export const metadata: Metadata = { title: "Inventario" };

const BASE = "/admin/inventario";

const FILTER_LABEL: Record<InventoryFilter, string> = {
  todos: "Todos",
  bajo: "Stock bajo",
  "sin-stock": "Sin stock",
  alerta: "En alerta",
};

function readFilter(value: string): InventoryFilter {
  return (INVENTORY_FILTERS as readonly string[]).includes(value)
    ? (value as InventoryFilter)
    : "todos";
}

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const user = await requirePermissionPage("inventory:read", BASE);
  const sp = await searchParams;
  const filters = {
    q: readParam(sp, "q"),
    filtro: readParam(sp, "filtro"),
    producto: readParam(sp, "producto"),
  };
  const filter = readFilter(filters.filtro);
  const [result, summary, selected, movements] = await Promise.all([
    listInventory({ filter, q: filters.q, page: readPage(sp) }),
    getInventorySummary(),
    filters.producto ? getInventoryRow(filters.producto) : Promise.resolve(null),
    filters.producto ? getProductMovements(filters.producto) : Promise.resolve(null),
  ]);
  const canWrite = hasPermission(user, "inventory:write");
  const inAlert = summary.low + summary.out;

  const tabs = INVENTORY_FILTERS.map((f) => ({
    label: FILTER_LABEL[f],
    href: hrefWith(BASE, filters, { filtro: f, pagina: undefined, producto: undefined }),
    active: filter === f,
  }));

  return (
    <PageTransition>
      <PageHeader
        title="Inventario"
        description="Stock agregado por producto (suma de todos los depósitos)."
      />
      <section
        aria-label="Resumen de stock"
        className="mb-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3"
      >
        <StatCard
          label="En alerta"
          value={String(inAlert)}
          hint="Stock bajo o sin stock"
          icon={<AlertTriangle />}
          tone={inAlert > 0 ? "warning" : "success"}
          href={hrefWith(BASE, {}, { filtro: "alerta" })}
        />
        <StatCard
          label="Stock bajo"
          value={String(summary.low)}
          hint="Al límite o bajo el mínimo"
          icon={<Boxes />}
          tone="warning"
          href={hrefWith(BASE, {}, { filtro: "bajo" })}
        />
        <StatCard
          label="Sin stock"
          value={String(summary.out)}
          hint="Disponible en 0"
          icon={<PackageX />}
          tone="danger"
          href={hrefWith(BASE, {}, { filtro: "sin-stock" })}
        />
      </section>
      <div className="mb-4 flex flex-col gap-3">
        <SearchForm
          action={BASE}
          defaultValue={filters.q}
          placeholder="Buscar por nombre o SKU"
          label="Buscar productos"
          hidden={{ filtro: filters.filtro }}
        />
        <FilterTabs tabs={tabs} label="Filtrar por stock" />
      </div>
      <InventoryTable
        products={result.items}
        selectedId={selected?.id}
        canWrite={canWrite}
        hrefForProduct={(id) => hrefWith(BASE, filters, { producto: id, pagina: undefined })}
      />
      <div className="mt-6">
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          hrefFor={(p) => hrefWith(BASE, filters, { pagina: p, producto: undefined })}
        />
      </div>
      {selected && canWrite && <StockAdjustModal product={selected} filters={filters} />}
      {movements && (
        <div className="mt-6">
          <MovementsList product={movements.product} movements={movements.movements} />
        </div>
      )}
    </PageTransition>
  );
}
