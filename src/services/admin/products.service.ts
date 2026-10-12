import "server-only";
import { Prisma, type ProductStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError, notFound } from "@/lib/errors";
import { ADMIN_PAGE_SIZE, totalPages, withSearchAnd, type Paginated } from "@/lib/admin/query";
import type { ProductInput } from "@/schemas/admin";
import { adjustStock } from "@/services/inventory/inventory.service";
import { getStorage } from "@/services/storage";
import { recordAudit } from "./audit.service";

const COPY_ATTEMPTS = 20;
const DEFAULT_SPEC_GROUP = "General";

const listSelect = {
  id: true,
  name: true,
  sku: true,
  slug: true,
  status: true,
  price: true,
  availableStock: true,
  brand: { select: { name: true } },
  category: { select: { name: true } },
  images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
} satisfies Prisma.ProductSelect;

export type AdminProductRow = Prisma.ProductGetPayload<{ select: typeof listSelect }>;

export const PRODUCT_SORTS = ["updated", "created", "name", "price", "stock"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

const SORT_COLUMNS: Record<ProductSort, Prisma.ProductOrderByWithRelationInput> = {
  updated: { updatedAt: "desc" },
  created: { createdAt: "desc" },
  name: { name: "asc" },
  price: { price: "desc" },
  stock: { availableStock: "desc" },
};

export async function listAdminProducts(params: {
  q: string;
  status?: ProductStatus;
  categoryId?: string;
  sort?: ProductSort;
  page: number;
}): Promise<Paginated<AdminProductRow>> {
  const and: Prisma.ProductWhereInput[] = [];
  withSearchAnd<Prisma.ProductWhereInput>(and, params.q, ["name", "sku"]);
  if (params.status) and.push({ status: params.status });
  if (params.categoryId)
    and.push({
      OR: [{ categoryId: params.categoryId }, { category: { parentId: params.categoryId } }],
    });
  const where: Prisma.ProductWhereInput = { AND: and };
  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      select: listSelect,
      orderBy: SORT_COLUMNS[params.sort ?? "updated"],
      skip: (params.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.product.count({ where }),
  ]);
  return { items, total, page: params.page, totalPages: totalPages(total) };
}

export interface CategoryOption {
  value: string;
  label: string;
}

/** Categorías en orden jerárquico con sangría ("- Subcategoría"). */
export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const rows = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, parentId: true },
  });
  const byParent = new Map<string | null, typeof rows>();
  for (const row of rows) byParent.set(row.parentId, [...(byParent.get(row.parentId) ?? []), row]);
  const walk = (parentId: string | null, depth: number): CategoryOption[] =>
    (byParent.get(parentId) ?? []).flatMap((c) => [
      { value: c.id, label: `${"- ".repeat(depth)}${c.name}` },
      ...walk(c.id, depth + 1),
    ]);
  return walk(null, 0);
}

export async function getBrandOptions(): Promise<CategoryOption[]> {
  const brands = await db.brand.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return brands.map((b) => ({ value: b.id, label: b.name }));
}

export async function getProductForEdit(id: string) {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      specifications: { orderBy: { sortOrder: "asc" } },
      inventory: { select: { quantity: true, reserved: true, minStock: true } },
    },
  });
  if (!product) return null;
  const quantity = product.inventory.reduce((s, i) => s + i.quantity, 0);
  const minStock = product.inventory.reduce((m, i) => Math.max(m, i.minStock), 0);
  return { ...product, stockQuantity: quantity, minStock };
}

