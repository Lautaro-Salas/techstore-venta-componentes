import Link from "next/link";
import { AdminTable, EmptyRow } from "@/components/admin/admin-table";
import { DiscountRowActions } from "./discount-row-actions";
import { formatDate, formatPrice } from "@/lib/format";
import type {
  CouponRow,
  PromotionRow,
} from "@/services/admin/discounts.service";

const COUPON_HEAD = [
  { label: "Código" },
  { label: "Descuento" },
  { label: "Vigencia" },
  { label: "Usos", className: "text-right" },
  { label: "Estado" },
  { label: "Acciones", srOnly: true },
];

const PROMOTION_HEAD = [
  { label: "Nombre" },
  { label: "Descuento" },
  { label: "Vigencia" },
  { label: "Alcance" },
  { label: "Estado" },
  { label: "Acciones", srOnly: true },
];

function formatVigencia(
  startsAt: Date | null,
  endsAt: Date | null,
): string {
  if (startsAt && endsAt)
    return `${formatDate(startsAt)} – ${formatDate(endsAt)}`;
  if (startsAt) return `Desde ${formatDate(startsAt)}`;
  if (endsAt) return `Hasta ${formatDate(endsAt)}`;
  return "Sin límite";
}

const discountValue = (type: "PERCENTAGE" | "FIXED", value: number) =>
  type === "PERCENTAGE" ? `${value}%` : formatPrice(value);

interface TableProps {
  canWrite: boolean;
  canDelete: boolean;
}

export function CouponsTable({
  coupons,
  canWrite,
  canDelete,
}: { coupons: CouponRow[] } & TableProps) {
  return (
    <AdminTable caption="Listado de cupones" head={COUPON_HEAD}>
      <tbody>
        {coupons.length === 0 ? (
          <EmptyRow
            colSpan={COUPON_HEAD.length}
            message="No hay cupones con esos filtros."
          />
        ) : (
          coupons.map((c) => (
            <tr key={c.id}>
              <td>
                <Link
                  href={`/admin/descuentos/cupones/${c.id}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {c.code}
                </Link>
                {c.description && (
                  <span className="block max-w-[280px] truncate text-xs text-muted">
                    {c.description}
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap">
                {discountValue(c.type, c.value)}
              </td>
              <td className="whitespace-nowrap text-muted">
                {formatVigencia(c.startsAt, c.endsAt)}
              </td>
              <td className="text-right tabular-nums">
                {c.usedCount}
                {c.maxUses !== null && ` / ${c.maxUses}`}
              </td>
              <td>{c.isActive ? "Activo" : "Inactivo"}</td>
              <td>
                <div className="flex justify-end gap-1">
                  <DiscountRowActions
                    kind="coupon"
                    id={c.id}
                    name={c.code}
                    isActive={c.isActive}
                    editHref={`/admin/descuentos/cupones/${c.id}`}
                    canWrite={canWrite}
                    canDelete={canDelete}
                  />
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </AdminTable>
  );
}

export function PromotionsTable({
  promotions,
  canWrite,
  canDelete,
}: { promotions: PromotionRow[] } & TableProps) {
  return (
    <AdminTable caption="Listado de promociones" head={PROMOTION_HEAD}>
      <tbody>
        {promotions.length === 0 ? (
          <EmptyRow
            colSpan={PROMOTION_HEAD.length}
            message="No hay promociones con esos filtros."
          />
        ) : (
          promotions.map((p) => (
            <tr key={p.id}>
              <td>
                <Link
                  href={`/admin/descuentos/promociones/${p.id}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {p.name}
                </Link>
                {p.description && (
                  <span className="block max-w-[280px] truncate text-xs text-muted">
                    {p.description}
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap">
                {discountValue(p.type, p.value)}
              </td>
              <td className="whitespace-nowrap text-muted">
                {formatVigencia(p.startsAt, p.endsAt)}
              </td>
              <td className="whitespace-nowrap text-muted">
                {p.categoriesCount === 0 && p.productsCount === 0
                  ? "Todo el catálogo"
                  : `${p.categoriesCount} categorías · ${p.productsCount} productos`}
              </td>
              <td>{p.isActive ? "Activa" : "Inactiva"}</td>
              <td>
                <div className="flex justify-end gap-1">
                  <DiscountRowActions
                    kind="promotion"
                    id={p.id}
                    name={p.name}
                    isActive={p.isActive}
                    editHref={`/admin/descuentos/promociones/${p.id}`}
                    canWrite={canWrite}
                    canDelete={canDelete}
                  />
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </AdminTable>
  );
}
