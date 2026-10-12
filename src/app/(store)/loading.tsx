import { Skeleton, ProductGridSkeleton } from "@/components/ui/skeleton";

export default function StoreLoading() {
  return (
    <div className="container-page py-8" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <Skeleton className="mb-3 h-4 w-48" />
      <Skeleton className="mb-8 h-8 w-72" />
      <ProductGridSkeleton />
    </div>
  );
}
