import type { Metadata } from "next";
import { AlertTriangle, ShieldCheck, ShoppingCart } from "lucide-react";
import { BenefitProgress } from "@/components/cart/benefit-progress";
import { CartItem } from "@/components/cart/cart-item";
import { CouponForm } from "@/components/cart/coupon-form";
import { OrderSummary, type SummaryRow } from "@/components/cart/order-summary";
import { Section } from "@/components/home/section";
import { PageTransition } from "@/components/navigation/page-transition";
import { ProductRow } from "@/components/product/product-grid";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getCart } from "@/services/cart/cart.service";
import { getCartSuggestions } from "@/services/catalog/recommendations.service";
import { getHomeSections } from "@/services/catalog/products.service";
import { findCartIncompatibilities } from "@/services/compatibility/cart-compatibility";
import { pluralize } from "@/lib/format";

export const metadata: Metadata = { title: "Carrito", robots: { index: false } };

export default async function CartPage() {
  const cart = await getCart();

  if (cart.lines.length === 0) {
    const { bestSellers } = await getHomeSections();
    return (
      <PageTransition>
        <div className="container-page py-10">
          <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">Tu carrito</h1>
          <EmptyState
            icon={<ShoppingCart />}
            title="Tu carrito está vacío"
            description="Explorá el catálogo y agregá los productos que quieras comprar."
            action={<ButtonLink href="/productos">Ver productos</ButtonLink>}
          />
          {bestSellers.length > 0 && (
            <div className="-mx-4 sm:-mx-6 lg:-mx-8">
              <Section title="Los más vendidos">
                <ProductRow products={bestSellers.slice(0, 4)} />
              </Section>
            </div>
          )}
        </div>
      </PageTransition>
    );
  }

  const [warnings, suggestions] = await Promise.all([
    findCartIncompatibilities(cart.lines),
    getCartSuggestions(
      cart.lines.map((l) => ({ productId: l.productId, categorySlug: l.product.category.slug })),
    ),
  ]);

  const rows: SummaryRow[] = [
    {
      label: `Subtotal (${pluralize(cart.itemCount, "producto", "productos")})`,
      value: cart.subtotal,
    },
  ];
  if (cart.promotionDiscount > 0)
    rows.push({
      label: cart.promotionName ?? "Promoción",
      value: cart.promotionDiscount,
      tone: "discount",
    });
  if (cart.couponDiscount > 0)
    rows.push({ label: `Cupón ${cart.couponCode}`, value: cart.couponDiscount, tone: "discount" });

  return (
    <PageTransition>
      <div className="container-page py-6 sm:py-10">
        <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">Tu carrito</h1>
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-4">
            {warnings.length > 0 && (
              <div
                className="border-warning/40 bg-warning-soft rounded-2xl border p-4 text-sm"
                role="alert"
              >
                <p className="text-warning flex items-center gap-2 font-semibold">
                  <AlertTriangle className="size-4" aria-hidden /> Posibles incompatibilidades
                </p>
                <ul className="mt-2 flex list-disc flex-col gap-1 pl-6">
                  {warnings.map((w) => (
                    <li key={w.products.join() + w.message}>
                      <strong>{w.products[0]}</strong> y <strong>{w.products[1]}</strong>:{" "}
                      {w.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <section className="card px-4 sm:px-6" aria-label="Productos en el carrito">
              <ul className="divide-border divide-y">
                {cart.lines.map((line) => (
                  <CartItem key={line.productId} line={line} />
                ))}
              </ul>
            </section>
          </div>
          <aside className="lg:sticky lg:top-36 lg:self-start">
            <div className="card p-5">
              <h2 className="mb-4 text-lg font-semibold">Resumen</h2>
              <OrderSummary
                rows={rows}
                total={cart.total}
                shippingLabel="Se calcula en el checkout"
                footer={
                  <>
                    {cart.hasIssues && (
                      <p className="text-warning text-sm font-medium" role="alert">
                        Ajustá los productos marcados para continuar.
                      </p>
                    )}
                    <ButtonLink
                      href="/checkout"
                      size="lg"
                      fullWidth
                      aria-disabled={cart.hasIssues}
                      className={cart.hasIssues ? "pointer-events-none opacity-50" : undefined}
                    >
                      Iniciar compra
                    </ButtonLink>
                    <ButtonLink href="/productos" variant="ghost" fullWidth>
                      Seguir comprando
                    </ButtonLink>
                    <p className="text-muted flex items-center justify-center gap-1.5 text-xs">
                      <ShieldCheck className="size-3.5" aria-hidden /> Compra protegida · Garantía
                      oficial
                    </p>
                  </>
                }
              >
                <BenefitProgress
                  benefits={cart.benefits}
                  subtotal={cart.subtotal - cart.discountTotal}
                />
                <CouponForm appliedCode={cart.couponCode} error={cart.couponError} />
              </OrderSummary>
            </div>
          </aside>
        </div>
      </div>
      {suggestions.length > 0 && (
        <Section title="Productos que podrían interesarte">
          <ProductRow products={suggestions} />
        </Section>
      )}
    </PageTransition>
  );
}
