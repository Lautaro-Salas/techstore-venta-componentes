import { z } from "zod";
import { idSchema } from "./common";

/* ------------------------------------------------------------------ */
/*  Límites compartidos entre cliente y servidor                        */
/* ------------------------------------------------------------------ */

export const MAX_MONEY = 1_000_000_000;
export const MAX_STOCK = 1_000_000;
export const MAX_DIMENSION = 100_000;
export const MAX_WARRANTY_MONTHS = 120;
export const MAX_IMAGES = 12;
export const MAX_SPECS = 80;
export const MAX_TAGS = 30;
export const MAX_PERCENT = 100;
export const MAX_INSTALLMENTS = 36;
export const BPS_PER_PERCENT = 100;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;
export type AllowedImageType = keyof typeof ALLOWED_IMAGE_TYPES;

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"] as const;
export const DISCOUNT_TYPES = ["PERCENTAGE", "FIXED"] as const;
export const CONTACT_STATUSES = ["NEW", "READ", "ANSWERED"] as const;
export const SHIPPING_TYPES = ["HOME_DELIVERY", "PICKUP"] as const;
const ORDER_STATUS_VALUES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

/* ------------------------------------------------------------------ */
/*  Helpers: los formularios manejan strings y el esquema los convierte */
/* ------------------------------------------------------------------ */

const NUMBER_ERROR = "Ingresá un número entero válido";

function requiredInt(max: number, min = 0) {
  return z
    .string()
    .trim()
    .min(1, "Este campo es obligatorio")
    .transform(Number)
    .pipe(
      z
        .number({ error: NUMBER_ERROR })
        .int(NUMBER_ERROR)
        .min(min, `Debe ser ${min} o más`)
        .max(max, `Debe ser ${max} o menos`),
    );
}

function optionalInt(max: number, min = 0) {
  return z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .pipe(
      z
        .number({ error: NUMBER_ERROR })
        .int(NUMBER_ERROR)
        .min(min, `Debe ser ${min} o más`)
        .max(max, `Debe ser ${max} o menos`)
        .nullable(),
    );
}

