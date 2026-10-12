import type { Metadata } from "next";
import Link from "next/link";
import { PageTransition } from "@/components/navigation/page-transition";
import { AuthCard, FormMessage } from "@/features/auth/auth-card";
import { ResetPasswordForm } from "@/features/auth/password-forms";

export const metadata: Metadata = { title: "Nueva contraseña", robots: { index: false } };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <PageTransition>
      <AuthCard
        title="Elegí una nueva contraseña"
        footer={
          <Link href="/recuperar" className="text-primary font-medium hover:underline">
            Pedir un link nuevo
          </Link>
        }
      >
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <FormMessage tone="error">El link es inválido. Solicitá uno nuevo.</FormMessage>
        )}
      </AuthCard>
    </PageTransition>
  );
}
