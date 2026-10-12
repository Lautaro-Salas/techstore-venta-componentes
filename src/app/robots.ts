import type { MetadataRoute } from "next";
import { getEnvSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const site = getEnvSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/cuenta", "/checkout", "/carrito", "/favoritos", "/comparar", "/ingresar", "/registro", "/recuperar", "/restablecer", "/verificar-email"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
