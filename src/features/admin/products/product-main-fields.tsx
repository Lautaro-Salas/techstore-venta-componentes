"use client";

import { Input, Select, Textarea } from "@/components/ui/field";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { slugify } from "@/lib/utils";
import type { ProductSectionProps } from "./product-form-values";

interface Props extends ProductSectionProps {
  brands: { value: string; label: string }[];
  categories: { value: string; label: string }[];
  slugTouched: boolean;
  onSlugTouched: () => void;
}

export function ProductMainFields({ values, set, errors, brands, categories, slugTouched, onSlugTouched }: Props) {
  const onNameChange = (name: string) => {
    set("name", name);
    if (!slugTouched) set("slug", slugify(name));
  };

  return (
    <Card>
      <CardHeader title="Información general" />
      <CardBody className="grid gap-4 sm:grid-cols-2">
        <Input label="Nombre" required value={values.name} onChange={(e) => onNameChange(e.target.value)} error={errors.name} maxLength={200} containerClassName="sm:col-span-2" />
        <Input label="SKU" required value={values.sku} onChange={(e) => set("sku", e.target.value)} error={errors.sku} maxLength={60} hint="Código interno único" />
        <Input
          label="Slug (URL)"
          required
          value={values.slug}
          onChange={(e) => {
            onSlugTouched();
            set("slug", e.target.value);
          }}
          error={errors.slug}
          maxLength={200}
          hint="Se genera a partir del nombre; podés editarlo"
        />
        <Select label="Marca" required placeholder="Elegí una marca" options={brands} value={values.brandId} onChange={(e) => set("brandId", e.target.value)} error={errors.brandId} />
        <Select label="Categoría" required placeholder="Elegí una categoría" options={categories} value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)} error={errors.categoryId} />
        <Input
          label="Descripción corta"
          value={values.shortDescription}
          onChange={(e) => set("shortDescription", e.target.value)}
          error={errors.shortDescription}
          maxLength={300}
          containerClassName="sm:col-span-2"
        />
        <Textarea
          label="Descripción"
          required
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          error={errors.description}
          rows={8}
          containerClassName="sm:col-span-2"
        />
        <Input
          label="Tags"
          value={values.tags}
          onChange={(e) => set("tags", e.target.value)}
          error={errors.tags}
          hint="Separados por coma: gamer, rgb, wifi"
          containerClassName="sm:col-span-2"
        />
      </CardBody>
    </Card>
  );
}
