/** URL pública del sitio (canonical, Open Graph, sitemap). */
export function getEnvSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

/** Serializa JSON-LD de forma segura para incrustarlo en <script>. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