async function assertUnique(sku: string, slug: string, excludeId?: string): Promise<void> {
  // "contains" en SQLite ignora mayúsculas; comparamos en minúsculas para detectar
  // variantes de mayúsculas del mismo SKU (como hacía mode: "insensitive" en Postgres).
  const candidates = await db.product.findMany({
    where: {
      OR: [{ sku: { contains: sku } }, { slug }],
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { sku: true, slug: true },
  });
  const clash = candidates.find(
    (p) => p.sku.toLowerCase() === sku.toLowerCase() || p.slug === slug,
  );
  if (!clash) return;
  const fieldErrors: Record<string, string> = {};
  if (clash.sku.toLowerCase() === sku.toLowerCase())
    fieldErrors.sku = "Ya existe un producto con este SKU";
  if (clash.slug === slug) fieldErrors.slug = "Ya existe un producto con este slug";
  throw new AppError("VALIDATION", "El SKU o el slug ya están en uso.", fieldErrors);
}

function productData(input: ProductInput) {
  return {
    name: input.name,
    sku: input.sku,
    slug: input.slug,
    shortDescription: input.shortDescription || null,
    description: input.description,
    price: input.price,
    compareAtPrice: input.compareAtPrice,
    cost: input.cost,
    weightGrams: input.weightGrams,
    lengthMm: input.lengthMm,
    widthMm: input.widthMm,
    heightMm: input.heightMm,
    warrantyMonths: input.warrantyMonths,
    status: input.status,
    isFeatured: input.isFeatured,
    tags: input.tags,
    brand: { connect: { id: input.brandId } },
    category: { connect: { id: input.categoryId } },
  };
}

function imageRows(input: ProductInput, fallbackAlt: string) {
  return input.images.map((img, i) => ({
    url: img.url,
    alt: img.alt || fallbackAlt,
    sortOrder: i,
  }));
}

function specRows(input: ProductInput) {
  return input.specifications.map((s, i) => ({
    ...s,
    group: s.group || DEFAULT_SPEC_GROUP,
    sortOrder: i,
  }));
}

/** Convierte violaciones de unicidad que se escapen del chequeo previo en un error amigable. */
function friendlyUniqueError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new AppError("VALIDATION", "El SKU o el slug ya están en uso.", {
      sku: "Revisá que el SKU y el slug sean únicos",
    });
  }
  throw error;
}

export async function createProduct(input: ProductInput, userId: string): Promise<string> {
  await assertUnique(input.sku, input.slug);
  const product = await db.product
    .create({
      data: {
        ...productData(input),
        images: { create: imageRows(input, input.name) },
        specifications: { create: specRows(input) },
      },
      select: { id: true },
    })
    .catch(friendlyUniqueError);
  await adjustStock({
    productId: product.id,
    delta: input.initialStock ?? 0,
    reason: "Stock inicial",
    userId,
    minStock: input.minStock,
  });
  await recordAudit({
    action: "PRODUCT_CREATE",
    entity: "product",
    entityId: product.id,
    userId,
    detail: input.name,
  });
  return product.id;
}

/** Borra del almacenamiento las imágenes que ya no usa ningún producto. */
async function removeOrphanImages(urls: string[]): Promise<void> {
  const storage = getStorage();
  for (const url of urls.filter((u) => storage.owns(u))) {
    const stillUsed = await db.productImage.count({ where: { url } });
    if (stillUsed === 0) await storage.delete(url);
  }
}

export async function updateProduct(
  id: string,
  input: ProductInput,
  userId: string,
): Promise<void> {
  const current = await getProductForEdit(id);
  if (!current) throw notFound("Producto");
  await assertUnique(input.sku, input.slug, id);
  await db
    .$transaction([
      db.productImage.deleteMany({ where: { productId: id } }),
      db.productSpecification.deleteMany({ where: { productId: id } }),
      db.product.update({
        where: { id },
        data: {
          ...productData(input),
          images: { create: imageRows(input, input.name) },
          specifications: { create: specRows(input) },
        },
      }),
    ])
    .catch(friendlyUniqueError);
  const keptUrls = new Set(input.images.map((i) => i.url));
  await removeOrphanImages(current.images.map((i) => i.url).filter((u) => !keptUrls.has(u)));
  if (current.minStock !== input.minStock || current.inventory.length === 0) {
    await adjustStock({
      productId: id,
      delta: 0,
      reason: "Cambio de stock mínimo",
      userId,
      minStock: input.minStock,
    });
  }
  const priceChanged =
    current.price !== input.price ||
    (current.compareAtPrice ?? null) !== (input.compareAtPrice ?? null);
  await recordAudit({
    action: "PRODUCT_UPDATE",
    entity: "product",
    entityId: id,
    userId,
    detail: input.name,
  });
  if (priceChanged) {
    await recordAudit({
      action: "PRODUCT_PRICE_CHANGE",
      entity: "product",
      entityId: id,
      userId,
      detail: `${input.name}: precio ${current.price} → ${input.price}`,
    });
  }
}

