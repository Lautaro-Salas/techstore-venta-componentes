export interface SearchSuggestions {
  query: string;
  products: { name: string; slug: string; price: number; brand: string; image: string | null }[];
  categories: { name: string; href: string }[];
  brands: { name: string; slug: string }[];
  didYouMean: string | null;
}
