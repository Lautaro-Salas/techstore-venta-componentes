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
import { hasPermission } from "@/lib/auth/permissions";
import { ROLES } from "@/lib/auth/permissions";
import { CustomersTable } from "@/features/admin/customers/customers-table";
import { ROLE_LABEL } from "@/components/admin/labels";
import { listAdminCustomers } from "@/services/admin/customers.service";

export const metadata: Metadata = { title: "Clientes" };

const BASE = "/admin/clientes";

function readRole(value: string): string | undefined {
  return (ROLES as readonly string[]).includes(value) ? value : undefined;
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const user = await requirePermissionPage("customers:read", BASE);
  const sp = await searchParams;
  const filters = {
    q: readParam(sp, "q"),
    rol: readParam(sp, "rol"),
  };
  const role = readRole(filters.rol);
  const result = await listAdminCustomers({
    q: filters.q,
    role,
    page: readPage(sp),
  });
  const canManage = hasPermission(user, "users:manage");

  const tabs = [
    {
      label: "Todos",
      href: hrefWith(BASE, filters, { rol: undefined, pagina: undefined }),
      active: !role,
    },
    ...ROLES.map((r) => ({
      label: ROLE_LABEL[r] ?? r,
      href: hrefWith(BASE, filters, { rol: r, pagina: undefined }),
      active: role === r,
    })),
  ];

  return (
    <PageTransition>
      <PageHeader
        title="Clientes"
        description={`${result.total} usuarios registrados`}
      />
      <div className="mb-4 flex flex-col gap-3">
        <SearchForm
          action={BASE}
          defaultValue={filters.q}
          placeholder="Buscar por nombre o email"
          label="Buscar usuarios"
          hidden={{ rol: filters.rol }}
        />
        <FilterTabs tabs={tabs} label="Filtrar por rol" />
      </div>
      <CustomersTable customers={result.items} canManage={canManage} />
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
