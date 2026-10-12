import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="rounded-full bg-surface-2 p-4 text-muted"><SearchX className="size-8" aria-hidden /></div>
      <p className="text-sm font-semibold text-primary">Error 404</p>
      <h1 className="text-3xl font-bold tracking-tight">No encontramos esta página</h1>
      <p className="max-w-md text-muted">Puede que el link esté mal escrito o que el producto ya no esté disponible.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/" className={buttonClasses()}>Ir al inicio</Link>
        <Link href="/productos" className={buttonClasses({ variant: "outline" })}>Ver productos</Link>
      </div>
    </main>
  );
}
