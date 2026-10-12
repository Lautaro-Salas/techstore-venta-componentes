import type { ProductCardData } from "./catalog";

export interface CompareProduct extends ProductCardData {
  specifications: { key: string; label: string; value: string }[];
}

export interface CompareRow {
  key: string;
  label: string;
  values: (string | null)[];
  different: boolean;
}
