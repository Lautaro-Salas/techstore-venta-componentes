import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { PageTransition } from "@/components/navigation/page-transition";
import { DiscountForm } from "@/features/admin/discounts/discount-form";
import { couponToFormValues } from "@/features/admin/discounts/discount-form-values";
import { requirePermissionPage } from "@/lib/auth/guards";
import {
  getCategoryOptions,
} from "@/services/admin/products.service";
import {
  getCouponForEdit,
  getDiscountProducts,
} from "@/services/admin/discounts.service";

export const metadata: Metadata = { title: "Editar cupón" };

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage("discounts:write", "/admin/descuentos");
  const { id } = await params;
  const coupon = await getCouponForEdit(id);
  if (!coupon) notFound();
  const [categories, products] = await Promise.all([
    getCategoryOptions(),
    getDiscountProducts(coupon.products.map((p) => p.id)),
  ]);

  return (
    <PageTransition>
      <PageHeader
        title={`Cupón ${coupon.code}`}
        description="Modificá el código, el descuento o su vigencia."
        back={{ href: "/admin/descuentos", label: "Descuentos" }}
      />
      <DiscountForm
        mode="coupon"
        initial={couponToFormValues(coupon)}
        initialProducts={products.map((p) => ({ id: p.id, name: p.name }))}
        categories={categories}
        discountId={coupon.id}
      />
    </PageTransition>
  );
}
