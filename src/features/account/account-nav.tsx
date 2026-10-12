"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutDashboard, LogOut, MapPin, Package, Settings, Star, UserRound } from "lucide-react";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/cuenta", label: "Resumen", Icon: LayoutDashboard, exact: true },
  { href: "/cuenta/pedidos", label: "Pedidos", Icon: Package },
  { href: "/favoritos", label: "Favoritos", Icon: Heart },
  { href: "/cuenta/direcciones", label: "Direcciones", Icon: MapPin },
  { href: "/cuenta/datos", label: "Datos personales", Icon: UserRound },
  { href: "/cuenta/resenas", label: "Reseñas", Icon: Star },
  { href: "/cuenta/configuracion", label: "Configuración", Icon: Settings },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Mi cuenta" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <ul className="flex gap-2 lg:flex-col lg:gap-1">
        {ITEMS.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors", active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-foreground")}>
                <Icon className="size-4" aria-hidden /> {label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 lg:mt-2 lg:border-t lg:border-border lg:pt-2">
          <form action={logoutAction}>
            <button type="submit" className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium whitespace-nowrap text-muted hover:bg-danger-soft hover:text-danger">
              <LogOut className="size-4" aria-hidden /> Cerrar sesión
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
