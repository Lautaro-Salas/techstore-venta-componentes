import type { Metadata } from "next";
import { NoAccess } from "@/components/admin/no-access";
import { PageTransition } from "@/components/navigation/page-transition";

export const metadata: Metadata = { title: "Sin permiso" };

export default function NoPermissionPage() {
  return (
    <PageTransition>
      <NoAccess canAccessAdmin />
    </PageTransition>
  );
}
