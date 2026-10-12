import { revalidatePath } from "next/cache";

/**
 * Revalidaciones relacionadas al catálogo de productos (admin + tienda).
 * Mantiene el comportamiento exacto de las implementaciones existentes.
 */
export function revalidateProductDomain(productId?: string): void {
  revalidatePath("/admin/productos");
  revalidatePath("/admin/inventario");
  if (productId) {
    revalidatePath(`/admin/productos/${productId}`);
  }
  // Vitrina: sólo las rutas que renderizan productos. El layout (store) no lee
  // productos, así que no hace falta purgar toda la caché con revalidatePath("/", "layout").
  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/ofertas");
  revalidatePath("/favoritos");
  revalidatePath("/comparar");
  revalidatePath("/producto/[slug]", "page");
  revalidatePath("/marcas/[slug]", "page");
  revalidatePath("/[...categoria]", "page");
}

/**
 * Revalidaciones relacionadas a categorías y marcas.
 * Mantiene el comportamiento exacto de las implementaciones existentes.
 */
export function revalidateCatalogDomain(): void {
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/marcas");
  revalidatePath("/admin/productos");
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/marcas");
  revalidatePath("/marcas/[slug]", "page");
  revalidatePath("/[...categoria]", "page");
  revalidatePath("/producto/[slug]", "page");
}

/**
 * Revalidaciones relacionadas a configuración de comercio (envíos, pagos, cuotas).
 * Mantiene el comportamiento exacto de las implementaciones existentes.
 */
export function revalidateCommerceConfig(): void {
  revalidatePath("/admin/configuracion");
  revalidatePath("/", "layout");
  revalidatePath("/carrito", "page");
  revalidatePath("/checkout", "page");
  revalidatePath("/producto/[slug]", "page");
}

/**
 * Revalidaciones relacionadas a descuentos (cupones y promociones).
 * Mantiene el comportamiento exacto de las implementaciones existentes.
 */
export function revalidateDiscounts(): void {
  revalidatePath("/admin/descuentos");
  // El carrito, el checkout y la página de ofertas aplican estos descuentos.
  revalidatePath("/carrito", "page");
  revalidatePath("/checkout", "page");
  revalidatePath("/ofertas", "page");
  revalidatePath("/producto/[slug]", "page");
}

/**
 * Revalidaciones relacionadas a inventario.
 * Mantiene el comportamiento exacto de las implementaciones existentes.
 */
export function revalidateInventory(): void {
  revalidatePath("/admin/inventario");
  revalidatePath("/admin/productos");
  revalidatePath("/admin");
  // Vitrina: el stock disponible se muestra en la portada, la ficha y el carrito.
  revalidatePath("/");
  revalidatePath("/producto/[slug]", "page");
  revalidatePath("/carrito", "page");
}

/**
 * Revalidaciones relacionadas a pedidos.
 * Mantiene el comportamiento exacto de las implementaciones existentes.
 */
export function revalidateOrders(orderId: string): void {
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin");
  // El cliente ve el estado en su cuenta y en la página de confirmación.
  revalidatePath("/cuenta/pedidos", "page");
  revalidatePath("/cuenta/pedidos/[id]", "page");
  revalidatePath("/checkout/confirmacion/[id]", "page");
}

/**
 * Revalidaciones del carrito.
 * Mantiene el comportamiento exacto de las implementaciones existentes.
 */
export function revalidateCart(): void {
  revalidatePath("/", "layout");
  revalidatePath("/carrito", "page");
}

export function refreshCart() {
  return revalidateCart();
}