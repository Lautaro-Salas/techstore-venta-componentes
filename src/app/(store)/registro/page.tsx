import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageTransition } from "@/components/navigation/page-transition";
import { AuthCard } from "@/features/auth/auth-card";
import { RegisterForm } from "@/features/auth/register-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Crear cuenta", robots: { index: false } };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : undefined;
  if (await getCurrentUser()) redirect(next ?? "/cuenta");
  return (
    <PageTransition>
      <AuthCard
        title="Creá tu cuenta"
        subtitle="Es gratis y te lleva menos de un minuto."
        footer={
          <>
            ¿Ya tenés cuenta?{" "}
            <Link
              href={next ? `/ingresar?next=${encodeURIComponent(next)}` : "/ingresar"}
              className="text-primary font-medium hover:underline"
            >
              Ingresá
            </Link>
          </>
        }
      >
        <RegisterForm next={next} />
      </AuthCard>
    </PageTransition>
  );
}