async function nextFreeCopy(base: {
  slug: string;
  sku: string;
}): Promise<{ slug: string; sku: string }> {
  for (let n = 1; n <= COPY_ATTEMPTS; n++) {
    const suffix = n === 1 ? "copia" : `copia-${n}`;
    const candidate = {
      slug: `${base.slug}-${suffix}`,
      sku: `${base.sku}-${suffix.toUpperCase()}`,
    };
    const taken = await db.product.count({
      where: { OR: [{ slug: candidate.slug }, { sku: candidate.sku }] },
    });
    if (taken === 0) return candidate;
  }
  throw new AppError(
    "CONFLICT",
    "No se pudo generar un SKU único para la copia. Renombrá las copias existentes.",
  );
}

/** Duplica un producto como borrador, sin stock. Devuelve el id de la copia. */
export async function duplicateProduct(id: string, userId: string): Promise<string> {
  const source = await getProductForEdit(id);
  if (!source) throw notFound("Producto");
  const unique = await nextFreeCopy(source);
  const copy = await db.product.create({
    data: {
      name: `${source.name} (copia)`,
      slug: unique.slug,
      sku: unique.sku,
      shortDescription: source.shortDescription,
      description: source.description,
      price: source.price,
      compareAtPrice: source.compareAtPrice,
      cost: source.cost,
      weightGrams: source.weightGrams,
      lengthMm: source.lengthMm,
      widthMm: source.widthMm,
      heightMm: source.heightMm,
      warrantyMonths: source.warrantyMonths,
      status: "DRAFT",
      isFeatured: false,
      tags: source.tags ?? undefined,
      brandId: source.brandId,
      categoryId: source.categoryId,
      images: { create: source.images.map(({ url, alt, sortOrder }) => ({ url, alt, sortOrder })) },
      specifications: {
        create: source.specifications.map(
          ({ group, key, label, value, filterable, sortOrder }) => ({
            group,
            key,
            label,
            value,
            filterable,
            sortOrder,
          }),
        ),
      },
    },
    select: { id: true },
  });
  await adjustStock({
    productId: copy.id,
    delta: 0,
    reason: "Producto duplicado",
    userId,
    minStock: source.minStock,
  });
  await recordAudit({
    action: "PRODUCT_DUPLICATE",
    entity: "product",
    entityId: copy.id,
    userId,
    detail: `${source.name} → ${source.name} (copia)`,
  });
  return copy.id;
}

export async function toggleProductStatus(
  id: string,
  userId?: string,
): Promise<ProductStatus> {
  const product = await db.product.findUnique({
    where: { id },
    select: { id: true, name: true, status: true },
  });
  if (!product) throw notFound("Producto");
  const status: ProductStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await db.product.update({ where: { id }, data: { status } });
  await recordAudit({
    action: "PRODUCT_UPDATE",
    entity: "product",
    entityId: id,
    userId: userId ?? null,
    detail: `${product.name}: estado → ${status}`,
  });
  return status;
}

/** Elimina el producto; si ya tiene ventas se archiva para conservar el historial. */
export async function deleteOrArchiveProduct(
  id: string,
  userId?: string,
): Promise<{ archived: boolean }> {
  const product = await db.product.findUnique({
    where: { id },
    select: {
      name: true,
      images: { select: { url: true } },
      _count: { select: { orderItems: true } },
    },
  });
  if (!product) throw notFound("Producto");
  if (product._count.orderItems > 0) {
    await db.product.update({ where: { id }, data: { status: "ARCHIVED", isFeatured: false } });
    await recordAudit({
      action: "PRODUCT_DELETE",
      entity: "product",
      entityId: id,
      userId: userId ?? null,
      detail: `${product.name} (archivado: tiene ventas)`,
    });
    return { archived: true };
  }
  await db.product.delete({ where: { id } });
  await removeOrphanImages(product.images.map((i) => i.url));
  await recordAudit({
    action: "PRODUCT_DELETE",
    entity: "product",
    entityId: id,
    userId: userId ?? null,
    detail: `${product.name} (eliminado)`,
  });
  return { archived: false };
}
