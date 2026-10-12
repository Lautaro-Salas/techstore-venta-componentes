"use client";

/** Último recurso: renderiza su propio documento (sin estilos globales). */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="es-AR">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, background: "#f7f8fa", color: "#0f172a" }}>
        <title>Error</title>
        <main style={{ textAlign: "center", padding: 24, maxWidth: 420 }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Algo salió mal</h1>
          <p style={{ color: "#5b6577", marginBottom: 20 }}>Tuvimos un problema inesperado. Probá de nuevo en unos segundos.</p>
          <button type="button" onClick={retry} style={{ background: "#2563eb", color: "#fff", border: 0, borderRadius: 12, padding: "12px 20px", fontWeight: 600, cursor: "pointer" }}>
            Reintentar
          </button>
          {error.digest && <p style={{ marginTop: 16, fontSize: 12, color: "#5b6577" }}>Código: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
