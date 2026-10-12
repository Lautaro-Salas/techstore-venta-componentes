/**
 * Seed de desarrollo. Idempotente: se puede correr varias veces.
 * Uso: npm run db:seed
 *
 * Todo lo que crea es DEMO y debe reemplazarse por datos reales.
 * No crea usuarios con contraseñas hardcodeadas: el admin inicial se toma de
 * SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (variables de entorno).
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSIONS, ROLE_PERMISSIONS, ROLES } from "../../src/lib/auth/permissions";
import { CATEGORY_KIND } from "../../src/services/compatibility/kinds";
import { BRANDS, CATEGORIES, PRODUCTS, SPEC_META, type SeedCategory } from "./catalog-data";

const db = new PrismaClient();
const DAY_MS = 86_400_000;
const BCRYPT_ROUNDS = 12;
const DEFAULT_WARRANTY_MONTHS = 12;
const DEFAULT_MIN_STOCK = 3;
const DEFAULT_WEIGHT_GRAMS = 800;

const slugify = (text: string) =>
  text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function seedRbac() {
  for (const [key, description] of Object.entries(PERMISSIONS)) {
    await db.permission.upsert({ where: { key }, create: { key, description }, update: { description } });
  }
  const permissions = await db.permission.findMany();
  for (const name of ROLES) {
    const role = await db.role.upsert({ where: { name }, create: { name }, update: {} });
    await db.rolePermission.deleteMany({ where: { roleId: role.id } });
    const keys = ROLE_PERMISSIONS[name] as string[];
    await db.rolePermission.createMany({
      data: permissions.filter((p) => keys.includes(p.key)).map((p) => ({ roleId: role.id, permissionId: p.id })),
    });
  }
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD vacíos: no se crea administrador.");
    return;
  }
  const role = await db.role.findUniqueOrThrow({ where: { name: "SUPER_ADMIN" } });
  await db.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      firstName: "Administrador",
      lastName: "Tienda",
      roleId: role.id,
      emailVerifiedAt: new Date(),
    },
    update: { roleId: role.id },
  });
}

async function seedCategories(nodes: SeedCategory[], parentId: string | null = null) {
  for (const [index, node] of nodes.entries()) {
    const data = { name: node.name, icon: node.icon, description: node.description, sortOrder: index, parentId };
    const category = await db.category.upsert({ where: { slug: node.slug }, create: { ...data, slug: node.slug }, update: data });
    if (node.children) await seedCategories(node.children, category.id);
  }
}

async function seedProducts(warehouseId: string) {
  const brands = new Map<string, string>();
  for (const name of BRANDS) {
    const brand = await db.brand.upsert({ where: { name }, create: { name, slug: slugify(name) }, update: {} });
    brands.set(name, brand.id);
  }
  const categories = new Map((await db.category.findMany()).map((c) => [c.slug, c.id]));

  for (const [index, p] of PRODUCTS.entries()) {
    const slug = slugify(p.name);
    const kind = CATEGORY_KIND[p.category] ?? "cable";
    const sku = `${p.category.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(4, "0")}`;
    const warranty = p.warranty ?? DEFAULT_WARRANTY_MONTHS;
    const data = {
      name: p.name,
      sku,
      shortDescription: p.short,
      description: `${p.short} ${p.name} de ${p.brand}, producto nuevo en caja sellada, con factura y ${warranty} meses de garantía oficial. Revisá la ficha técnica para confirmar la compatibilidad con tu equipo.`,
      price: p.price,
      compareAtPrice: p.compareAt ?? null,
      cost: Math.round(p.price * 0.72),
      status: "ACTIVE" as const,
      isFeatured: p.featured ?? false,
      tags: p.tags ?? [],
      warrantyMonths: warranty,
      weightGrams: p.weight ?? DEFAULT_WEIGHT_GRAMS,
      soldCount: p.sold ?? 0,
      availableStock: p.stock,
      brandId: brands.get(p.brand)!,
      categoryId: categories.get(p.category)!,
      createdAt: new Date(Date.now() - (p.ageDays ?? 120 + index) * DAY_MS),
    };
    const product = await db.product.upsert({ where: { slug }, create: { ...data, slug }, update: data });

    const productImages = [1, 2, 3]
      .map((n) => `/images/products/${slug}-${n}.webp`)
      .filter((url) => existsSync(path.join(process.cwd(), "public", url)));
    await db.productImage.deleteMany({ where: { productId: product.id } });
    if (productImages.length > 0) {
      await db.productImage.createMany({
        data: productImages.map((url, sortOrder) => ({ productId: product.id, url, alt: p.name, sortOrder })),
      });
    } else {
      await db.productImage.create({ data: { productId: product.id, url: `/images/products/${kind}.svg`, alt: p.name, sortOrder: 0 } });
    }

    await db.productSpecification.deleteMany({ where: { productId: product.id } });
    const specs = [["brand_name", p.brand], ...Object.entries(p.specs)] as const;
    await db.productSpecification.createMany({
      data: specs.map(([key, value], sortOrder) => {
        const meta = key === "brand_name" ? { label: "Marca", group: "General" } : SPEC_META[key] ?? { label: key, group: "General" };
        return { productId: product.id, key, value, label: meta.label, group: meta.group, filterable: "filterable" in meta ? Boolean(meta.filterable) : false, sortOrder };
      }),
    });

    await db.inventory.upsert({
      where: { productId_warehouseId: { productId: product.id, warehouseId } },
      create: { productId: product.id, warehouseId, quantity: p.stock, minStock: p.minStock ?? DEFAULT_MIN_STOCK },
      update: { quantity: p.stock, reserved: 0, minStock: p.minStock ?? DEFAULT_MIN_STOCK },
    });
  }
}

async function seedCommerceConfig() {
  const shipping = [
    { code: "standard", name: "Envío estándar a domicilio", description: "Entrega en 3 a 6 días hábiles.", type: "HOME_DELIVERY" as const, provider: "flat", price: 8990, freeThreshold: 500000, estimatedDaysMin: 3, estimatedDaysMax: 6, sortOrder: 0 },
    { code: "express", name: "Envío express", description: "Entrega en 24 a 48 h hábiles (AMBA).", type: "HOME_DELIVERY" as const, provider: "flat", price: 15990, freeThreshold: null, estimatedDaysMin: 1, estimatedDaysMax: 2, sortOrder: 1 },
    { code: "pickup", name: "Retiro en local", description: "Sin costo. Te avisamos cuando esté listo.", type: "PICKUP" as const, provider: "pickup", price: 0, freeThreshold: null, estimatedDaysMin: 1, estimatedDaysMax: 2, sortOrder: 2 },
  ];
  for (const s of shipping) await db.shippingMethod.upsert({ where: { code: s.code }, create: s, update: {} });

  const payments = [
    { code: "bank_transfer", name: "Transferencia bancaria", description: "10% de descuento. Acreditación en 24 h hábiles.", discountPercent: 10, sortOrder: 0 },
    { code: "mercadopago", name: "Mercado Pago (tarjetas y cuotas)", description: "Crédito, débito o dinero en cuenta.", discountPercent: 0, sortOrder: 1 },
    { code: "cash_pickup", name: "Efectivo al retirar", description: "Solo con retiro en local.", discountPercent: 0, sortOrder: 2 },
  ];
  for (const p of payments) await db.paymentMethod.upsert({ where: { code: p.code }, create: p, update: {} });

  const plans = [
    { installments: 1, interestRateBps: 0 },
    { installments: 3, interestRateBps: 0 },
    { installments: 6, interestRateBps: 0 },
    { installments: 12, interestRateBps: 2500 },
  ];
  for (const plan of plans) await db.installmentPlan.upsert({ where: { installments: plan.installments }, create: plan, update: {} });

  await db.coupon.upsert({
    where: { code: "BIENVENIDA10" },
    create: { code: "BIENVENIDA10", description: "DEMO: 10% en tu primera compra", type: "PERCENTAGE", value: 10, maxUsesPerUser: 1, minSubtotal: 100000 },
    update: {},
  });
  await db.coupon.upsert({
    where: { code: "SETUP20K" },
    create: { code: "SETUP20K", description: "DEMO: $20.000 off en compras desde $400.000", type: "FIXED", value: 20000, minSubtotal: 400000, maxUses: 100 },
    update: {},
  });

  const existingPromo = await db.promotion.findFirst({ where: { name: "Periféricos 5% OFF" } });
  if (!existingPromo) {
    const perifericos = await db.category.findMany({ where: { slug: { in: ["teclados", "mouse", "auriculares"] } } });
    await db.promotion.create({
      data: {
        name: "Periféricos 5% OFF",
        description: "DEMO: 5% en periféricos comprando desde $150.000",
        type: "PERCENTAGE",
        value: 5,
        minSubtotal: 150000,
        categories: { connect: perifericos.map((c) => ({ id: c.id })) },
      },
    });
  }

  await db.storeSetting.upsert({
    where: { key: "store" },
    create: {
      key: "store",
      value: {
        name: process.env.NEXT_PUBLIC_STORE_NAME || "TechStore",
        tagline: "Componentes, periféricos y monitores con garantía oficial",
        businessHours: "Lunes a viernes de 9 a 18 h · Sábados de 10 a 13 h",
        address: "",
      },
    },
    update: {},
  });
}

async function main() {
  await seedRbac();
  const warehouse = await db.warehouse.upsert({
    where: { code: "CENTRAL" },
    create: { code: "CENTRAL", name: "Depósito central", isDefault: true },
    update: {},
  });
  await seedCategories(CATEGORIES);
  await seedProducts(warehouse.id);
  await seedCommerceConfig();
  await seedAdmin();
  console.warn(`Seed completo: ${PRODUCTS.length} productos demo.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
