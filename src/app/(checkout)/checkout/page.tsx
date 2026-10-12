import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageTransition } from "@/components/navigation/page-transition";
import { CheckoutWizard } from "@/features/checkout/checkout-wizard";
import type { CheckoutBootstrap } from "@/features/checkout/types";
import { getCurrentUser } from "@/lib/auth/session";
import { getProfile, listAddresses } from "@/services/account/account.service";
import { getCart } from "@/services/cart/cart.service";
import { getAvailablePaymentMethods } from "@/services/payments/registry";
import { getInstallmentPlans } from "@/services/pricing/installments.service";
import { getStoreSettings } from "@/services/settings/settings.service";
import { quoteShipping } from "@/services/shipping/shipping.service";
import type { Province } from "@/lib/argentina";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

const GRAMS_PER_ITEM = 1000;

function cartWeightGrams(cart: { lines: { product: { weightGrams: number | null }; quantity: number }[] }) {
  return cart.lines.reduce((sum, l) => sum + (l.product.weightGrams ?? GRAMS_PER_ITEM) * l.quantity, 0);
}

export default async function CheckoutPage() {
  const cart = await getCart();
  if (cart.lines.length === 0 || cart.hasIssues) redirect("/carrito");

  const user = await getCurrentUser();
  const [profile, addresses, paymentMethods, plans, settings, quotes] = await Promise.all([
    user ? getProfile(user.id) : null,
    user ? listAddresses(user.id) : [],
    getAvailablePaymentMethods(),
    getInstallmentPlans(),
    getStoreSettings(),
    quoteShipping({
      amount: cart.subtotal - cart.discountTotal,
      weightGrams: cartWeightGrams(cart),
    }),
  ]);

  const discountLabel =
    [cart.promotionName, cart.couponCode && `Cupón ${cart.couponCode}`]
      .filter(Boolean)
      .join(" + ") || null;

  const data: CheckoutBootstrap = {
    isAuthenticated: Boolean(user),
    invoiceAEnabled: settings.invoiceAEnabled,
    contactDefaults: profile
      ? {
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone ?? "",
          documentType: profile.documentType ?? "DNI",
          documentNumber: profile.documentNumber ?? "",
        }
      : {},
    savedAddresses: addresses.map((a) => ({
      id: a.id,
      isDefault: a.isDefault,
      label: a.label ?? "",
      recipientName: a.recipientName,
      phone: a.phone,
      street: a.street,
      number: a.number,
      floor: a.floor ?? "",
      apartment: a.apartment ?? "",
      city: a.city,
      province: a.province as Province,
      postalCode: a.postalCode,
      notes: a.notes ?? "",
    })),
    shippingQuotes: quotes,
    paymentMethods,
    installmentPlans: plans,
    cart: {
      lines: cart.lines.map((l) => ({
        productId: l.productId,
        name: l.product.name,
        quantity: l.quantity,
        lineTotal: l.lineTotal,
        image: l.product.image?.url ?? null,
      })),
      subtotal: cart.subtotal,
      promotionDiscount: cart.promotionDiscount,
      couponDiscount: cart.couponDiscount,
      discountTotal: cart.discountTotal,
      discountLabel,
      couponCode: cart.couponCode,
      itemCount: cart.itemCount,
    },
  };

  return (
    <PageTransition>
      <CheckoutWizard data={data} />
    </PageTransition>
  );
}
