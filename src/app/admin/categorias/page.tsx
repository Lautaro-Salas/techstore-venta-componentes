import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { PageTransition } from "@/components/navigation/page-transition";
import { requirePermissionPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { CategoriesPanel } from "@/features/admin/catalog/categories-panel";
import { listAdminCategories } from "@/services/admin/catalog-config.service";

export const metadata: Metadata = { title: "Categorías" };

const BASE = "/admin/categorias";

export default async function AdminCategoriesPage() {
  const user = await requirePermissionPage("products:read", BASE);
  const categories = await listAdminCategories();
  const canWrite = hasPermission(user, "products:write");

  return (
    <PageTransition>
      <PageHeader
        title="Categorías"
        description={`${categories.length} categorías en el catálogo`}
      />
      <CategoriesPanel categories={categories} canWrite={canWrite} />
    </PageTransition>
  );
}
