import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CreditCard, Landmark, ShieldCheck, Store, Truck } from "lucide-react";
import { Section } from "@/components/home/section";
import { PageTransition } from "@/components/navigation/page-transition";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductRow } from "@/components/product/product-grid";
import { Price } from "@/components/product/price";
import { ProductSpecifications } from "@/components/product/product-specifications";
import { StockBadge } from "@/components/product/stock-badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Rating } from "@/components/ui/rating";
import { Skeleton } from "@/components/ui/skeleton";
import { PurchasePanel } from "@/features/product/purchase-panel";
import { RecentlyViewed, TrackRecentlyViewed } from "@/features/recently-viewed/recently-viewed";
import { ReviewsSection } from "@/features/reviews/reviews-section";
import { getCurrentUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/format";
import { getEnvSiteUrl, jsonLd } from "@/lib/site";
import { getProductBySlug } from "@/services/catalog/products.service";
import {
  getRelatedProducts,
  getSetupRecommendations,
} from "@/services/catalog/recommendations.service";
import { getAvailablePaymentMethods } from "@/services/payments/registry";
import { getInstallmentPlans } from "@/services/pricing/installments.service";
import {
  applyPercent,
  bestInterestFreePlan,
  priceWithoutNationalTaxes,
} from "@/services/pricing/rules";
import { getReviewSummary } from "@/services/reviews/reviews.service";
import { getStoreSettings } from "@/services/settings/settings.service";
import { lowestFreeShippingThreshold } from "@/services/shipping/shipping.service";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };
  const description = product.shortDescription ?? product.description.slice(0, 160);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: `/producto/${product.slug}`,
      images: product.images
        .filter((i) => !i.url.endsWith(".svg"))
        .map((i) => ({ url: i.url, alt: i.alt })),
    },
  };
}

