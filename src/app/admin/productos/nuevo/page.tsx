import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { PageTransition } from "@/components/navigation/page-transition";
import { emptyProductValues } from "@/features/admin/products/product-form-values";
import { ProductForm } from "@/features/admin/products/product-form";
import { requirePermissionPage } from "@/lib/auth/guards";
import { getBrandOptions, getCategoryOptions } from "@/services/admin/products.service";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NewProductPage() {
  await requirePermissionPage("products:write", "/admin/productos");
  const [brands, categories] = await Promise.all([getBrandOptions(), getCategoryOptions()]);

  return (
    <PageTransition>
      <PageHeader
        title="Nuevo producto"
        description="Completá la ficha. Podés guardarlo como borrador y publicarlo después."
        back={{ href: "/admin/productos", label: "Productos" }}
      />
      <ProductForm
        initial={emptyProductValues()}
        brands={brands}
        categories={categories}
        submitLabel="Crear producto"
      />
    </PageTransition>
  );
}
