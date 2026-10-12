"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { useFormAction } from "@/hooks/use-form-action";
import { loginAction } from "./actions";
import { FormMessage } from "./auth-card";
import { PasswordInput } from "./password-input";

export function LoginForm({ next }: { next?: string }) {
  const { state, pending, onSubmit, errors } = useFormAction(loginAction);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state.ok === false && !state.fieldErrors && <FormMessage tone="error">{state.error}</FormMessage>}
      <Input name="email" type="email" label="Email" autoComplete="email" required error={errors.email} />
      <PasswordInput name="password" label="Contraseña" autoComplete="current-password" required error={errors.password} />
      <Link href="/recuperar" className="-mt-2 self-end text-sm font-medium text-primary hover:underline">¿Olvidaste tu contraseña?</Link>
      <Button type="submit" size="lg" fullWidth loading={pending}>Ingresar</Button>
    </form>
  );
}