function productSchema(
  product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>,
  ratingCount: number,
  ratingAvg: number,
) {
  const url = `${getEnvSiteUrl()}/producto/${product.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand.name },
    category: product.category.name,
    image: product.images.map((i) => `${getEnvSiteUrl()}${i.url}`),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "ARS",
      price: product.price,
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ratingAvg,
            reviewCount: ratingCount,
          },
        }
      : {}),
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [user, summary, related, setup, plans, payments, settings, freeShipping] =
    await Promise.all([
      getCurrentUser(),
      getReviewSummary(product.id),
      getRelatedProducts(product),
      getSetupRecommendations(product),
      getInstallmentPlans(),
      getAvailablePaymentMethods(),
      getStoreSettings(),
      lowestFreeShippingThreshold(),
    ]);
  const installments = bestInterestFreePlan(product.price, plans);
  const transfer = payments.find((p) => p.code === "bank_transfer" && p.discountPercent > 0);
  const extraSpecs = [
    { label: "SKU", value: product.sku },
    { label: "Garantía", value: `${product.warrantyMonths} meses` },
    ...(product.weightGrams
      ? [{ label: "Peso", value: `${(product.weightGrams / 1000).toLocaleString("es-AR")} kg` }]
      : []),
    ...(product.dimensions
      ? [
          {
            label: "Dimensiones",
            value: `${product.dimensions.lengthMm} × ${product.dimensions.widthMm} × ${product.dimensions.heightMm} mm`,
          },
        ]
      : []),
  ];

  return (
    // key: al cambiar de producto, fuerza el par exit/enter de la transición
    // (el componente de página se reutiliza con otros params y no remontaría).
    <PageTransition key={slug}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(productSchema(product, summary.count, summary.average)),
        }}
      />
      <TrackRecentlyViewed productId={product.id} />
      <div className="container-page py-6 sm:py-8">
        <Breadcrumb items={product.breadcrumbs} />
        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <ProductGallery images={product.images} name={product.name} />
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-primary text-sm font-semibold tracking-wide uppercase">
                {product.brand.name}
              </p>
              <h1 className="mt-1 text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
                {product.name}
              </h1>
              <div className="text-muted mt-2 flex flex-wrap items-center gap-3 text-sm">
                {summary.count > 0 ? (
                  <a href="#resenas" className="hover:underline">
                    <Rating value={summary.average} count={summary.count} />
                  </a>
                ) : (
                  <span>Sin reseñas todavía</span>
                )}
                <span aria-hidden>·</span>
                <span>SKU {product.sku}</span>
              </div>
            </div>

            <div className="card flex flex-col gap-4 p-5">
              <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
              {settings.showPriceWithoutTaxes && (
                <p className="text-muted -mt-2 text-xs">
                  Precio sin impuestos nacionales:{" "}
                  {formatPrice(
                    priceWithoutNationalTaxes(product.price, settings.vatRatePercent / 100),
                  )}
                </p>
              )}
              <ul className="flex flex-col gap-2 text-sm">
                {transfer && (
                  <li className="flex items-center gap-2">
                    <Landmark className="text-success size-4" aria-hidden />
                    <span>
                      <strong>
                        {formatPrice(
                          product.price - applyPercent(product.price, transfer.discountPercent),
                        )}
                      </strong>{" "}
                      pagando por transferencia ({transfer.discountPercent}% off)
                    </span>
                  </li>
                )}
                {installments && (
                  <li className="flex items-center gap-2">
                    <CreditCard className="text-success size-4" aria-hidden />
                    <span>
                      <strong>{installments.installments} cuotas sin interés</strong> de{" "}
                      {formatPrice(installments.amount)}
                    </span>
                  </li>
                )}
              </ul>
              <div className="flex items-center gap-2">
                <StockBadge level={product.stockLevel} available={product.available} />
              </div>
              <PurchasePanel product={product} />
            </div>

            <ul className="grid gap-3 text-sm sm:grid-cols-3">
              <li className="flex items-start gap-2">
                <Truck className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  {freeShipping && product.price >= freeShipping
                    ? "Envío gratis a todo el país"
                    : "Envíos a todo el país"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Store className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                <span>Retiro gratis en local</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{product.warrantyMonths} meses de garantía oficial</span>
              </li>
            </ul>

            {product.shortDescription && (
              <p className="text-muted text-sm leading-relaxed">{product.shortDescription}</p>
            )}
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_380px]">
          <section aria-labelledby="specs-title">
            <h2 id="specs-title" className="mb-4 text-xl font-bold tracking-tight">
              Especificaciones técnicas
            </h2>
            <ProductSpecifications specs={product.specifications} extra={extraSpecs} />
          </section>
          <section aria-labelledby="desc-title">
            <h2 id="desc-title" className="mb-4 text-xl font-bold tracking-tight">
              Descripción
            </h2>
            <p className="text-muted text-sm leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </section>
        </div>
      </div>

      {setup.length > 0 && (
        <Section title="Completá tu setup" subtitle="Productos compatibles según la ficha técnica">
          <ProductRow products={setup.slice(0, 4)} />
        </Section>
      )}
      {related.length > 0 && (
        <Section title="Productos relacionados" href={product.breadcrumbs.at(-2)?.href}>
          <ProductRow products={related.slice(0, 4)} />
        </Section>
      )}

      <section
        id="resenas"
        className="container-page mt-12 scroll-mt-32 sm:mt-16"
        aria-labelledby="reviews-title"
      >
        <h2 id="reviews-title" className="mb-5 text-xl font-bold tracking-tight sm:text-2xl">
          Opiniones de compradores
        </h2>
        {/* Streaming: las 2 queries de reseñas ya no bloquean el HTML de la ficha. */}
        <Suspense
          fallback={
            <div className="grid gap-8 lg:grid-cols-[320px_1fr]" aria-busy="true">
              <div className="flex flex-col gap-4">
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-44 w-full" />
              </div>
              <Skeleton className="h-72 w-full" />
            </div>
          }
        >
          <ReviewsSection
            productId={product.id}
            slug={product.slug}
            summary={summary}
            userId={user?.id}
          />
        </Suspense>
      </section>

      {related.length > 4 && (
        <Section title="También te puede interesar">
          <ProductRow products={related.slice(4, 8)} />
        </Section>
      )}
      <RecentlyViewed excludeId={product.id} />
    </PageTransition>
  );
}
