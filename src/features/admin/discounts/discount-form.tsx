"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Checkbox, Input, Select } from "@/components/ui/field";
import { useSchemaForm } from "@/features/admin/shared/use-schema-form";
import {
  DISCOUNT_TYPES,
  couponSchema,
  promotionSchema,
} from "@/schemas/admin";

type DiscountType = (typeof DISCOUNT_TYPES)[number];
import {
  saveCouponAction,
  savePromotionAction,
} from "./actions";
import {
  type DiscountFormValues,
  type SelectedProduct,
} from "./discount-form-values";
import { DiscountProductPicker } from "./discount-product-picker";

const TYPE_OPTIONS = DISCOUNT_TYPES.map((type) => ({
  value: type,
  label: type === "PERCENTAGE" ? "Porcentaje" : "Monto fijo",
}));

interface Props {
  mode: "coupon" | "promotion";
  initial: DiscountFormValues;
  /** Productos ya seleccionados con nombre (edición). */
  initialProducts: SelectedProduct[];
  categories: { value: string; label: string }[];
  discountId?: string;
}

/** Formulario de creación/edición de cupones y promociones. */
export function DiscountForm({
  mode,
  initial,
  initialProducts,
  categories,
  discountId,
}: Props) {
  const router = useRouter();
  const isCoupon = mode === "coupon";
  const [selectedProducts, setSelectedProducts] =
    useState<SelectedProduct[]>(initialProducts);
  const { values, set, errors, pending, handleSubmit } = useSchemaForm<
    DiscountFormValues,
    { id: string }
  >({
    schema: isCoupon ? couponSchema : promotionSchema,
    initial,
    submit: (formValues) =>
      isCoupon
        ? saveCouponAction(formValues, discountId)
        : savePromotionAction(formValues, discountId),
    successMessage: isCoupon ? "Cupón guardado" : "Promoción guardada",
    onSuccess: () => router.refresh(),
  });

  const setProducts = (products: SelectedProduct[]) => {
    setSelectedProducts(products);
    set(
      "productIds",
      products.map((p) => p.id),
    );
  };

  const toggleCategory = (id: string) =>
    set(
      "categoryIds",
      values.categoryIds.includes(id)
        ? values.categoryIds.filter((c) => c !== id)
        : [...values.categoryIds, id],
    );

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Card>
        <CardHeader
          title={isCoupon ? "Datos del cupón" : "Datos de la promoción"}
          description="El descuento se aplica en el carrito y el checkout."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          {isCoupon ? (
            <Input
              label="Código"
              required
              value={values.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              error={errors.code}
              maxLength={40}
              hint="Se guarda en mayúsculas (ej: TECH10)"
            />
          ) : (
            <Input
              label="Nombre"
              required
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              error={errors.name}
              maxLength={120}
            />
          )}
          <Select
            label="Tipo de descuento"
            required
            options={TYPE_OPTIONS}
            value={values.type}
            onChange={(e) => set("type", e.target.value as DiscountType)}
            error={errors.type}
          />
          <Input
            label={values.type === "PERCENTAGE" ? "Porcentaje" : "Monto (ARS)"}
            required
            inputMode="numeric"
            value={values.value}
            onChange={(e) => set("value", e.target.value)}
            error={errors.value}
            hint={
              values.type === "PERCENTAGE"
                ? "Entre 1 y 100"
                : "En pesos, sin centavos"
            }
          />
          <Input
            label="Descripción"
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            error={errors.description}
            maxLength={300}
            containerClassName="sm:col-span-2"
          />
          <Input
            label="Vigencia desde"
            type="date"
            value={values.startsAt}
            onChange={(e) => set("startsAt", e.target.value)}
            error={errors.startsAt}
            hint="Opcional. Formato AAAA-MM-DD"
          />
          <Input
            label="Vigencia hasta"
            type="date"
            value={values.endsAt}
            onChange={(e) => set("endsAt", e.target.value)}
            error={errors.endsAt}
            hint="Opcional. Fin del día inclusive"
          />
          <Input
            label="Subtotal mínimo"
            inputMode="numeric"
            value={values.minSubtotal}
            onChange={(e) => set("minSubtotal", e.target.value)}
            error={errors.minSubtotal}
            hint="Opcional. En pesos"
          />
          {isCoupon && (
            <>
              <Input
                label="Usos máximos"
                inputMode="numeric"
                value={values.maxUses}
                onChange={(e) => set("maxUses", e.target.value)}
                error={errors.maxUses}
                hint="Opcional. Vacío = ilimitado"
              />
              <Input
                label="Usos por usuario"
                inputMode="numeric"
                value={values.maxUsesPerUser}
                onChange={(e) => set("maxUsesPerUser", e.target.value)}
                error={errors.maxUsesPerUser}
                hint="Opcional. Vacío = ilimitado"
              />
            </>
          )}
          <Checkbox
            label="Publicado (visible en la tienda)"
            checked={values.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
          />
        </CardBody>
      </Card>
      <Card>
        <CardHeader
          title="Alcance"
          description="Sin categorías ni productos seleccionados, aplica a todo el catálogo."
        />
        <CardBody className="flex flex-col gap-5">
          {categories.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">Categorías</legend>
              <div className="flex flex-col gap-1.5">
                {categories.map((category) => (
                  <Checkbox
                    key={category.value}
                    label={category.label}
                    checked={values.categoryIds.includes(category.value)}
                    onChange={() => toggleCategory(category.value)}
                  />
                ))}
              </div>
            </fieldset>
          )}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Productos</span>
            <DiscountProductPicker
              selected={selectedProducts}
              onChange={setProducts}
            />
          </div>
        </CardBody>
      </Card>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={pending}
          icon={<Save className="size-4" aria-hidden />}
        >
          Guardar
        </Button>
      </div>
    </form>
  );
}
