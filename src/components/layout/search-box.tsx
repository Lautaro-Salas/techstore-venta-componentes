"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { track } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SearchSuggestions } from "@/types/search";

const DEBOUNCE_MS = 250;
const MIN_CHARS = 2;

export function SearchBox({
  autoFocus = false,
  onNavigate,
  className,
}: {
  autoFocus?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [data, setData] = useState<SearchSuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const debounced = useDebounce(query.trim(), DEBOUNCE_MS);
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounced.length < MIN_CHARS) return;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(debounced)}`, {
          signal: controller.signal,
        });
        if (res.ok) setData((await res.json()) as SearchSuggestions);
      } catch {
        // abortado o sin conexión: se mantiene el estado anterior
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [debounced]);

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, []);

  const visible = debounced.length >= MIN_CHARS ? data : null;
  const products = visible?.products ?? [];

  const go = (href: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (active >= 0 && products[active]) return go(`/producto/${products[active].slug}`);
    track("search", { search_term: q });
    go(`/productos?q=${encodeURIComponent(q)}`);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!products.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % products.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? products.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showPanel = open && visible !== null;

  return (
    <div ref={wrapperRef} className={cn("relative w-full", className)}>
      <form role="search" onSubmit={submit} className="relative">
        <label htmlFor={`${listId}-input`} className="sr-only">
          Buscar productos
        </label>
        <Search
          className="text-muted pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2"
          aria-hidden
        />
        <input
          id={`${listId}-input`}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          enterKeyHint="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Buscá productos, marcas o SKU…"
          className="border-border bg-surface-2 placeholder:text-muted focus:border-primary focus:bg-surface focus:ring-ring/40 h-11 w-full rounded-xl border pr-20 pl-10 text-sm transition-all focus:ring-2 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
          {loading && <Loader2 className="text-muted size-4 animate-spin" aria-hidden />}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setData(null);
              }}
              className="text-muted hover:bg-surface rounded-md p-1.5"
              aria-label="Borrar búsqueda"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
          <button
            type="submit"
            className="bg-cta text-primary-foreground shadow-primary/20 rounded-lg p-1.5 shadow-sm transition hover:brightness-105"
            aria-label="Buscar"
          >
            <Search className="size-4" aria-hidden />
          </button>
        </div>
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="animate-fade-in border-border bg-surface absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border p-2 shadow-2xl shadow-[0_16px_40px_-12px_rgb(10_20_32/0.18)]"
        >
          {visible.didYouMean && (
            <button
              type="button"
              onClick={() => {
                setQuery(visible.didYouMean ?? "");
              }}
              className="hover:bg-surface-2 mb-1 w-full rounded-lg px-3 py-2 text-left text-sm"
            >
              ¿Quisiste decir <strong className="text-primary">{visible.didYouMean}</strong>?
            </button>
          )}
          {products.length === 0 && !visible.didYouMean && (
            <p className="text-muted px-3 py-4 text-sm">
              No encontramos productos para “{visible.query}”.
            </p>
          )}
          {products.map((p, i) => (
            <Link
              key={p.slug}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              href={`/producto/${p.slug}`}
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className={cn(
                "hover:bg-surface-2 flex items-center gap-3 rounded-lg px-3 py-2",
                i === active && "bg-surface-2",
              )}
            >
              {p.image && (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura SVG local de 40px
                <img
                  src={p.image}
                  alt=""
                  width={40}
                  height={40}
                  className="size-10 rounded-lg object-cover"
                  loading="lazy"
                />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{p.name}</span>
                <span className="text-muted text-xs">{p.brand}</span>
              </span>
              <span className="text-sm font-semibold tabular-nums">{formatPrice(p.price)}</span>
            </Link>
          ))}
          {(visible.categories.length > 0 || visible.brands.length > 0) && (
            <div className="border-border mt-1 flex flex-wrap gap-2 border-t px-3 pt-3 pb-1">
              {visible.categories.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className="bg-surface-2 hover:bg-border rounded-full px-3 py-1 text-xs font-medium"
                >
                  {c.name}
                </Link>
              ))}
              {visible.brands.map((b) => (
                <Link
                  key={b.slug}
                  href={`/marcas/${b.slug}`}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className="bg-primary-soft text-primary rounded-full px-3 py-1 text-xs font-medium"
                >
                  {b.name}
                </Link>
              ))}
            </div>
          )}
          {products.length > 0 && (
            <button
              type="button"
              onClick={() => go(`/productos?q=${encodeURIComponent(query.trim())}`)}
              className="text-primary hover:bg-surface-2 mt-1 w-full rounded-lg px-3 py-2 text-center text-sm font-medium"
            >
              Ver todos los resultados
            </button>
          )}
        </div>
      )}
    </div>
  );
}
