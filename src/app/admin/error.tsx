"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

interface Props {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function AdminError({ error, retry }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center" role="alert">
      <span className="rounded-full bg-danger-soft p-4 text-danger">
        <AlertTriangle className="size-8" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold tracking-tight">No pudimos cargar esta sección</h1>
      <p className="text-sm text-muted">
        Ocurrió un error inesperado. Probá de nuevo en unos segundos; si el problema sigue, avisale al equipo técnico.
      </p>
      {error.digest && <p className="text-xs text-muted">Código de referencia: <code>{error.digest}</code></p>}
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => retry()} icon={<RotateCcw className="size-4" aria-hidden />}>Reintentar</Button>
        <ButtonLink href="/admin" variant="outline">Ir al dashboard</ButtonLink>
      </div>
    </div>
  );
}
