import type { Metadata } from "next";
import { Plus } from "lucide-react";
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
import { ButtonLink } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { requirePermissionPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { CouponsTable, PromotionsTable } from "@/features/admin/discounts/discounts-table";
import {
  listCoupons,
  listPromotions,
  type CouponRow,
  type PromotionRow,
} from "@/services/admin/discounts.service";

export const metadata: Metadata = { title: "Descuentos" };

const BASE = "/admin/descuentos";

type DiscountKind = "coupon" | "promotion";

function readKind(value: string): DiscountKind {
  return value === "promotion" ? "promotion" : "coupon";
}

export default async function AdminDiscountsPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const user = await requirePermissionPage("discounts:read", BASE);
  const sp = await searchParams;
  const kind = readKind(readParam(sp, "tipo"));
  const filters = { q: readParam(sp, "q"), tipo: kind };
  const result =
    kind === "coupon"
      ? await listCoupons({ q: filters.q, page: readPage(sp) })
      : await listPromotions({ q: filters.q, page: readPage(sp) });
  const canWrite = hasPermission(user, "discounts:write");

  const tabs = (
    [
      { kind: "coupon", label: "Cupones" },
      { kind: "promotion", label: "Promociones" },
    ] as const
  ).map((tab) => ({
    label: tab.label,
    href: hrefWith(BASE, filters, { tipo: tab.kind, pagina: undefined }),
    active: kind === tab.kind,
  }));

  return (
    <PageTransition>
      <PageHeader
        title="Descuentos"
        description={`${result.total} ${kind === "coupon" ? "cupones" : "promociones"} encontrados`}
        actions={
          canWrite && (
            <ButtonLink
              href={
                kind === "coupon"
                  ? `${BASE}/cupones/nuevo`
                  : `${BASE}/promociones/nuevo`
              }
              icon={<Plus className="size-4" aria-hidden />}
            >
              {kind === "coupon" ? "Nuevo cupón" : "Nueva promoción"}
            </ButtonLink>
          )
        }
      />
      <div className="mb-4 flex flex-col gap-3">
        <SearchForm
          action={BASE}
          defaultValue={filters.q}
          placeholder="Buscar por código, nombre o descripción"
          label="Buscar descuentos"
          hidden={{ tipo: kind }}
        />
        <FilterTabs tabs={tabs} label="Tipo de descuento" />
      </div>
      {kind === "coupon" ? (
        <CouponsTable
          coupons={result.items as CouponRow[]}
          canWrite={canWrite}
          canDelete={canWrite}
        />
      ) : (
        <PromotionsTable
          promotions={result.items as PromotionRow[]}
          canWrite={canWrite}
          canDelete={canWrite}
        />
      )}
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
