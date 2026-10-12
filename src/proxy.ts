import { NextResponse, type NextRequest } from "next/server";

/**
 * Filtro rápido previo al render: si no hay cookie de sesión, las rutas privadas
 * redirigen al login. La validación real de sesión y permisos ocurre en el servidor
 * (layouts, páginas y server actions); esto solo evita renders innecesarios.
 */
const SESSION_COOKIE = "ts_session";
const PRIVATE_PREFIXES = ["/admin", "/cuenta", "/favoritos"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPrivate = PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isPrivate && !request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/ingresar";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/cuenta/:path*", "/favoritos"],
};
