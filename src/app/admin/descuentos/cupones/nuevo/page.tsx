import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { PageTransition } from "@/components/navigation/page-transition";
import { DiscountForm } from "@/features/admin/discounts/discount-form";
import {
  emptyDiscountValues,
} from "@/features/admin/discounts/discount-form-values";
import { requirePermissionPage } from "@/lib/auth/guards";
import { getCategoryOptions } from "@/services/admin/products.service";

export const metadata: Metadata = { title: "Nuevo cupón" };

export default async function NewCouponPage() {
  await requirePermissionPage("discounts:write", "/admin/descuentos");
  const categories = await getCategoryOptions();

  return (
    <PageTransition>
      <PageHeader
        title="Nuevo cupón"
        description="Código de descuento que el cliente aplica en el carrito."
        back={{ href: "/admin/descuentos", label: "Descuentos" }}
      />
      <DiscountForm
        mode="coupon"
        initial={emptyDiscountValues()}
        initialProducts={[]}
        categories={categories}
      />
    </PageTransition>
  );
}
