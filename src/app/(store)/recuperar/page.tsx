import type { Metadata } from "next";
import Link from "next/link";
import { PageTransition } from "@/components/navigation/page-transition";
import { AuthCard } from "@/features/auth/auth-card";
import { ForgotPasswordForm } from "@/features/auth/password-forms";

export const metadata: Metadata = { title: "Recuperar contraseña", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <PageTransition>
      <AuthCard
        title="Recuperá tu contraseña"
        subtitle="Ingresá tu email y te enviamos un link para crear una nueva."
        footer={
          <Link href="/ingresar" className="text-primary font-medium hover:underline">
            Volver a ingresar
          </Link>
        }
      >
        <ForgotPasswordForm />
      </AuthCard>
    </PageTransition>
  );
}
