import Link from "next/link";
import { ImageOff } from "lucide-react";
import { AdminTable, EmptyRow } from "@/components/admin/admin-table";
import { PRODUCT_STATUS_LABEL, PRODUCT_STATUS_TONE } from "@/components/admin/labels";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminProductRow } from "@/services/admin/products.service";
import { ProductRowActions } from "./product-row-actions";

const HEAD = [
  { label: "Imagen", srOnly: true },
  { label: "Nombre" },
  { label: "SKU" },
  { label: "Marca" },
  { label: "Categoría" },
  { label: "Precio", className: "text-right" },
  { label: "Disponible", className: "text-right" },
  { label: "Estado" },
  { label: "Acciones", srOnly: true },
];

interface Props {
  products: AdminProductRow[];
  canWrite: boolean;
  canDelete: boolean;
}

export function ProductsTable({ products, canWrite, canDelete }: Props) {
  return (
    <AdminTable caption="Listado de productos" head={HEAD} minWidth="min-w-[960px]">
      <tbody>
        {products.length === 0 && <EmptyRow colSpan={HEAD.length} message="No encontramos productos con esos filtros." />}
        {products.map((p) => (
        <tr key={p.id}>
          <td className="w-16">
            <span className="grid size-12 place-items-center overflow-hidden rounded-lg bg-surface-2">
              {p.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura del admin
                <img src={p.images[0].url} alt="" className="size-full object-cover" loading="lazy" />
              ) : (
                <ImageOff className="size-4 text-muted" aria-hidden />
              )}
            </span>
          </td>
          <td className="max-w-72">
            {canWrite ? (
              <Link href={`/admin/productos/${p.id}`} className="line-clamp-2 font-medium hover:text-primary">{p.name}</Link>
            ) : (
              <span className="line-clamp-2 font-medium">{p.name}</span>
            )}
          </td>
          <td className="font-mono text-xs whitespace-nowrap">{p.sku}</td>
          <td className="whitespace-nowrap">{p.brand.name}</td>
          <td className="whitespace-nowrap">{p.category.name}</td>
          <td className="text-right font-medium whitespace-nowrap tabular-nums">{formatPrice(p.price)}</td>
          <td className={cn("text-right tabular-nums", p.availableStock <= 0 && "font-semibold text-danger")}>{p.availableStock}</td>
          <td><Badge tone={PRODUCT_STATUS_TONE[p.status]}>{PRODUCT_STATUS_LABEL[p.status]}</Badge></td>
          <td className="text-right">
            {(canWrite || canDelete) && (
              <ProductRowActions product={{ id: p.id, name: p.name, status: p.status }} canWrite={canWrite} canDelete={canDelete} />
            )}
          </td>
        </tr>
      ))}
      </tbody>
    </AdminTable>
  );
}
