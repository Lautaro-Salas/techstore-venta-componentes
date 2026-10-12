import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PageTransition } from "@/components/navigation/page-transition";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { VerifyEmailBanner } from "@/features/account/resend-verification";
import { ChangePasswordForm } from "@/features/auth/password-forms";
import { requireUserPage } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format";
import { getProfile } from "@/services/account/account.service";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const user = await requireUserPage("/cuenta/configuracion");
  const profile = await getProfile(user.id);
  return (
    <PageTransition>
      <div className="flex max-w-2xl flex-col gap-5">
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <Card>
          <CardHeader
            title="Email"
            description={`Cuenta creada el ${formatDate(profile.createdAt)}`}
          />
          <CardBody>
            {profile.emailVerifiedAt ? (
              <p className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="text-success size-4" aria-hidden /> {profile.email}{" "}
                verificado
              </p>
            ) : (
              <VerifyEmailBanner email={profile.email} />
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Contraseña" />
          <CardBody>
            <ChangePasswordForm />
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Apariencia"
            description="Elegí entre modo claro, oscuro o el de tu sistema."
            action={<ThemeToggle />}
          />
        </Card>
      </div>
    </PageTransition>
  );
}
