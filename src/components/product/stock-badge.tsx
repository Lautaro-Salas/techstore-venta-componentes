import { Badge } from "@/components/ui/badge";
import { LAST_UNITS_THRESHOLD, type StockLevel } from "@/services/inventory/rules";

export function StockBadge({ level, available }: { level: StockLevel; available: number }) {
  if (level === "OUT_OF_STOCK") return <Badge tone="danger">Sin stock</Badge>;
  if (available <= LAST_UNITS_THRESHOLD) {
    return <Badge tone="warning">{available === 1 ? "Última unidad" : `Últimas ${available} unidades`}</Badge>;
  }
  return <Badge tone="success">En stock</Badge>;
}
