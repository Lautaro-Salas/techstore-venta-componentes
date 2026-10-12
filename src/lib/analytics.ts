/**
 * Puntos de tracking. Envía a GTM (dataLayer), GA4 (gtag) y Meta Pixel solo si
 * fueron configurados mediante NEXT_PUBLIC_GTM_ID / NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_META_PIXEL_ID.
 */
export type AnalyticsEvent =
  | "product_view"
  | "add_to_cart"
  | "remove_from_cart"
  | "begin_checkout"
  | "purchase"
  | "search"
  | "wishlist_add";

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  price: number;
  quantity?: number;
}

export interface AnalyticsParams {
  currency?: "ARS";
  value?: number;
  items?: AnalyticsItem[];
  search_term?: string;
  transaction_id?: string;
}

type Gtag = (command: "event", name: string, params: Record<string, unknown>) => void;
type Fbq = (command: "track" | "trackCustom", name: string, params?: Record<string, unknown>) => void;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: Gtag;
    fbq?: Fbq;
  }
}

const META_EVENTS: Partial<Record<AnalyticsEvent, string>> = {
  product_view: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
  search: "Search",
  wishlist_add: "AddToWishlist",
};

export function track(event: AnalyticsEvent, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined") return;
  const payload = { currency: "ARS", ...params };
  window.dataLayer?.push({ event, ecommerce: payload });
  window.gtag?.("event", event, payload);
  const metaEvent = META_EVENTS[event];
  if (metaEvent) window.fbq?.("track", metaEvent, { value: payload.value, currency: payload.currency });
}

export function toAnalyticsItem(p: { id: string; name: string; brand?: { name: string }; category?: { name: string }; price: number }, quantity = 1): AnalyticsItem {
  return { item_id: p.id, item_name: p.name, item_brand: p.brand?.name, item_category: p.category?.name, price: p.price, quantity };
}
