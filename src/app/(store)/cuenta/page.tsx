import Link from "next/link";
import { Heart, MapPin, Package, UserRound } from "lucide-react";
import { PageTransition } from "@/components/navigation/page-transition";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OrdersList } from "@/features/account/orders-table";
import { VerifyEmailBanner } from "@/features/account/resend-verification";
import { requireUserPage } from "@/lib/auth/guards";
import { getProfile, listAddresses } from "@/services/account/account.service";
import { listUserOrders } from "@/services/orders/order-queries";
import { getWishlistProductIds } from "@/services/wishlist/wishlist.service";

const RECENT_ORDERS = 3;

export default async function AccountDashboard({
  searchParams,
}: {
  searchParams: Promise<{ bienvenida?: string }>;
}) {
  const user = await requireUserPage("/cuenta");
  const [profile, orders, addresses, wishlist, sp] = await Promise.all([
    getProfile(user.id),
    listUserOrders(user.id, RECENT_ORDERS),
    listAddresses(user.id),
    getWishlistProductIds(user.id),
    searchParams,
  ]);
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Hola, {profile.firstName}
          </h1>
          <p className="text-muted mt-1">
            {sp.bienvenida
              ? "¡Bienvenido! Tu cuenta ya está lista."
              : "Este es el resumen de tu cuenta."}
          </p>
        </div>
        {!profile.emailVerifiedAt && <VerifyEmailBanner email={profile.email} />}

        <Card>
          <CardHeader
            title="Últimos pedidos"
            action={
              orders.length > 0 && (
                <Link
                  href="/cuenta/pedidos"
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Ver todos
                </Link>
              )
            }
          />
          <CardBody className="py-2">
            {orders.length === 0 ? (
              <EmptyState
                className="my-3 border-0"
                icon={<Package />}
                title="Todavía no hiciste pedidos"
                action={
                  <ButtonLink href="/productos" size="sm">
                    Explorar productos
                  </ButtonLink>
                }
              />
            ) : (
              <OrdersList orders={orders} />
            )}
          </CardBody>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/favoritos"
            className="card flex flex-col gap-2 p-5 transition-shadow hover:shadow-lg"
          >
            <Heart className="text-primary size-5" aria-hidden />
            <span className="font-semibold">Favoritos</span>
            <span className="text-muted text-sm">
              {wishlist.length === 0
                ? "Todavía no guardaste productos"
                : `${wishlist.length} guardados`}
            </span>
          </Link>
          <Link
            href="/cuenta/direcciones"
            className="card flex flex-col gap-2 p-5 transition-shadow hover:shadow-lg"
          >
            <MapPin className="text-primary size-5" aria-hidden />
            <span className="font-semibold">Direcciones</span>
            <span className="text-muted line-clamp-2 text-sm">
              {defaultAddress
                ? `${defaultAddress.street} ${defaultAddress.number}, ${defaultAddress.city}`
                : "Agregá una dirección de entrega"}
            </span>
          </Link>
          <Link
            href="/cuenta/datos"
            className="card flex flex-col gap-2 p-5 transition-shadow hover:shadow-lg"
          >
            <UserRound className="text-primary size-5" aria-hidden />
            <span className="font-semibold">Datos personales</span>
            <span className="text-muted truncate text-sm">{profile.email}</span>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
