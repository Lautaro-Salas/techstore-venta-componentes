import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-10" aria-busy="true">
      <span className="sr-only">Cargando checkout…</span>
      <Skeleton className="h-[480px] w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
