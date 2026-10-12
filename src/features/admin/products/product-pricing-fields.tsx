"use client";

import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Checkbox, Input, Select } from "@/components/ui/field";
import { PRODUCT_STATUS_LABEL } from "@/components/admin/labels";
import { PRODUCT_STATUSES } from "@/schemas/admin";
import type { ProductSectionProps } from "./product-form-values";

export interface CurrentStock {
  productId: string;
  quantity: number;
  available: number;
}

const STATUS_OPTIONS = PRODUCT_STATUSES.map((s) => ({ value: s, label: PRODUCT_STATUS_LABEL[s] }));

export function ProductPricingFields({ values, set, errors, stock }: ProductSectionProps & { stock?: CurrentStock }) {
  return (
    <Card>
      <CardHeader title="Precio, stock y publicación" />
      <CardBody className="grid gap-4 sm:grid-cols-3">
        <Input label="Precio (ARS)" required inputMode="numeric" value={values.price} onChange={(e) => set("price", e.target.value)} error={errors.price} />
        <Input label="Precio anterior" inputMode="numeric" value={values.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} error={errors.compareAtPrice} hint="Se muestra tachado" />
        <Input label="Costo" inputMode="numeric" value={values.cost} onChange={(e) => set("cost", e.target.value)} error={errors.cost} hint="Uso interno" />
        {stock ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Stock actual</span>
            <p className="flex h-11 items-center rounded-xl bg-surface-2 px-3.5 text-sm tabular-nums">
              {stock.quantity} unidades · {stock.available} disponibles
            </p>
            <Link href={`/admin/inventario?producto=${stock.productId}`} className="text-xs font-medium text-primary hover:underline">
              Ajustar en inventario
            </Link>
          </div>
        ) : (
          <Input label="Stock inicial" inputMode="numeric" value={values.initialStock} onChange={(e) => set("initialStock", e.target.value)} error={errors.initialStock} hint="Se registra como ingreso" />
        )}
        <Input label="Stock mínimo" required inputMode="numeric" value={values.minStock} onChange={(e) => set("minStock", e.target.value)} error={errors.minStock} hint="Alerta de stock bajo" />
        <Select label="Estado" required options={STATUS_OPTIONS} value={values.status} onChange={(e) => set("status", e.target.value as ProductSectionProps["values"]["status"])} error={errors.status} />
        <Checkbox
          label="Producto destacado (aparece en la portada)"
          checked={values.isFeatured}
          onChange={(e) => set("isFeatured", e.target.checked)}
          className="sm:col-span-3"
        />
      </CardBody>
    </Card>
  );
}

export function ProductLogisticsFields({ values, set, errors }: ProductSectionProps) {
  return (
    <Card>
      <CardHeader title="Envío y garantía" />
      <CardBody className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Input label="Peso (g)" inputMode="numeric" value={values.weightGrams} onChange={(e) => set("weightGrams", e.target.value)} error={errors.weightGrams} />
        <Input label="Largo (mm)" inputMode="numeric" value={values.lengthMm} onChange={(e) => set("lengthMm", e.target.value)} error={errors.lengthMm} />
        <Input label="Ancho (mm)" inputMode="numeric" value={values.widthMm} onChange={(e) => set("widthMm", e.target.value)} error={errors.widthMm} />
        <Input label="Alto (mm)" inputMode="numeric" value={values.heightMm} onChange={(e) => set("heightMm", e.target.value)} error={errors.heightMm} />
        <Input label="Garantía (meses)" required inputMode="numeric" value={values.warrantyMonths} onChange={(e) => set("warrantyMonths", e.target.value)} error={errors.warrantyMonths} />
      </CardBody>
    </Card>
  );
}
