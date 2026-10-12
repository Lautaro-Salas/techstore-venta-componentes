/**
 * RBAC: fuente de verdad de roles y permisos.
 * El seed sincroniza estas definiciones con las tablas roles/permissions.
 * Este módulo no depende del servidor: se usa también en el frontend para ocultar UI.
 */

export const ROLES = ["CUSTOMER", "STAFF", "ADMIN", "SUPER_ADMIN"] as const;
export type RoleName = (typeof ROLES)[number];

export const PERMISSIONS = {
  "admin:access": "Acceder al panel administrativo",
  "dashboard:read": "Ver métricas del dashboard",
  "products:read": "Ver productos en el admin",
  "products:write": "Crear y editar productos",
  "products:delete": "Eliminar productos",
  "inventory:read": "Ver inventario",
  "inventory:write": "Ajustar inventario",
  "orders:read": "Ver pedidos",
  "orders:write": "Modificar estado de pedidos",
  "customers:read": "Ver clientes",
  "discounts:read": "Ver descuentos",
  "discounts:write": "Gestionar cupones y promociones",
  "settings:read": "Ver configuración",
  "settings:write": "Modificar configuración de la tienda",
  "messages:read": "Ver mensajes de contacto",
  "messages:write": "Cambiar estado de mensajes de contacto",
  "users:manage": "Gestionar roles de usuarios",
} as const;

export type Permission = keyof typeof PERMISSIONS;

const STAFF_PERMISSIONS: Permission[] = [
  "admin:access",
  "dashboard:read",
  "products:read",
  "products:write",
  "inventory:read",
  "inventory:write",
  "orders:read",
  "orders:write",
  "customers:read",
  "discounts:read",
  "messages:read",
  "messages:write",
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...STAFF_PERMISSIONS,
  "products:delete",
  "discounts:write",
  "settings:read",
  "settings:write",
];

export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  CUSTOMER: [],
  STAFF: STAFF_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  SUPER_ADMIN: Object.keys(PERMISSIONS) as Permission[],
};

export interface PermissionSubject {
  role: string;
  permissions: readonly string[];
}

export function hasPermission(
  subject: PermissionSubject | null | undefined,
  permission: Permission,
): boolean {
  if (!subject) return false;
  if (subject.role === "SUPER_ADMIN") return true;
  return subject.permissions.includes(permission);
}
