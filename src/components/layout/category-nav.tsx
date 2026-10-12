import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { CategoryNode } from "@/types/catalog";

/** Barra de categorías con mega menú (hover y teclado vía focus-within). */
export function CategoryNav({ categories }: { categories: CategoryNode[] }) {
  return (
    <nav aria-label="Categorías" className="border-border hidden border-t lg:block">
      <ul className="container-page flex h-11 items-center gap-0.5 text-sm">
        {categories.map((cat) => (
          <li key={cat.id} className="group relative">
            <Link
              href={cat.href}
              className="text-foreground/90 hover:bg-surface-2 hover:text-foreground flex items-center gap-1 rounded-lg px-3 py-2 font-medium"
            >
              {cat.name}
              {cat.children.length > 0 && (
                <ChevronDown
                  className="text-muted size-3.5 transition-transform group-hover:rotate-180"
                  aria-hidden
                />
              )}
            </Link>
            {cat.children.length > 0 && (
              <div className="invisible absolute top-full left-0 z-40 pt-2 opacity-0 transition-all duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <ul className="border-border bg-surface grid w-[28rem] grid-cols-2 gap-1 rounded-2xl border p-3 shadow-[0_16px_40px_-12px_rgb(10_20_32/0.18)] shadow-xl">
                  {cat.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={child.href}
                        className="hover:bg-primary-soft hover:text-primary block rounded-xl px-3 py-2.5 transition-colors"
                      >
                        <span className="block font-medium">{child.name}</span>
                        {child.description && (
                          <span className="text-muted mt-0.5 block text-xs">
                            {child.description}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                  <li className="border-border col-span-2 border-t pt-2">
                    <Link
                      href={cat.href}
                      className="text-primary hover:bg-primary-soft block rounded-xl px-3 py-2 text-sm font-semibold transition-colors"
                    >
                      Ver todo en {cat.name} →
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </li>
        ))}
        <li>
          <Link
            href="/ofertas"
            className="text-danger hover:bg-danger-soft rounded-lg px-3 py-2 font-semibold"
          >
            Ofertas
          </Link>
        </li>
        <li>
          <Link
            href="/marcas"
            className="text-foreground/90 hover:bg-surface-2 rounded-lg px-3 py-2 font-medium"
          >
            Marcas
          </Link>
        </li>
        <li className="ml-auto">
          <Link
            href="/comparar"
            className="text-muted hover:bg-surface-2 hover:text-foreground rounded-lg px-3 py-2"
          >
            Comparador
          </Link>
        </li>
        <li>
          <Link
            href="/contacto"
            className="text-muted hover:bg-surface-2 hover:text-foreground rounded-lg px-3 py-2"
          >
            Ayuda
          </Link>
        </li>
      </ul>
    </nav>
  );
}
