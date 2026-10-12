"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSchemaForm } from "@/features/admin/shared/use-schema-form";
import { productSchema, type ProductFormValues } from "@/schemas/admin";
import { saveProductAction } from "./actions";
import { ProductImagesEditor } from "./product-images-editor";
import {
  ProductLogisticsFields,
  ProductPricingFields,
  type CurrentStock,
} from "./product-pricing-fields";
import { ProductMainFields } from "./product-main-fields";
import { ProductSpecsEditor } from "./product-specs-editor";

interface Props {
  initial: ProductFormValues;
  brands: { value: string; label: string }[];
  categories: { value: string; label: string }[];
  productId?: string;
  stock?: CurrentStock;
  submitLabel: string;
}

/** Formulario completo de creación/edición de producto. */
export function ProductForm({ initial, brands, categories, productId, stock, submitLabel }: Props) {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(false);
  const { values, set, errors, pending, handleSubmit } = useSchemaForm<ProductFormValues, { id: string }>({
    schema: productSchema,
    initial,
    submit: (v) => saveProductAction(v, productId),
    successMessage: productId ? "Producto actualizado" : "Producto creado",
    onSuccess: ({ id }) => {
      if (productId) router.refresh();
      else router.push(`/admin/productos/${id}`);
    },
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <ProductMainFields
        values={values}
        set={set}
        errors={errors}
        brands={brands}
        categories={categories}
        slugTouched={slugTouched}
        onSlugTouched={() => setSlugTouched(true)}
      />
      <ProductImagesEditor values={values} set={set} errors={errors} />
      <ProductPricingFields values={values} set={set} errors={errors} stock={stock} />
      <ProductLogisticsFields values={values} set={set} errors={errors} />
      <ProductSpecsEditor values={values} set={set} errors={errors} />
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" loading={pending} icon={<Save className="size-4" aria-hidden />}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
