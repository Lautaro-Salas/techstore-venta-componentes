import Link from "next/link";
import { cn } from "@/lib/utils";
import { AdminTable, EmptyRow } from "@/components/admin/admin-table";
import { STOCK_LEVEL_TONE } from "@/components/admin/labels";
import { Badge } from "@/components/ui/badge";
import type { StockLevel } from "@/services/inventory/rules";
import { STOCK_LEVEL_LABEL, stockLevel } from "@/services/inventory/rules";
import type { InventoryRow } from "@/services/admin/inventory.service";

const HEAD = [
  { label: "Producto" },
  { label: "SKU" },
  { label: "Disponible", className: "text-right" },
  { label: "Físico", className: "text-right" },
  { label: "Reservado", className: "text-right" },
  { label: "Mínimo", className: "text-right" },
  { label: "Nivel" },
  { label: "Acciones", srOnly: true },
];

interface Props {
  products: InventoryRow[];
  selectedId?: string;
  canWrite: boolean;
  hrefForProduct: (id: string) => string;
}

/** Tabla de inventario. "Ajustar" navega a ?producto=id (sin JS también funciona). */
export function InventoryTable({ products, selectedId, canWrite, hrefForProduct }: Props) {
  return (
    <AdminTable caption="Inventario por producto" head={HEAD} minWidth="min-w-[860px]">
      <tbody>
        {products.length === 0 ? (
          <EmptyRow colSpan={HEAD.length} message="No hay productos con esos filtros." />
        ) : (
          products.map((p) => {
            const level: StockLevel = stockLevel(p.availableStock, p.minStock);
            const selected = p.id === selectedId;
            return (
              <tr key={p.id} className={cn(selected && "bg-primary-soft/40")}>
                <td className="font-medium">{p.name}</td>
                <td className="text-muted">{p.sku}</td>
                <td className="text-right font-semibold tabular-nums">{p.availableStock}</td>
                <td className="text-right tabular-nums">{p.quantity}</td>
                <td className="text-right tabular-nums">{p.reserved}</td>
                <td className="text-right tabular-nums">{p.minStock}</td>
                <td>
                  <Badge tone={STOCK_LEVEL_TONE[level]}>{STOCK_LEVEL_LABEL[level]}</Badge>
                </td>
                <td className="text-right">
                  {canWrite && (
                    <Link
                      href={hrefForProduct(p.id)}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Ajustar
                    </Link>
                  )}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </AdminTable>
  );
}
