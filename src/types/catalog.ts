import type { StockLevel } from "@/services/inventory/rules";

export interface ProductImageData {
  url: string;
  alt: string;
}

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: { name: string; slug: string };
  category: { id: string; name: string; slug: string };
  price: number;
  compareAtPrice: number | null;
  image: ProductImageData | null;
  ratingAvg: number;
  ratingCount: number;
  available: number;
  stockLevel: StockLevel;
  warrantyMonths: number;
  createdAt: string;
  /** Peso en gramos, si está definido en la ficha del producto. */
  weightGrams: number | null;
}

export interface SpecificationData {
  group: string;
  key: string;
  label: string;
  value: string;
}

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export interface ProductDetailData extends ProductCardData {
  shortDescription: string | null;
  description: string;
  images: ProductImageData[];
  specifications: SpecificationData[];
  tags: string[];
  dimensions: { lengthMm: number; widthMm: number; heightMm: number } | null;
  breadcrumbs: BreadcrumbItem[];
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  href: string;
  icon: string | null;
  description: string | null;
  parentId: string | null;
  children: CategoryNode[];
}

export const SORT_OPTIONS = {
  relevance: "Más relevantes",
  best_selling: "Más vendidos",
  price_asc: "Menor precio",
  price_desc: "Mayor precio",
  newest: "Más nuevos",
  rating: "Mejor calificados",
} as const;

export type SortOption = keyof typeof SORT_OPTIONS;

export interface CatalogFilters {
  q?: string;
  categoryIds?: string[];
  brandSlugs?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  specs?: Record<string, string[]>;
  sort?: SortOption;
  page?: number;
}

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

export interface SpecFacet {
  key: string;
  label: string;
  options: FacetOption[];
}

export interface CatalogFacets {
  brands: FacetOption[];
  specs: SpecFacet[];
  priceRange: { min: number; max: number };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
