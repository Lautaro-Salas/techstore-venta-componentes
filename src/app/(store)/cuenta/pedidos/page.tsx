import type { Metadata } from "next";
import { Package } from "lucide-react";
import { PageTransition } from "@/components/navigation/page-transition";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { OrdersList } from "@/features/account/orders-table";
import { requireUserPage } from "@/lib/auth/guards";
import { listUserOrders } from "@/services/orders/order-queries";

export const metadata: Metadata = { title: "Mis pedidos" };

export default async function OrdersPage() {
  const user = await requireUserPage("/cuenta/pedidos");
  const orders = await listUserOrders(user.id);
  return (
    <PageTransition>
      <div>
        <h1 className="mb-5 text-2xl font-bold tracking-tight">Mis pedidos</h1>
        {orders.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title="Todavía no hiciste pedidos"
            description="Cuando compres, vas a poder seguir el estado de tus pedidos acá."
            action={<ButtonLink href="/productos">Explorar productos</ButtonLink>}
          />
        ) : (
          <div className="card px-3 sm:px-4">
            <OrdersList orders={orders} />
          </div>
        )}
      </div>
    </PageTransition>
  );
}
