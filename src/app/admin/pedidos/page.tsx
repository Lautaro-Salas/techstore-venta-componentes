import type { Metadata } from "next";
import { FilterTabs } from "@/components/admin/filter-tabs";
import { PageHeader } from "@/components/admin/page-header";
import {
  hrefWith,
  readPage,
  readParam,
  type AdminSearchParams,
} from "@/components/admin/query";
import { SearchForm } from "@/components/admin/search-form";
import { PageTransition } from "@/components/navigation/page-transition";
import { Pagination } from "@/components/ui/pagination";
import { requirePermissionPage } from "@/lib/auth/guards";
import { OrdersTable } from "@/features/admin/orders/orders-table";
import { ORDER_STATUS_LABEL } from "@/services/orders/status";
import { ORDER_STATUSES } from "@/services/orders/status";
import { listAdminOrders } from "@/services/admin/orders.service";
import { readOrderStatus } from "@/app/admin/_lib/filters";

export const metadata: Metadata = { title: "Pedidos" };

const BASE = "/admin/pedidos";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  await requirePermissionPage("orders:read", BASE);
  const sp = await searchParams;
  const filters = {
    q: readParam(sp, "q"),
    estado: readParam(sp, "estado"),
  };
  const status = readOrderStatus(filters.estado);
  const result = await listAdminOrders({
    q: filters.q,
    status,
    page: readPage(sp),
  });

  const tabs = [
    {
      label: "Todos",
      href: hrefWith(BASE, filters, { estado: undefined, pagina: undefined }),
      active: !status,
    },
    ...ORDER_STATUSES.map((s) => ({
      label: ORDER_STATUS_LABEL[s],
      href: hrefWith(BASE, filters, { estado: s, pagina: undefined }),
      active: status === s,
    })),
  ];

  return (
    <PageTransition>
      <PageHeader
        title="Pedidos"
        description={`${result.total} pedidos encontrados`}
      />
      <div className="mb-4 flex flex-col gap-3">
        <SearchForm
          action={BASE}
          defaultValue={filters.q}
          placeholder="Buscar por número, email o nombre"
          label="Buscar pedidos"
          hidden={{ estado: filters.estado }}
        />
        <FilterTabs tabs={tabs} label="Filtrar por estado" />
      </div>
      <OrdersTable orders={result.items} />
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
