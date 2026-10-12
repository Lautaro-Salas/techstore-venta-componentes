import "server-only";
import { db } from "@/lib/db";
import { AppError, notFound } from "@/lib/errors";
import type { BrandInput, CategoryInput } from "@/schemas/admin";
import { recordAudit } from "./audit.service";

/* ------------------------------------------------------------------ */
/*  Categorías                                                       */
/* ------------------------------------------------------------------ */

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
  parentName: string | null;
  productsCount: number;
  childrenCount: number;
}

export async function listAdminCategories(): Promise<CategoryRow[]> {
  const rows = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      parent: { select: { name: true } },
      _count: { select: { products: true, children: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    parentId: row.parentId,
    parentName: row.parent?.name ?? null,
    productsCount: row._count.products,
    childrenCount: row._count.children,
  }));
}

async function assertUniqueCategorySlug(
  slug: string,
  excludeId?: string,
): Promise<void> {
  const existing = await db.category.findFirst({
    where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true },
  });
  if (existing) {
    throw new AppError("CONFLICT", "Ya existe una categoría con ese slug.", {
      slug: "El slug ya está en uso",
    });
  }
}

/**
 * Evita que el árbol de categorías se corte en cycles.
 *
 * `getCategoryTree()` es recursiva y sin conjunto de visitados: un solo ciclo
 * (A padre de B y B padre de A) provoca RangeError y tumba el layout del store,
 * el home, la búsqueda y las fichas de producto. Es crítico rechazarlo al
 * escribir, porque en la UI el selector de padre ya excluye descendientes pero
 * la API no lo garantiza.
 */
async function assertValidParent(
  parentId: string | null,
  selfId?: string,
): Promise<void> {
  if (!parentId) return;
  if (selfId && parentId === selfId) {
    throw new AppError("VALIDATION", "Una categoría no puede ser su propio padre.", {
      parentId: "Elegí otra categoría padre",
    });
  }
  const parent = await db.category.findUnique({
    where: { id: parentId },
    select: { id: true },
  });
  if (!parent) {
    throw new AppError("VALIDATION", "La categoría padre no existe.", {
      parentId: "Elegí una categoría existente",
    });
  }
  if (!selfId) return;
  // Sube desde el padre proposed: si se alcanza a sí mismo, sería un descendiente.
  const seen = new Set<string>();
  let cursor: string | null = parentId;
  while (cursor) {
    if (cursor === selfId) {
      throw new AppError(
        "VALIDATION",
        "No podés mover una categoría debajo de una de sus subcategorías.",
        { parentId: "Elegí una categoría que no sea descendiente" },
      );
    }
    if (seen.has(cursor)) break; // ciclo previo en los datos: cortamos el recorrido
    seen.add(cursor);
    const parentRow: { parentId: string | null } | null = await db.category.findUnique({
      where: { id: cursor },
      select: { parentId: true },
    });
    cursor = parentRow?.parentId ?? null;
  }
}

export async function createCategory(
  input: CategoryInput,
  userId: string,
): Promise<string> {
  await assertUniqueCategorySlug(input.slug);
  await assertValidParent(input.parentId || null);
  const category = await db.category.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      icon: input.icon,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      parentId: input.parentId || null,
    },
    select: { id: true },
  });
  await recordAudit({
    action: "CATEGORY_CREATE",
    entity: "category",
    entityId: category.id,
    userId,
    detail: `Categoría creada: ${input.name}`,
  });
  return category.id;
}

export async function updateCategory(
  id: string,
  input: CategoryInput,
  userId: string,
): Promise<void> {
  const current = await db.category.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!current) throw notFound("Categoría");
  await assertUniqueCategorySlug(input.slug, id);
  await assertValidParent(input.parentId || null, id);
  await db.category.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      icon: input.icon,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      parentId: input.parentId || null,
    },
  });
  await recordAudit({
    action: "CATEGORY_UPDATE",
    entity: "category",
    entityId: id,
    userId,
    detail: `Categoría editada: ${input.name}`,
  });
}

