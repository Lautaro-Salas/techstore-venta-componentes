import type { ReactNode } from "react";
import { CompareBar } from "@/components/layout/compare-bar";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { getCurrentUser } from "@/lib/auth/session";
import { getCartCount } from "@/services/cart/cart.service";
import { getCategoryTree } from "@/services/catalog/categories.service";
import { getAvailablePaymentMethods } from "@/services/payments/registry";
import { getInterestFreeHint } from "@/services/pricing/installments.service";
import { getStoreSettings } from "@/services/settings/settings.service";
import {
  getActiveShippingMethods,
  lowestFreeShippingThreshold,
} from "@/services/shipping/shipping.service";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const [settings, user, categories, cartCount, payments, shipping, threshold, installments] =
    await Promise.all([
      getStoreSettings(),
      getCurrentUser(),
      getCategoryTree(),
      getCartCount(),
      getAvailablePaymentMethods(),
      getActiveShippingMethods(),
      lowestFreeShippingThreshold(),
      getInterestFreeHint(),
    ]);
  return (
    <>
      <Header
        storeName={settings.name}
        logoUrl={settings.logoUrl || undefined}
        user={user}
        categories={categories}
        cartCount={cartCount}
        freeShippingThreshold={threshold}
        maxInstallments={installments?.installments ?? null}
      />
      <main id="contenido" className="min-h-[60vh]">
        {children}
      </main>
      <Footer
        settings={settings}
        paymentMethods={payments.map((p) => p.name)}
        shippingMethods={shipping.map((s) => s.name)}
      />
      <CompareBar />
      <WhatsAppButton number={settings.whatsapp} />
    </>
  );
}
