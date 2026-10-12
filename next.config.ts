import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Orígenes de terceros de analytics, condicionados a sus variables de entorno
// (los mismos IDs que gobiernan analytics-scripts.tsx:14-16).
const analyticsScriptSrc = [
  (process.env.NEXT_PUBLIC_GTM_ID || process.env.NEXT_PUBLIC_GA_ID) &&
    "https://www.googletagmanager.com",
  process.env.NEXT_PUBLIC_META_PIXEL_ID && "https://connect.facebook.net",
]
  .filter(Boolean)
  .join(" ");

const analyticsConnectSrc = [
  (process.env.NEXT_PUBLIC_GTM_ID || process.env.NEXT_PUBLIC_GA_ID) &&
    "https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://stats.g.doubleclick.net",
  process.env.NEXT_PUBLIC_META_PIXEL_ID && "https://www.facebook.com https://*.facebook.com",
]
  .filter(Boolean)
  .join(" ");

// CSP estática: 'unsafe-inline' en script-src hace falta por los scripts inline de
// Next (RSC flight) y de next-themes (providers.tsx no pasa nonce); para una CSP
// estricta con nonce hay que usar el Proxy de Next y render dinámico (ver docs de CSP).
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${analyticsScriptSrc}`.trimEnd(),
  "style-src 'self' 'unsafe-inline'",
  // Inter se auto-hospeda con next/font (layout.tsx) → sin CDN de fuentes.
  "font-src 'self'",
  // https: para logoUrl configurable desde admin (logo.tsx:10); data:/blob: para
  // placeholders y previews de subida.
  "img-src 'self' data: blob: https:",
  `connect-src 'self' ${analyticsConnectSrc}`.trimEnd(),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-src 'self'",
  "frame-ancestors 'none'",
  // Sin 'upgrade-insecure-requests': Chromium aplica el upgrade a los redirects
  // de fetch aunque sea localhost → pide https:// contra el servidor HTTP plano
  // (ERR_SSL_PROTOCOL_ERROR en consola al prefetchear rutas protegidas). Con TLS
  // real todo ya es https y el directive no aporta nada.
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Endurecer sólo en producción: no romper localhost por HTTP.
  ...(isProd ? [{ key: "Content-Security-Policy", value: contentSecurityPolicy }] : []),
];

// HSTS se sirve en una entrada aparte, condicionada al Host: en localhost
// Chromium acepta HSTS recibido por HTTP y reescribe peticiones a https://
// contra un servidor HTTP plano → ERR_SSL_PROTOCOL_ERROR en consola al seguir
// el redirect de rutas privadas. Con Host de dominio real el valor es idéntico
// al anterior (sin depender de x-forwarded-proto, que nginx no envía solo).
const nonLocalhostHost = "^(?!(?:localhost|127\\.0\\.0\\.1|\\[::1\\])(?::\\d+)?$).+";

const nextConfig: NextConfig = {
  // El proyecto vive en un disco FAT32 (sin soporte de enlaces): se usa webpack
  // y una carpeta de build propia. En NTFS/Linux se puede volver a ".next".
  distDir: process.env.NEXT_DIST_DIR || ".next-app",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      ...(isProd
        ? [
            {
              source: "/:path*",
              has: [{ type: "host" as const, value: nonLocalhostHost }],
              headers: [
                { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
              ],
            },
          ]
        : []),
    ];
  },
};

export default nextConfig;
