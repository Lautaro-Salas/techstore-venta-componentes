"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LayoutGrid, LogIn, Search, ShoppingCart, User } from "lucide-react";
import { Drawer } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { CategoryNode } from "@/types/catalog";
import { SearchBox } from "./search-box";

interface Props {
  categories: CategoryNode[];
  cartCount: number;
  isAuthenticated: boolean;
}

function CategoriesList({
  categories,
  onNavigate,
}: {
  categories: CategoryNode[];
  onNavigate: () => void;
}) {
  return (
    <nav aria-label="Categorías" className="flex flex-col gap-5">
      {categories.map((cat) => (
        <div key={cat.id}>
          <Link href={cat.href} onClick={onNavigate} className="text-base font-semibold">
            {cat.name}
          </Link>
          {cat.children.length > 0 && (
            <ul className="mt-2 grid grid-cols-2 gap-2">
              {cat.children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={child.href}
                    onClick={onNavigate}
                    className="bg-surface-2 block rounded-xl px-3 py-2.5 text-sm"
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      <div className="border-border grid grid-cols-2 gap-2 border-t pt-4 text-sm">
        <Link
          href="/ofertas"
          onClick={onNavigate}
          className="bg-danger-soft text-danger rounded-xl px-3 py-2.5 font-semibold"
        >
          Ofertas
        </Link>
        <Link href="/marcas" onClick={onNavigate} className="bg-surface-2 rounded-xl px-3 py-2.5">
          Marcas
        </Link>
        <Link href="/comparar" onClick={onNavigate} className="bg-surface-2 rounded-xl px-3 py-2.5">
          Comparador
        </Link>
        <Link
          href="/favoritos"
          onClick={onNavigate}
          className="bg-surface-2 rounded-xl px-3 py-2.5"
        >
          Favoritos
        </Link>
        <Link href="/contacto" onClick={onNavigate} className="bg-surface-2 rounded-xl px-3 py-2.5">
          Contacto
        </Link>
        <Link href="/faq" onClick={onNavigate} className="bg-surface-2 rounded-xl px-3 py-2.5">
          Preguntas frecuentes
        </Link>
      </div>
    </nav>
  );
}

/** Barra de navegación inferior para mobile + drawers de categorías y búsqueda. */
export function MobileNav({ categories, cartCount, isAuthenticated }: Props) {
  const pathname = usePathname();
  const [panel, setPanel] = useState<"none" | "menu" | "search">("none");
  const close = () => setPanel("none");
  const item = "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium";
  const activeClass = (match: boolean) => (match ? "text-primary" : "text-muted");

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="border-border bg-surface/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <div className="flex">
          <Link href="/" className={cn(item, activeClass(pathname === "/"))}>
            <Home className="size-5" aria-hidden />
            Inicio
          </Link>
          <button
            type="button"
            onClick={() => setPanel("menu")}
            className={cn(item, activeClass(panel === "menu"))}
          >
            <LayoutGrid className="size-5" aria-hidden />
            Categorías
          </button>
          <button
            type="button"
            onClick={() => setPanel("search")}
            className={cn(item, activeClass(panel === "search"))}
          >
            <Search className="size-5" aria-hidden />
            Buscar
          </button>
          <Link
            href="/carrito"
            className={cn(item, "relative", activeClass(pathname === "/carrito"))}
          >
            <ShoppingCart className="size-5" aria-hidden />
            {cartCount > 0 && (
              <span className="bg-cta text-primary-foreground absolute top-1 left-1/2 ml-1.5 min-w-4.5 rounded-full px-1 text-center text-[10px] leading-4.5 font-bold shadow-sm">
                {cartCount}
              </span>
            )}
            Carrito
          </Link>
          {isAuthenticated ? (
            <Link href="/cuenta" className={cn(item, activeClass(pathname.startsWith("/cuenta")))}>
              <User className="size-5" aria-hidden />
              Cuenta
            </Link>
          ) : (
            <Link href="/ingresar" className={cn(item, activeClass(pathname === "/ingresar"))}>
              <LogIn className="size-5" aria-hidden />
              Ingresar
            </Link>
          )}
        </div>
      </nav>
      <Drawer open={panel === "menu"} onClose={close} title="Categorías" side="left">
        <CategoriesList categories={categories} onNavigate={close} />
      </Drawer>
      <Drawer open={panel === "search"} onClose={close} title="Buscar" side="bottom">
        <div className="min-h-[50dvh]">
          <SearchBox autoFocus onNavigate={close} />
          <div className="text-muted mt-4 flex items-center gap-2 text-sm">
            <Heart className="size-4" aria-hidden /> Probá con “RTX”, “Ryzen”, “DDR5” o un SKU.
          </div>
        </div>
      </Drawer>
    </>
  );
}
