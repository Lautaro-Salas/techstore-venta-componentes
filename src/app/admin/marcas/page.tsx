import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { PageTransition } from "@/components/navigation/page-transition";
import { requirePermissionPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { BrandsPanel } from "@/features/admin/catalog/brands-panel";
import { listAdminBrands } from "@/services/admin/catalog-config.service";

export const metadata: Metadata = { title: "Marcas" };

const BASE = "/admin/marcas";

export default async function AdminBrandsPage() {
  const user = await requirePermissionPage("products:read", BASE);
  const brands = await listAdminBrands();
  const canWrite = hasPermission(user, "products:write");

  return (
    <PageTransition>
      <PageHeader
        title="Marcas"
        description={`${brands.length} marcas en el catálogo`}
      />
      <BrandsPanel brands={brands} canWrite={canWrite} />
    </PageTransition>
  );
}
