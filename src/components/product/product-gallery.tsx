"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImageData } from "@/types/catalog";

const THUMB_SIZE = "size-18";
const FADE_MS = 300;

/**
 * Estilo compartido por las flechas de navegación (vista principal y visor a
 * pantalla completa), para que todas las galerías de la tienda se vean igual.
 *
 * El contenedor va con borde y fondo casi opacos porque la imagen del producto
 * puede tener fondo blanco: sin marco, un círculo blanco sobre foto blanca
 * desaparecía. El icono usa gris oscuro y el hover vira a azul de marca.
 */
const ARROW_CLASS =
  "absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full " +
  "border border-slate-300 bg-white/95 text-slate-700 " +
  "shadow-[0_2px_6px_rgb(15_23_42/0.14)] backdrop-blur-sm " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-200 " +
  "hover:border-primary/55 hover:bg-white hover:text-primary hover:shadow-[0_4px_12px_rgb(15_23_42/0.2)] " +
  "active:scale-95 " +
  "focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none";

function ArrowIcon({ dir }: { dir: "left" | "right" }) {
  return dir === "left" ? (
    <ChevronLeft className="size-5.5" aria-hidden strokeWidth={2.25} />
  ) : (
    <ChevronRight className="size-5.5" aria-hidden strokeWidth={2.25} />
  );
}

export function ProductGallery({ images, name }: { images: ProductImageData[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const count = images.length;
  const current = images[index] ?? images[0];

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
      setIsLoaded(false);
    },
    [count],
  );

  const prev = useCallback(() => go(index - 1), [go, index]);
  const next = useCallback(() => go(index + 1), [go, index]);

  // Navegar con teclado en el visor a pantalla completa
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, prev, next]);

  // Bloquear el scroll del fondo cuando el visor está abierto
  useEffect(() => {
    if (!fullscreen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [fullscreen]);

  if (count === 0 || !current) {
    return (
      <div className="card text-muted grid aspect-square place-items-center text-sm">
        Sin imagen disponible
      </div>
    );
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 45) return;
    if (delta < 0) next();
    else prev();
  };

  const mainImage = (
    <Image
      src={current.url}
      alt={current.alt || `${name} - imagen ${index + 1}`}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 50vw"
      className={cn(
        "object-contain p-3 transition-opacity",
        isLoaded ? "opacity-100" : "opacity-0",
      )}
      style={{ transitionDuration: `${FADE_MS}ms` }}
      priority={index === 0}
      onLoad={() => setIsLoaded(true)}
      unoptimized={current.url.endsWith(".svg")}
      tabIndex={-1}
    />
  );

  const arrows = () => (
    <>
      <button
        type="button"
        onClick={prev}
        aria-label="Imagen anterior"
        className={cn(ARROW_CLASS, "left-2 sm:left-3")}
      >
        <ArrowIcon dir="left" />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Imagen siguiente"
        className={cn(ARROW_CLASS, "right-2 sm:right-3")}
      >
        <ArrowIcon dir="right" />
      </button>
    </>
  );

  const dots = (className?: string) => (
    <div
      className={cn("flex items-center justify-center gap-1.5", className)}
      role="tablist"
      aria-label="Indicadores de imagen"
    >
      {images.map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Ir a imagen ${i + 1}`}
          aria-current={i === index}
          onClick={() => go(i)}
          className={cn(
            "size-2 rounded-full transition-all",
            i === index ? "bg-primary w-5" : "bg-foreground/25 hover:bg-foreground/40",
          )}
        />
      ))}
    </div>
  );

  const thumbs = (className?: string, sizeClass = THUMB_SIZE) => (
    <ul className={className}>
      {images.map((img, i) => (
        <li key={img.url + i}>
          <button
            type="button"
            aria-label={`Ver imagen ${i + 1}`}
            aria-current={i === index}
            onClick={() => go(i)}
            className={cn(
              "relative block overflow-hidden rounded-xl border bg-white transition",
              i === index
                ? "border-primary ring-primary ring-1"
                : "border-transparent opacity-60 hover:opacity-100",
              sizeClass,
            )}
          >
            <Image
              src={img.url}
              alt=""
              fill
              sizes="72px"
              className="object-contain p-1"
              unoptimized={img.url.endsWith(".svg")}
            />
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Una sola galería para ambos breakpoints: en sm+ las miniaturas quedan a la
          izquierda (flex-row) y por debajo de sm la imagen va arriba y las
          miniaturas como fila scrolleable abajo (col-reverse). Así la imagen
          principal y las miniaturas se renderizan una única vez en el DOM. */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {count > 1 &&
          thumbs(
            "flex gap-2 overflow-x-auto pb-1 sm:flex-col sm:overflow-x-visible sm:pb-0",
            "size-14 sm:size-18",
          )}
        <div
          className="card relative aspect-square w-full overflow-hidden bg-white sm:flex-1"
          role="region"
          aria-roledescription="carrusel"
          aria-label={`Galería de ${name}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
          }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {mainImage}
          {count > 1 && arrows()}
          <button
            type="button"
            aria-label="Ver en pantalla completa"
            onClick={() => {
              setIsLoaded(false);
              setFullscreen(true);
            }}
            className={cn(
              ARROW_CLASS,
              "top-2 right-2 size-9 translate-y-0",
              "sm:right-2",
            )}
          >
            <Maximize2 className="size-4" aria-hidden />
          </button>
          {count > 1 && (
            <div className="absolute inset-x-0 bottom-2 flex justify-center sm:hidden">
              {dots()}
            </div>
          )}
        </div>
      </div>

      {/* ============ FULLSCREEN ============ */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Visor de ${name}`}
        >
          <div
            className="relative w-full max-w-4xl"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="card relative aspect-square overflow-hidden bg-white">
              <Image
                src={current.url}
                alt={current.alt || `${name} - imagen ${index + 1}`}
                fill
                sizes="100vw"
                className={cn(
                  "object-contain p-4 transition-opacity",
                  isLoaded ? "opacity-100" : "opacity-0",
                )}
                style={{ transitionDuration: `${FADE_MS}ms` }}
                onLoad={() => setIsLoaded(true)}
                unoptimized={current.url.endsWith(".svg")}
              />
              {count > 1 && arrows()}
              <button
                type="button"
                aria-label="Cerrar visor"
                onClick={() => setFullscreen(false)}
                className={cn(
                  ARROW_CLASS,
                  "top-3 right-3 translate-y-0",
                  "size-10 hover:text-danger hover:border-danger/50",
                )}
              >
                <X className="size-5" aria-hidden strokeWidth={2.25} />
              </button>
            </div>
            {count > 1 && (
              <div className="mt-3 flex items-center justify-center gap-2">{dots()}</div>
            )}
            <p className="mt-2 text-center text-xs text-white/60">
              {index + 1} / {count}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
