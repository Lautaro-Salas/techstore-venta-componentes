import { Skeleton } from "@/components/ui/skeleton";

const STAT_PLACEHOLDERS = 4;
const ROW_PLACEHOLDERS = 6;

export default function AdminLoading() {
  return (
    <div role="status" aria-label="Cargando" className="flex flex-col gap-6">
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: STAT_PLACEHOLDERS }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="card flex flex-col gap-3 p-4">
        {Array.from({ length: ROW_PLACEHOLDERS }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
