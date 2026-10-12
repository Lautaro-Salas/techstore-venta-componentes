import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { PageTransition } from "@/components/navigation/page-transition";
import { DiscountForm } from "@/features/admin/discounts/discount-form";
import { promotionToFormValues } from "@/features/admin/discounts/discount-form-values";
import { requirePermissionPage } from "@/lib/auth/guards";
import { getCategoryOptions } from "@/services/admin/products.service";
import {
  getDiscountProducts,
  getPromotionForEdit,
} from "@/services/admin/discounts.service";

export const metadata: Metadata = { title: "Editar promoción" };

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage("discounts:write", "/admin/descuentos");
  const { id } = await params;
  const promotion = await getPromotionForEdit(id);
  if (!promotion) notFound();
  const [categories, products] = await Promise.all([
    getCategoryOptions(),
    getDiscountProducts(promotion.products.map((p) => p.id)),
  ]);

  return (
    <PageTransition>
      <PageHeader
        title={promotion.name}
        description="Modificá el descuento automático, su vigencia o su alcance."
        back={{ href: "/admin/descuentos", label: "Descuentos" }}
      />
      <DiscountForm
        mode="promotion"
        initial={promotionToFormValues(promotion)}
        initialProducts={products.map((p) => ({ id: p.id, name: p.name }))}
        categories={categories}
        discountId={promotion.id}
      />
    </PageTransition>
  );
}
