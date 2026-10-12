import type { Metadata } from "next";
import { PageTransition } from "@/components/navigation/page-transition";
import { ButtonLink } from "@/components/ui/button";
import { AuthCard, FormMessage } from "@/features/auth/auth-card";
import { isAppError } from "@/lib/errors";
import { verifyEmail } from "@/services/auth/auth.service";

export const metadata: Metadata = { title: "Verificar email", robots: { index: false } };

async function verify(token: string | undefined): Promise<{ ok: boolean; message: string }> {
  if (!token) return { ok: false, message: "El link es inválido." };
  try {
    await verifyEmail(token);
    return { ok: true, message: "¡Listo! Tu email quedó verificado." };
  } catch (error) {
    return {
      ok: false,
      message: isAppError(error)
        ? error.message
        : "No pudimos verificar tu email. Intentá nuevamente.",
    };
  }
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = await verify(token);
  return (
    <PageTransition>
      <AuthCard title="Verificación de email">
        <div className="flex flex-col gap-4">
          <FormMessage tone={result.ok ? "success" : "error"}>{result.message}</FormMessage>
          <ButtonLink href={result.ok ? "/cuenta" : "/cuenta/configuracion"} fullWidth>
            {result.ok ? "Ir a mi cuenta" : "Reenviar verificación"}
          </ButtonLink>
        </div>
      </AuthCard>
    </PageTransition>
  );
}
