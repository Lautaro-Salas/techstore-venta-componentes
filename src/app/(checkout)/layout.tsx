import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { getStoreSettings } from "@/services/settings/settings.service";

/** Layout reducido: sin menús ni distracciones durante la compra. */
export default async function CheckoutLayout({ children }: { children: ReactNode }) {
  const settings = await getStoreSettings();
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Logo name={settings.name} logoUrl={settings.logoUrl || undefined} />
          <p className="flex items-center gap-1.5 text-sm text-muted"><Lock className="size-4 text-success" aria-hidden /> Compra segura</p>
        </div>
      </header>
      <main id="contenido" className="container-page py-6 sm:py-10">{children}</main>
      <footer className="container-page flex flex-wrap items-center justify-between gap-3 border-t border-border py-6 text-xs text-muted">
        <Link href="/carrito" className="flex items-center gap-1 hover:text-foreground"><ArrowLeft className="size-3.5" aria-hidden /> Volver al carrito</Link>
        <nav className="flex gap-4" aria-label="Legales">
          <Link href="/legales/terminos" className="hover:text-foreground">Términos</Link>
          <Link href="/legales/privacidad" className="hover:text-foreground">Privacidad</Link>
          <Link href="/contacto" className="hover:text-foreground">Ayuda</Link>
        </nav>
      </footer>
    </>
  );
}
