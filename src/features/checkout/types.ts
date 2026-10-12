import type { AddressInput, } from "@/schemas/customer";
import type { ContactStepInput } from "@/schemas/checkout";
import type { AvailablePaymentMethod } from "@/services/payments/registry";
import type { ShippingQuote } from "@/services/shipping/types";

export interface CheckoutLine {
  productId: string;
  name: string;
  quantity: number;
  lineTotal: number;
  image: string | null;
}

export interface SavedAddress extends AddressInput {
  id: string;
  isDefault: boolean;
}

export interface CheckoutBootstrap {
  isAuthenticated: boolean;
  invoiceAEnabled: boolean;
  contactDefaults: Partial<ContactStepInput>;
  savedAddresses: SavedAddress[];
  shippingQuotes: ShippingQuote[];
  paymentMethods: AvailablePaymentMethod[];
  installmentPlans: { installments: number; interestRateBps: number }[];
  cart: {
    lines: CheckoutLine[];
    subtotal: number;
    /** Descuento base (promo + cupón), sin el descuento por método de pago. */
    promotionDiscount: number;
    couponDiscount: number;
    discountTotal: number;
    discountLabel: string | null;
    couponCode: string | null;
    itemCount: number;
  };
}

export type DeliveryMode = "HOME_DELIVERY" | "PICKUP";

export interface CheckoutState {
  contact: Partial<ContactStepInput>;
  deliveryMode: DeliveryMode;
  selectedAddressId: string | null;
  address: Partial<AddressInput>;
  saveAddress: boolean;
  shippingMethodCode: string;
  paymentMethodCode: string;
  installments: number;
  notes: string;
}

export const CHECKOUT_STEPS = ["Datos", "Dirección", "Envío", "Pago", "Confirmación"] as const;
