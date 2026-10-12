import { Boxes, ClipboardList, FolderTree, LayoutDashboard, Mail, Package, Settings, ShoppingBag, Tag, TicketPercent, Users, type LucideIcon } from "lucide-react";
import type { Permission } from "@/lib/auth/permissions";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
}

export interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavSection[] = [
  {
    title: "General",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:read" },
      { href: "/admin/auditoria", label: "Auditoría", icon: ClipboardList, permission: "settings:read" },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/admin/productos", label: "Productos", icon: Package, permission: "products:read" },
      { href: "/admin/categorias", label: "Categorías", icon: FolderTree, permission: "products:read" },
      { href: "/admin/marcas", label: "Marcas", icon: Tag, permission: "products:read" },
      { href: "/admin/inventario", label: "Inventario", icon: Boxes, permission: "inventory:read" },
      { href: "/admin/descuentos", label: "Descuentos", icon: TicketPercent, permission: "discounts:read" },
    ],
  },
  {
    title: "Ventas",
    items: [
      { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag, permission: "orders:read" },
      { href: "/admin/clientes", label: "Clientes", icon: Users, permission: "customers:read" },
      { href: "/admin/mensajes", label: "Mensajes", icon: Mail, permission: "messages:read" },
    ],
  },
  {
    title: "Tienda",
    items: [{ href: "/admin/configuracion", label: "Configuración", icon: Settings, permission: "settings:read" }],
  },
];

export function isActivePath(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}
