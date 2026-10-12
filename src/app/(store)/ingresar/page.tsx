import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageTransition } from "@/components/navigation/page-transition";
import { AuthCard, FormMessage } from "@/features/auth/auth-card";
import { LoginForm } from "@/features/auth/login-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Ingresar", robots: { index: false } };

function safeNext(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.startsWith("/") && !v.startsWith("//") ? v : undefined;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect(next ?? "/cuenta");
  return (
    <PageTransition>
      <AuthCard
        title="Ingresá a tu cuenta"
        subtitle="Seguí tus pedidos, guardá favoritos y comprá más rápido."
        footer={
          <>
            ¿No tenés cuenta?{" "}
            <Link
              href={next ? `/registro?next=${encodeURIComponent(next)}` : "/registro"}
              className="text-primary font-medium hover:underline"
            >
              Registrate
            </Link>
          </>
        }
      >
        {sp.restablecida && (
          <div className="mb-4">
            <FormMessage tone="success">
              Tu contraseña fue actualizada. Ya podés ingresar.
            </FormMessage>
          </div>
        )}
        <LoginForm next={next} />
      </AuthCard>
    </PageTransition>
  );
}
