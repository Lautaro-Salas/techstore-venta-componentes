import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto propio de /cuenta: evita mostrar la grilla de productos del loading genérico. */
export default function AccountLoading() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <span className="sr-only">Cargando tu cuenta…</span>
      <Skeleton className="h-8 w-56" />
      <div className="card flex flex-col gap-4 p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="card flex flex-col gap-4 p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
