"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { newsletterAction } from "@/features/engagement/actions";
import { INITIAL_FORM_STATE } from "@/types/actions";

export function NewsletterForm() {
  const [state, action, pending] = useActionState(newsletterAction, INITIAL_FORM_STATE);
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok === true) {
      toast.success("¡Listo! Te suscribiste", "Vas a recibir ofertas y novedades.");
      formRef.current?.reset();
    } else if (state.ok === false) {
      toast.error("No pudimos suscribirte", state.fieldErrors?.email ?? state.error);
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={action} className="flex w-full max-w-md gap-2">
      <label htmlFor="newsletter-email" className="sr-only">
        Tu email
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="tu@email.com"
        className="border-border bg-surface focus:border-primary focus:ring-ring/40 h-11 min-w-0 flex-1 rounded-xl border px-3.5 text-sm transition-all focus:ring-2 focus:outline-none"
      />
      <Button type="submit" loading={pending}>
        Suscribirme
      </Button>
    </form>
  );
}
