import type { OrderStatus } from "@prisma/client";
import { BarChart, type ChartDatum } from "@/components/admin/charts/bar-chart";
import { HorizontalBars } from "@/components/admin/charts/horizontal-bars";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatPrice, pluralize } from "@/lib/format";
import { ORDER_STATUS_LABEL } from "@/services/orders/status";

interface Props {
  daily: { day: string; total: number }[];
  byStatus: { status: OrderStatus; count: number }[];
}

/** "2026-10-07" → "07/10" */
function shortDay(day: string): string {
  const [, month, date] = day.split("-");
  return `${date}/${month}`;
}

export function DashboardCharts({ daily, byStatus }: Props) {
  const salesData: ChartDatum[] = daily.map((d) => ({ label: shortDay(d.day), value: d.total, display: formatPrice(d.total) }));
  const statusData: ChartDatum[] = byStatus.map((s) => ({ label: ORDER_STATUS_LABEL[s.status], value: s.count, display: String(s.count) }));
  const totalSales = daily.reduce((sum, d) => sum + d.total, 0);
  const best = daily.reduce((top, d) => (d.total > top.total ? d : top), daily[0] ?? { day: "", total: 0 });
  const totalOrders = byStatus.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader title="Ventas últimos 14 días" description={`Total: ${formatPrice(totalSales)}`} />
        <CardBody>
          <BarChart
            data={salesData}
            title="Ventas últimos 14 días"
            summary={
              totalSales > 0
                ? `Total ${formatPrice(totalSales)}. Mejor día: ${shortDay(best.day)} con ${formatPrice(best.total)}.`
                : "No hubo ventas en el período."
            }
          />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Pedidos por estado" description={`Este mes · ${pluralize(totalOrders, "pedido", "pedidos")}`} />
        <CardBody>
          <HorizontalBars
            data={statusData}
            title="Pedidos por estado del mes"
            summary={statusData.map((d) => `${d.label}: ${d.display}`).join(", ")}
          />
        </CardBody>
      </Card>
    </div>
  );
}
