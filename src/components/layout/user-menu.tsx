"use client";

import Link from "next/link";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Settings,
  Star,
  User,
} from "lucide-react";
import { Dropdown, dropdownItemClass } from "@/components/ui/dropdown";
import { logoutAction } from "@/features/auth/actions";

interface Props {
  user: { firstName: string; email: string } | null;
  canAccessAdmin: boolean;
}

export function UserMenu({ user, canAccessAdmin }: Props) {
  if (!user) {
    return (
      <Link
        href="/ingresar"
        className="hover:bg-surface-2 hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium md:flex"
      >
        <User className="size-5" aria-hidden />
        <span>Ingresar</span>
      </Link>
    );
  }
  return (
    <Dropdown
      trigger={({ toggle, open, id }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={id}
          className="hover:bg-surface-2 hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium md:flex"
        >
          <span className="bg-cta text-primary-foreground grid size-7 place-items-center rounded-full text-xs font-bold shadow-sm">
            {user.firstName.charAt(0).toUpperCase()}
          </span>
          <span className="max-w-28 truncate">Hola, {user.firstName}</span>
        </button>
      )}
    >
      <div className="border-border border-b px-3 pt-1 pb-2">
        <p className="text-sm font-semibold">{user.firstName}</p>
        <p className="text-muted truncate text-xs">{user.email}</p>
      </div>
      <nav className="py-1" aria-label="Mi cuenta">
        <Link href="/cuenta" className={dropdownItemClass}>
          <User className="size-4" aria-hidden /> Mi cuenta
        </Link>
        <Link href="/cuenta/pedidos" className={dropdownItemClass}>
          <Package className="size-4" aria-hidden /> Mis pedidos
        </Link>
        <Link href="/favoritos" className={dropdownItemClass}>
          <Heart className="size-4" aria-hidden /> Favoritos
        </Link>
        <Link href="/cuenta/direcciones" className={dropdownItemClass}>
          <MapPin className="size-4" aria-hidden /> Direcciones
        </Link>
        <Link href="/cuenta/resenas" className={dropdownItemClass}>
          <Star className="size-4" aria-hidden /> Mis reseñas
        </Link>
        <Link href="/cuenta/configuracion" className={dropdownItemClass}>
          <Settings className="size-4" aria-hidden /> Configuración
        </Link>
        {canAccessAdmin && (
          <Link href="/admin" className={dropdownItemClass}>
            <LayoutDashboard className="size-4" aria-hidden /> Panel administrativo
          </Link>
        )}
      </nav>
      <form action={logoutAction} className="border-border border-t pt-1">
        <button type="submit" className={dropdownItemClass}>
          <LogOut className="size-4" aria-hidden /> Cerrar sesión
        </button>
      </form>
    </Dropdown>
  );
}