const optionalText = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`);
const idList = z.array(idSchema).max(500);
const dayKey = z
  .string()
  .trim()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Fecha inválida");

/* ------------------------------------------------------------------ */
/*  Productos                                                          */
/* ------------------------------------------------------------------ */

/** Ruta local servida desde /public (subidas o imágenes existentes). */
export const IMAGE_PATH_PATTERN = /^\/(?!\/)[\w\-./]+\.(jpe?g|png|webp|avif|svg)$/i;

export const productImageSchema = z.object({
  url: z
    .string()
    .trim()
    .regex(IMAGE_PATH_PATTERN, "Usá una ruta local, por ejemplo /images/products/foto.webp"),
  alt: optionalText(200),
});

export const productSpecSchema = z.object({
  group: optionalText(60),
  key: z
    .string()
    .trim()
    .min(1, "Ingresá la clave")
    .max(60)
    .regex(/^[a-z0-9_]+$/, "Solo minúsculas, números y _"),
  label: z.string().trim().min(1, "Ingresá la etiqueta").max(80),
  value: z.string().trim().min(1, "Ingresá el valor").max(200),
  filterable: z.boolean(),
});

export const productSchema = z
  .object({
    name: z.string().trim().min(3, "Ingresá un nombre (mínimo 3 caracteres)").max(200),
    sku: z
      .string()
      .trim()
      .min(2, "Ingresá el SKU")
      .max(60)
      .regex(/^[A-Za-z0-9._-]+$/, "Solo letras, números, puntos y guiones"),
    slug: z
      .string()
      .trim()
      .min(2, "Ingresá el slug")
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones"),
    brandId: z.string().min(1, "Elegí una marca"),
    categoryId: z.string().min(1, "Elegí una categoría"),
    shortDescription: optionalText(300),
    description: z
      .string()
      .trim()
      .min(10, "La descripción debe tener al menos 10 caracteres")
      .max(20_000),
    price: requiredInt(MAX_MONEY, 1),
    compareAtPrice: optionalInt(MAX_MONEY),
    cost: optionalInt(MAX_MONEY),
    initialStock: optionalInt(MAX_STOCK),
    minStock: requiredInt(MAX_STOCK),
    images: z.array(productImageSchema).max(MAX_IMAGES, `Máximo ${MAX_IMAGES} imágenes`),
    specifications: z.array(productSpecSchema).max(MAX_SPECS),
    tags: z
      .string()
      .transform((v) => [
        ...new Set(
          v
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
        ),
      ])
      .pipe(z.array(z.string().max(40)).max(MAX_TAGS, `Máximo ${MAX_TAGS} tags`)),
    weightGrams: optionalInt(MAX_DIMENSION),
    lengthMm: optionalInt(MAX_DIMENSION),
    widthMm: optionalInt(MAX_DIMENSION),
    heightMm: optionalInt(MAX_DIMENSION),
    warrantyMonths: requiredInt(MAX_WARRANTY_MONTHS),
    status: z.enum(PRODUCT_STATUSES, { error: "Elegí un estado" }),
    isFeatured: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.compareAtPrice !== null && data.compareAtPrice <= data.price) {
      ctx.addIssue({
        code: "custom",
        path: ["compareAtPrice"],
        message: "El precio anterior debe ser mayor al precio actual",
      });
    }
    const seen = new Set<string>();
    data.specifications.forEach((spec, index) => {
      if (seen.has(spec.key)) {
        ctx.addIssue({
          code: "custom",
          path: ["specifications", index, "key"],
          message: "Clave repetida",
        });
      }
      seen.add(spec.key);
    });
  });

export type ProductFormValues = z.input<typeof productSchema>;
export type ProductInput = z.output<typeof productSchema>;

/* ------------------------------------------------------------------ */
/*  Inventario y pedidos                                               */
/* ------------------------------------------------------------------ */

export const stockAdjustSchema = z.object({
  productId: idSchema,
  delta: z
    .string()
    .trim()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number({ error: NUMBER_ERROR }).int(NUMBER_ERROR).min(-MAX_STOCK).max(MAX_STOCK)),
  reason: z.string().trim().min(3, "Indicá el motivo del ajuste").max(200),
  minStock: requiredInt(MAX_STOCK),
});

export type StockAdjustValues = z.input<typeof stockAdjustSchema>;

export const orderStatusChangeSchema = z.object({
  orderId: idSchema,
  status: z.enum(ORDER_STATUS_VALUES, { error: "Elegí el nuevo estado" }),
  note: optionalText(500),
  trackingCode: optionalText(80),
  carrier: optionalText(80),
});

export type OrderStatusChangeValues = z.input<typeof orderStatusChangeSchema>;

/* ------------------------------------------------------------------ */
/*  Descuentos                                                         */
/* ------------------------------------------------------------------ */

const discountBase = {
  description: optionalText(300),
  type: z.enum(DISCOUNT_TYPES, { error: "Elegí el tipo" }),
  value: requiredInt(MAX_MONEY, 1),
  startsAt: dayKey,
  endsAt: dayKey,
  minSubtotal: optionalInt(MAX_MONEY),
  categoryIds: idList,
  productIds: idList,
  isActive: z.boolean(),
};

interface DiscountRefineInput {
  type: (typeof DISCOUNT_TYPES)[number];
  value: number;
  startsAt: string;
  endsAt: string;
}

function refineDiscount(data: DiscountRefineInput, ctx: z.RefinementCtx): void {
  if (data.type === "PERCENTAGE" && data.value > MAX_PERCENT) {
    ctx.addIssue({
      code: "custom",
      path: ["value"],
      message: "El porcentaje debe estar entre 1 y 100",
    });
  }
  if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) {
    ctx.addIssue({
      code: "custom",
      path: ["endsAt"],
      message: "El vencimiento debe ser posterior a la fecha de inicio",
    });
  }
}

export const couponSchema = z
  .object({
    code: z
      .string()
      .transform((v) => v.trim().toUpperCase().replace(/\s+/g, ""))
      .pipe(
        z
          .string()
          .min(3, "El código debe tener al menos 3 caracteres")
          .max(40)
          .regex(/^[A-Z0-9_-]+$/, "Solo letras, números, - y _"),
      ),
    ...discountBase,
    maxUses: optionalInt(MAX_STOCK, 1),
    maxUsesPerUser: optionalInt(MAX_STOCK, 1),
  })
  .superRefine(refineDiscount);

export type CouponFormValues = z.input<typeof couponSchema>;
export type CouponInput = z.output<typeof couponSchema>;

export const promotionSchema = z
  .object({
    name: z.string().trim().min(3, "Ingresá un nombre").max(120),
    ...discountBase,
  })
  .superRefine(refineDiscount);

export type PromotionFormValues = z.input<typeof promotionSchema>;
export type PromotionInput = z.output<typeof promotionSchema>;

/* ------------------------------------------------------------------ */
/*  Configuración: envíos, medios de pago y cuotas                      */
/* ------------------------------------------------------------------ */

export const shippingMethodSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, "Ingresá un código")
      .max(40)
      .regex(/^[a-z0-9_]+$/, "Solo minúsculas, números y _"),
    name: z.string().trim().min(2, "Ingresá un nombre").max(80),
    description: optionalText(200),
    type: z.enum(SHIPPING_TYPES),
    price: requiredInt(MAX_MONEY),
    freeThreshold: optionalInt(MAX_MONEY),
    estimatedDaysMin: requiredInt(MAX_PERCENT),
    estimatedDaysMax: requiredInt(MAX_PERCENT),
    isActive: z.boolean(),
    sortOrder: requiredInt(MAX_STOCK),
  })
  .refine((d) => d.estimatedDaysMax >= d.estimatedDaysMin, {
    path: ["estimatedDaysMax"],
    message: "Debe ser mayor o igual al mínimo",
  });

export type ShippingMethodFormValues = z.input<typeof shippingMethodSchema>;
export type ShippingMethodInput = z.output<typeof shippingMethodSchema>;

export const paymentMethodSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Ingresá un código")
    .max(40)
    .regex(/^[a-z0-9_]+$/, "Solo minúsculas, números y _"),
  name: z.string().trim().min(2, "Ingresá un nombre").max(80),
  description: optionalText(200),
  discountPercent: requiredInt(MAX_PERCENT),
  isActive: z.boolean(),
  sortOrder: requiredInt(MAX_STOCK),
});

export type PaymentMethodFormValues = z.input<typeof paymentMethodSchema>;
export type PaymentMethodInput = z.output<typeof paymentMethodSchema>;

export const installmentPlanSchema = z.object({
  installments: requiredInt(MAX_INSTALLMENTS, 1),
  interestPercent: z
    .string()
    .trim()
    .min(1, "Este campo es obligatorio")
    .transform((v) => Number(v.replace(",", ".")))
    .pipe(
      z
        .number({ error: "Ingresá un porcentaje válido" })
        .min(0, "No puede ser negativo")
        .max(MAX_PERCENT * 2),
    ),
  isActive: z.boolean(),
});

export type InstallmentPlanFormValues = z.input<typeof installmentPlanSchema>;
export type InstallmentPlanInput = z.output<typeof installmentPlanSchema>;

/* ------------------------------------------------------------------ */
/*  Categorías y marcas                                                */
/* ------------------------------------------------------------------ */

const slugField = z
  .string()
  .trim()
  .min(2, "Ingresá el slug")
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones");

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Ingresá un nombre").max(80),
  slug: slugField,
  description: optionalText(300),
  icon: optionalText(60),
  sortOrder: requiredInt(MAX_STOCK),
  isActive: z.boolean(),
  /** "" = categoría raíz. */
  parentId: z.string().trim().max(60),
});

export type CategoryFormValues = z.input<typeof categorySchema>;
export type CategoryInput = z.output<typeof categorySchema>;

export const brandSchema = z.object({
  name: z.string().trim().min(2, "Ingresá un nombre").max(80),
  slug: slugField,
  logoUrl: optionalText(300),
});

export type BrandFormValues = z.input<typeof brandSchema>;
export type BrandInput = z.output<typeof brandSchema>;

export const contactStatusSchema = z.enum(CONTACT_STATUSES);
export { idSchema };
