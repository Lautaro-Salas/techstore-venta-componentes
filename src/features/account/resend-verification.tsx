"use client";

import { useState, useTransition } from "react";
import { MailWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendVerificationAction } from "@/features/auth/actions";

export function VerifyEmailBanner({ email }: { email: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const resend = () =>
    startTransition(async () => {
      const result = await resendVerificationAction();
      setMessage(result.ok ? `Te enviamos un nuevo link a ${email}.` : result.ok === false ? result.error : null);
    });
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-4 sm:flex-row sm:items-center">
      <MailWarning className="size-5 shrink-0 text-warning" aria-hidden />
      <p className="flex-1 text-sm">{message ?? <>Confirmá tu email <strong>{email}</strong> para recibir avisos de tus pedidos.</>}</p>
      <Button size="sm" variant="outline" onClick={resend} loading={pending}>Reenviar email</Button>
    </div>
  );
}
