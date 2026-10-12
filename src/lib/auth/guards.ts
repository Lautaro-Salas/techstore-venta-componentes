import "server-only";
import { redirect } from "next/navigation";
import { AppError } from "@/lib/errors";
import { hasPermission, type Permission } from "./permissions";
import { getCurrentUser } from "./session";
import type { SessionUser } from "@/types/auth";

/** Para páginas: redirige al login si no hay sesión. */
export async function requireUserPage(returnTo: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/** Para páginas del admin: exige sesión y permiso. */
export async function requirePermissionPage(permission: Permission, returnTo = "/admin"): Promise<SessionUser> {
  const user = await requireUserPage(returnTo);
  if (!hasPermission(user, permission)) redirect("/admin/sin-permiso");
  return user;
}

/** Para server actions y route handlers: lanza errores controlados. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AppError("UNAUTHENTICATED", "Necesitás iniciar sesión para continuar.");
  return user;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasPermission(user, permission)) {
    throw new AppError("FORBIDDEN", "No tenés permisos para realizar esta acción.");
  }
  return user;
}
