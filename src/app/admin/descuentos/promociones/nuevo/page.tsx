import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { PageTransition } from "@/components/navigation/page-transition";
import { DiscountForm } from "@/features/admin/discounts/discount-form";
import { emptyDiscountValues } from "@/features/admin/discounts/discount-form-values";
import { requirePermissionPage } from "@/lib/auth/guards";
import { getCategoryOptions } from "@/services/admin/products.service";

export const metadata: Metadata = { title: "Nueva promoción" };

export default async function NewPromotionPage() {
  await requirePermissionPage("discounts:write", "/admin/descuentos");
  const categories = await getCategoryOptions();

  return (
    <PageTransition>
      <PageHeader
        title="Nueva promoción"
        description="Descuento automático: se aplica sin código al cumplir las condiciones."
        back={{ href: "/admin/descuentos", label: "Descuentos" }}
      />
      <DiscountForm
        mode="promotion"
        initial={emptyDiscountValues()}
        initialProducts={[]}
        categories={categories}
      />
    </PageTransition>
  );
}
