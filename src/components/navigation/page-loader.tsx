"use client";

import { useEffect, useRef } from "react";
import { ShoppingCart } from "lucide-react";

/**
 * Cargador de navegación: mientras carga la página destino, un carrito recorre
 * una pequeña pista (650 ms por pasada, en bucle) sobre un panel con el halo de
 * la marca. Cuando la nueva página está lista, el panel se funde y desaparece.
 *
 * Contexto: React sólo arranca la View Transition al terminar de cargar el
 * destino, así que sin este cargador el usuario se queda mirando la página vieja
 * durante toda la carga. Las navegaciones rápidas (cacheadas/prefetcheadas) no
 * muestran el cargador: a los 150 ms se cancela si la transición ya comenzó.
 *
 * Seguridad: nunca bloquea la interacción (pointer-events: none); si la
 * navegación nunca se concreta, un temporizador de 12 s levanta el cargador;
 * Escape y el botón Atrás también lo levantan.
 */

const SHOW_DELAY_MS = 150;
const HIDE_FALLBACK_MS = 12_000;
const HIDE_AFTER_COMMIT_MS = 400;

type ViewTransitionHandle = { finished: Promise<void> };
type StartViewTransition = (options?: unknown) => ViewTransitionHandle;

export function PageLoader() {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;

    let showTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let targetPath = window.location.pathname;
    let active = false;
    let vtWithLoader = false; // hay una View Transition corriendo con el cargador puesto

    const clearShow = () => {
      if (showTimer !== undefined) clearTimeout(showTimer);
      showTimer = undefined;
    };
    const clearHide = () => {
      if (hideTimer !== undefined) clearTimeout(hideTimer);
      hideTimer = undefined;
    };

    const hide = () => {
      clearShow();
      clearHide();
      vtWithLoader = false;
      document.documentElement.classList.remove("loader-skip-vt");
      if (!active) return;
      active = false;
      el.classList.remove("is-active"); // el panel se funde con la transición CSS
    };

    const show = () => {
      if (active) return;
      active = true;
      clearHide();
      el.classList.add("is-active"); // el panel aparece con la transición CSS
      hideTimer = setTimeout(hide, HIDE_FALLBACK_MS);
    };

    const scheduleShow = (path: string) => {
      if (path === window.location.pathname) return; // mismos filtros/búsqueda: sin cargador
      targetPath = path;
      clearShow();
      showTimer = setTimeout(() => {
        showTimer = undefined;
        // Si la URL ya cambió, la navegación se concretó sin View Transition
        // (navegación rapidísima o navegador sin soporte): no hace falta cargador.
        if (window.location.pathname === targetPath) return;
        show();
      }, SHOW_DELAY_MS);
    };

    const onUrlCommit = () => {
      if (!active || vtWithLoader) return;
      // La URL cambió sin View Transition: levantamos el cargador apenas asiente.
      clearHide();
      hideTimer = setTimeout(hide, HIDE_AFTER_COMMIT_MS);
    };

    // --- Gatillos: clic en hipervínculo interno a otra ruta ---
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      const anchor =
        target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return; // externos/mailto: nada
      scheduleShow(url.pathname);
    };

    // Escape y Atrás siempre pueden levantar el cargador (nunca dejarlo puesto).
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    const onPopState = () => {
      clearShow();
      hide();
    };

    // --- View Transition: completar la apertura, saltear animaciones y levantar ---
    const docProto = Document.prototype as unknown as { startViewTransition?: StartViewTransition };
    const originalStart = docProto.startViewTransition;
    if (typeof originalStart === "function") {
      docProto.startViewTransition = function patchedStartViewTransition(options?: unknown) {
        clearShow(); // navegación rápida: la transición normal alcanza
        let covered = false;
        if (active) {
          covered = true;
          vtWithLoader = true;
          // La foto de la transición se toma ahora: el cargador debe aparecer completo.
          el.style.transitionDuration = "0s";
          void el.offsetHeight; // fuerza reflow para aplicar el salto
          el.style.transitionDuration = "";
          document.documentElement.classList.add("loader-skip-vt");
        }
        let transition: ViewTransitionHandle;
        try {
          transition = originalStart.call(this, options);
        } catch (error) {
          if (covered) {
            vtWithLoader = false;
            document.documentElement.classList.remove("loader-skip-vt");
          }
          throw error;
        }
        if (covered) {
          const pathAtStart = window.location.pathname;
          const settle = () => {
            vtWithLoader = false;
            document.documentElement.classList.remove("loader-skip-vt");
            // Si la URL cambió, terminó la navegación: se levanta el cargador.
            if (active && window.location.pathname !== pathAtStart) hide();
          };
          transition.finished.then(settle, settle);
        }
        return transition;
      };
    }

    // Señal de commiteo para navegaciones sin View Transition.
    const originalPush = history.pushState;
    history.pushState = function (...args: Parameters<History["pushState"]>) {
      const result = originalPush.apply(this, args);
      onUrlCommit();
      return result;
    };
    const originalReplace = history.replaceState;
    history.replaceState = function (...args: Parameters<History["replaceState"]>) {
      const result = originalReplace.apply(this, args);
      onUrlCommit();
      return result;
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("popstate", onPopState);
      docProto.startViewTransition = originalStart;
      history.pushState = originalPush;
      history.replaceState = originalReplace;
      clearShow();
      clearHide();
    };
  }, []);

  return (
    <div ref={loaderRef} className="page-loader" aria-hidden="true">
      <div className="page-loader__track">
        <span className="page-loader__rail" />
        <span className="page-loader__cart">
          <ShoppingCart className="page-loader__cart-icon" />
          <span className="page-loader__streaks">
            <i className="page-loader__streak" />
            <i className="page-loader__streak" />
          </span>
        </span>
      </div>
    </div>
  );
}
