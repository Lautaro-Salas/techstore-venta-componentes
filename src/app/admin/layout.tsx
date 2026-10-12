import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { NoAccess } from "@/components/admin/no-access";
import { requireUserPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { getStoreSettings } from "@/services/settings/settings.service";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireUserPage("/admin");
  // Sin acceso al panel se muestra la pantalla directamente: redirigir a /admin/sin-permiso
  // volvería a pasar por este layout y generaría un bucle.
  if (!hasPermission(user, "admin:access")) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background">
        <NoAccess />
      </main>
    );
  }
  const settings = await getStoreSettings();
  return (
    <AdminShell storeName={settings.name} userName={user.firstName} subject={{ role: user.role, permissions: user.permissions }}>
      {children}
    </AdminShell>
  );
}
