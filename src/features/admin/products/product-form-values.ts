import type { ProductFormValues } from "@/schemas/admin";
import type { Prisma } from "@prisma/client";
import { parseTags } from "@/lib/tags";

const DEFAULT_WARRANTY_MONTHS = "12";

export interface ProductSectionProps {
  values: ProductFormValues;
  set: <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => void;
  errors: Record<string, string>;
}

export function emptyProductValues(): ProductFormValues {
  return {
    name: "",
    sku: "",
    slug: "",
    brandId: "",
    categoryId: "",
    shortDescription: "",
    description: "",
    price: "",
    compareAtPrice: "",
    cost: "",
    initialStock: "0",
    minStock: "0",
    images: [],
    specifications: [],
    tags: "",
    weightGrams: "",
    lengthMm: "",
    widthMm: "",
    heightMm: "",
    warrantyMonths: DEFAULT_WARRANTY_MONTHS,
    status: "DRAFT",
    isFeatured: false,
  };
}

const text = (value: number | null): string => (value === null ? "" : String(value));

interface EditableProduct {
  name: string;
  sku: string;
  slug: string;
  brandId: string;
  categoryId: string;
  shortDescription: string | null;
  description: string;
  price: number;
  compareAtPrice: number | null;
  cost: number | null;
  minStock: number;
  images: { url: string; alt: string }[];
  specifications: { group: string; key: string; label: string; value: string; filterable: boolean }[];
  tags: Prisma.JsonValue | null;
  weightGrams: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  warrantyMonths: number;
  status: ProductFormValues["status"];
  isFeatured: boolean;
}

export function productToFormValues(p: EditableProduct): ProductFormValues {
  return {
    name: p.name,
    sku: p.sku,
    slug: p.slug,
    brandId: p.brandId,
    categoryId: p.categoryId,
    shortDescription: p.shortDescription ?? "",
    description: p.description,
    price: String(p.price),
    compareAtPrice: text(p.compareAtPrice),
    cost: text(p.cost),
    initialStock: "",
    minStock: String(p.minStock),
    images: p.images.map(({ url, alt }) => ({ url, alt })),
    specifications: p.specifications.map(({ group, key, label, value, filterable }) => ({ group, key, label, value, filterable })),
    tags: parseTags(p.tags).join(", "),
    weightGrams: text(p.weightGrams),
    lengthMm: text(p.lengthMm),
    widthMm: text(p.widthMm),
    heightMm: text(p.heightMm),
    warrantyMonths: String(p.warrantyMonths),
    status: p.status,
    isFeatured: p.isFeatured,
  };
}
