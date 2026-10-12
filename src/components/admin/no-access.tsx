import { ShieldAlert } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

interface Props {
  /** Si el usuario puede entrar al panel, ofrece volver al dashboard. */
  canAccessAdmin?: boolean;
}

export function NoAccess({ canAccessAdmin = false }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <span className="rounded-full bg-warning-soft p-4 text-warning">
        <ShieldAlert className="size-8" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold tracking-tight">No tenés permiso para ver esta sección</h1>
      <p className="text-sm text-muted">
        Tu usuario no tiene los permisos necesarios. Si creés que es un error, pedile acceso a un administrador de la tienda.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {canAccessAdmin && <ButtonLink href="/admin">Ir al panel</ButtonLink>}
        <ButtonLink href="/" variant={canAccessAdmin ? "outline" : "primary"}>Volver a la tienda</ButtonLink>
      </div>
    </div>
  );
}
