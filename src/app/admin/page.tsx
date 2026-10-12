import type { Metadata } from "next";
import {
  AlertTriangle,
  DollarSign,
  Package,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { PageTransition } from "@/components/navigation/page-transition";
import { StatCard } from "@/components/admin/stat-card";
import { DashboardCharts } from "@/features/admin/dashboard/dashboard-charts";
import { LowStockList, RecentOrdersTable } from "@/features/admin/dashboard/dashboard-lists";
import { requirePermissionPage } from "@/lib/auth/guards";
import { formatPrice } from "@/lib/format";
import {
  getDailySales,
  getDashboardMetrics,
  getLowStockPreview,
  getOrdersByStatus,
  getRecentOrders,
} from "@/services/admin/dashboard.service";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const user = await requirePermissionPage("dashboard:read", "/admin");
  const now = new Date();
  const [metrics, daily, byStatus, recent, lowStock] = await Promise.all([
    getDashboardMetrics(now),
    getDailySales(now),
    getOrdersByStatus(now),
    getRecentOrders(),
    getLowStockPreview(),
  ]);

  return (
    <PageTransition>
      <PageHeader
        title={`Hola, ${user.firstName}`}
        description="Resumen de la actividad de la tienda (horario de Argentina)."
      />
      <section
        aria-label="Indicadores"
        className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Ventas del día"
          value={formatPrice(metrics.salesToday)}
          icon={<DollarSign />}
        />
        <StatCard
          label="Ventas del mes"
          value={formatPrice(metrics.salesMonth)}
          icon={<TrendingUp />}
          tone="success"
        />
        <StatCard
          label="Pedidos (mes)"
          value={String(metrics.ordersMonth)}
          hint="Confirmados, en preparación, enviados o entregados"
          icon={<ShoppingBag />}
        />
        <StatCard
          label="Ticket promedio"
          value={formatPrice(metrics.averageTicket)}
          icon={<Receipt />}
        />
        <StatCard
          label="Productos vendidos (mes)"
          value={String(metrics.unitsSoldMonth)}
          hint="Unidades"
          icon={<Package />}
        />
        <StatCard
          label="Clientes"
          value={String(metrics.customers)}
          hint="Cuentas registradas"
          icon={<Users />}
        />
        <StatCard
          label="Stock bajo"
          value={String(metrics.lowStock)}
          hint={`${metrics.outOfStock} sin stock`}
          icon={<AlertTriangle />}
          tone={metrics.lowStock + metrics.outOfStock > 0 ? "warning" : "success"}
          href="/admin/inventario?filtro=bajo"
        />
      </section>
      <DashboardCharts daily={daily} byStatus={byStatus} />
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <RecentOrdersTable orders={recent} />
        <LowStockList items={lowStock} />
      </div>
    </PageTransition>
  );
}
