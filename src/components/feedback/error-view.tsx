"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";

/** Pantalla de error amigable: nunca muestra detalles técnicos al usuario. */
export function ErrorView({ retry, digest }: { retry: () => void; digest?: string }) {
  return (
    <div className="container-page flex flex-col items-center gap-4 py-20 text-center" role="alert">
      <div className="rounded-full bg-danger-soft p-4 text-danger"><AlertTriangle className="size-8" aria-hidden /></div>
      <h1 className="text-2xl font-bold tracking-tight">Algo salió mal</h1>
      <p className="max-w-md text-muted">Tuvimos un problema al cargar esta página. Probá de nuevo en unos segundos; si sigue pasando, contactanos.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={retry} icon={<RotateCcw className="size-4" aria-hidden />}>Reintentar</Button>
        <Link href="/" className={buttonClasses({ variant: "outline" })}>Ir al inicio</Link>
      </div>
      {digest && <p className="text-xs text-muted">Código de referencia: {digest}</p>}
    </div>
  );
}