export async function deleteCategory(
  id: string,
  userId: string,
): Promise<void> {
  const category = await db.category.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      _count: { select: { products: true, children: true } },
    },
  });
  if (!category) throw notFound("Categoría");
  if (category._count.products > 0 || category._count.children > 0) {
    throw new AppError(
      "CONFLICT",
      category._count.products > 0
        ? `Hay ${category._count.products} producto(s) en esta categoría. Reasigná los productos antes de eliminarla.`
        : `Tiene ${category._count.children} subcategoría(s). Eliminá o reubicá las subcategorías primero.`,
    );
  }
  await db.category.delete({ where: { id } });
  await recordAudit({
    action: "CATEGORY_DELETE",
    entity: "category",
    entityId: id,
    userId,
    detail: `Categoría eliminada: ${category.name}`,
  });
}

export async function toggleCategory(
  id: string,
  userId: string,
): Promise<boolean> {
  const category = await db.category.findUnique({
    where: { id },
    select: { id: true, name: true, isActive: true },
  });
  if (!category) throw notFound("Categoría");
  const isActive = !category.isActive;
  await db.category.update({ where: { id }, data: { isActive } });
  await recordAudit({
    action: "CATEGORY_UPDATE",
    entity: "category",
    entityId: id,
    userId,
    detail: `Categoría ${category.name}: ${isActive ? "activada" : "desactivada"}`,
  });
  return isActive;
}

/* ------------------------------------------------------------------ */
/*  Marcas                                                           */
/* ------------------------------------------------------------------ */

export interface BrandRow {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  productsCount: number;
}

export async function listAdminBrands(): Promise<BrandRow[]> {
  const rows = await db.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logoUrl,
    productsCount: row._count.products,
  }));
}

export async function createBrand(
  input: BrandInput,
  userId: string,
): Promise<string> {
  // El nombre y el slug son únicos.
  const clash = await db.brand.findFirst({
    where: { OR: [{ name: input.name }, { slug: input.slug }] },
    select: { id: true, name: true, slug: true },
  });
  if (clash) {
    throw new AppError(
      "CONFLICT",
      clash.name === input.name
        ? "Ya existe una marca con ese nombre."
        : "Ya existe una marca con ese slug.",
      clash.name === input.name
        ? { name: "El nombre ya está en uso" }
        : { slug: "El slug ya está en uso" },
    );
  }
  const brand = await db.brand.create({
    data: { name: input.name, slug: input.slug, logoUrl: input.logoUrl },
    select: { id: true },
  });
  await recordAudit({
    action: "BRAND_CREATE",
    entity: "brand",
    entityId: brand.id,
    userId,
    detail: `Marca creada: ${input.name}`,
  });
  return brand.id;
}

export async function updateBrand(
  id: string,
  input: BrandInput,
  userId: string,
): Promise<void> {
  const current = await db.brand.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true },
  });
  if (!current) throw notFound("Marca");
  // Nombre y slug son únicos: verificar choques con OTRAS marcas.
  const clash = await db.brand.findFirst({
    where: {
      AND: [
        { NOT: { id } },
        { OR: [{ name: input.name }, { slug: input.slug }] },
      ],
    },
    select: { id: true, name: true, slug: true },
  });
  if (clash) {
    throw new AppError(
      "CONFLICT",
      clash.name === input.name
        ? "Ya existe otra marca con ese nombre."
        : "Ya existe otra marca con ese slug.",
      clash.name === input.name
        ? { name: "El nombre ya está en uso" }
        : { slug: "El slug ya está en uso" },
    );
  }
  await db.brand.update({
    where: { id },
    data: { name: input.name, slug: input.slug, logoUrl: input.logoUrl },
  });
  await recordAudit({
    action: "BRAND_UPDATE",
    entity: "brand",
    entityId: id,
    userId,
    detail: `Marca editada: ${input.name}`,
  });
}

export async function deleteBrand(
  id: string,
  userId: string,
): Promise<void> {
  const brand = await db.brand.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      _count: { select: { products: true } },
    },
  });
  if (!brand) throw notFound("Marca");
  if (brand._count.products > 0) {
    throw new AppError(
      "CONFLICT",
      `Hay ${brand._count.products} producto(s) de esta marca. Reasigná los productos antes de eliminarla.`,
    );
  }
  await db.brand.delete({ where: { id } });
  await recordAudit({
    action: "BRAND_DELETE",
    entity: "brand",
    entityId: id,
    userId,
    detail: `Marca eliminada: ${brand.name}`,
  });
}
