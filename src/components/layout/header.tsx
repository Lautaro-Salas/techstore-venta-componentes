import { Suspense } from "react";
import Link from "next/link";
import { Heart, ShieldCheck, ShoppingCart, Truck, CreditCard } from "lucide-react";
import { hasPermission } from "@/lib/auth/permissions";
import { formatPrice } from "@/lib/format";
import type { SessionUser } from "@/types/auth";
import type { CategoryNode } from "@/types/catalog";
import { CategoryNav } from "./category-nav";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { SearchBox } from "./search-box";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

interface HeaderProps {
  storeName: string;
  logoUrl?: string;
  user: SessionUser | null;
  categories: CategoryNode[];
  cartCount: number;
  freeShippingThreshold: number | null;
  maxInstallments: number | null;
}

function TopBar({
  freeShippingThreshold,
  maxInstallments,
}: Pick<HeaderProps, "freeShippingThreshold" | "maxInstallments">) {
  return (
    <div className="bg-foreground text-background">
      <div className="container-page flex h-9 items-center justify-center gap-6 overflow-hidden text-xs sm:justify-between">
        <p className="flex items-center gap-1.5">
          <Truck className="size-3.5" aria-hidden />
          {freeShippingThreshold ? (
            <>Envío gratis desde {formatPrice(freeShippingThreshold)}</>
          ) : (
            <>Envíos a todo el país</>
          )}
        </p>
        <p className="hidden items-center gap-1.5 sm:flex">
          <CreditCard className="size-3.5" aria-hidden />
          {maxInstallments
            ? `Hasta ${maxInstallments} cuotas sin interés`
            : "Múltiples medios de pago"}
        </p>
        <p className="hidden items-center gap-1.5 md:flex">
          <ShieldCheck className="size-3.5" aria-hidden /> Garantía oficial en todos los productos
        </p>
      </div>
    </div>
  );
}

export function Header(props: HeaderProps) {
  const { storeName, logoUrl, user, categories, cartCount } = props;
  return (
    <>
      <a
        href="#contenido"
        className="bg-cta text-primary-foreground sr-only z-[100] rounded-lg px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <TopBar
        freeShippingThreshold={props.freeShippingThreshold}
        maxInstallments={props.maxInstallments}
      />
      <header className="border-border bg-surface/85 sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="container-page flex h-16 items-center gap-3 lg:gap-6">
          <Logo name={storeName} logoUrl={logoUrl} />
          <div className="hidden flex-1 md:block">
            <Suspense fallback={<div className="bg-surface-2 h-11 rounded-xl" />}>
              <SearchBox />
            </Suspense>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/favoritos"
              className="text-muted hover:bg-surface-2 hover:text-foreground hidden rounded-xl p-2.5 transition-colors md:block"
              aria-label="Favoritos"
            >
              <Heart className="size-5" aria-hidden />
            </Link>
            <UserMenu
              user={user ? { firstName: user.firstName, email: user.email } : null}
              canAccessAdmin={hasPermission(user, "admin:access")}
            />
            <Link
              href="/carrito"
              className="bg-cta text-primary-foreground shadow-primary/20 hover:shadow-primary/30 relative hidden items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:shadow-md hover:brightness-105 md:flex"
              aria-label={`Carrito, ${cartCount} productos`}
            >
              <ShoppingCart className="size-5" aria-hidden />
              <span>{cartCount}</span>
            </Link>
          </div>
        </div>
        <div className="container-page pb-3 md:hidden">
          <Suspense fallback={<div className="bg-surface-2 h-11 rounded-xl" />}>
            <SearchBox />
          </Suspense>
        </div>
        <CategoryNav categories={categories} />
      </header>
      <MobileNav categories={categories} cartCount={cartCount} isAuthenticated={Boolean(user)} />
    </>
  );
}
