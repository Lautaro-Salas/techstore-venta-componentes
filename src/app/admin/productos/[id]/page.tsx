import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { PageTransition } from "@/components/navigation/page-transition";
import { productToFormValues } from "@/features/admin/products/product-form-values";
import { ProductForm } from "@/features/admin/products/product-form";
import { requirePermissionPage } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/format";
import {
  getBrandOptions,
  getCategoryOptions,
  getProductForEdit,
} from "@/services/admin/products.service";

export const metadata: Metadata = { title: "Editar producto" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage("products:write", "/admin/productos");
  const { id } = await params;
  const [product, brands, categories] = await Promise.all([
    getProductForEdit(id),
    getBrandOptions(),
    getCategoryOptions(),
  ]);
  if (!product) notFound();

  return (
    <PageTransition>
      <PageHeader
        title={product.name}
        description={`SKU ${product.sku} · modificado ${formatDateTime(product.updatedAt)}`}
        back={{ href: "/admin/productos", label: "Productos" }}
      />
      <ProductForm
        initial={productToFormValues(product)}
        brands={brands}
        categories={categories}
        productId={product.id}
        stock={{
          productId: product.id,
          quantity: product.stockQuantity,
          available: product.availableStock,
        }}
        submitLabel="Guardar cambios"
      />
    </PageTransition>
  );
}
