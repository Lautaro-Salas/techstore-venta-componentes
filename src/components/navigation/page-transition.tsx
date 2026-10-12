import type { ReactNode } from "react";
import { ViewTransition } from "react";

/**
 * Transición de página (fade + leve desplazamiento vertical).
 *
 * Se usa envolviendo el JSX raíz de cada `page.tsx`. Los layouts persisten entre
 * navegaciones, por lo que `enter`/`exit` solo se activan si el `<ViewTransition>`
 * está en la página y es insertado/eliminado por el router.
 *
 * - `enter`/`exit`: animan únicamente al cambiar de página (navegación).
 * - `update="none"`: las interacciones dentro de la página (galería, filtros,
 *   modales, carrito) no disparan esta transición; además React solo activa
 *   `<ViewTransition>` en updates dentro de un `startTransition`.
 * - `default="none"`: cualquier otro tipo de transición queda sin animación.
 *
 * En navegadores sin soporte de View Transitions API la página cambia sin
 * animación (comportamiento por defecto, sin roturas).
 *
 * `key` (por ejemplo `key={slug}` en rutas dinámicas) fuerza el par exit/enter
 * cuando el mismo componente de página se reutiliza con otros parámetros.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" update="none" default="none">
      {children}
    </ViewTransition>
  );
}
