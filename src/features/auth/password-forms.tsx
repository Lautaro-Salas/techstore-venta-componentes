"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { useFormAction } from "@/hooks/use-form-action";
import { PASSWORD_MIN_LENGTH } from "@/schemas/auth";
import { changePasswordAction, forgotPasswordAction, resetPasswordAction } from "./actions";
import { FormMessage } from "./auth-card";
import { PasswordInput } from "./password-input";

const PASSWORD_HINT = `Mínimo ${PASSWORD_MIN_LENGTH} caracteres, con letras y números.`;

export function ForgotPasswordForm() {
  const { state, pending, onSubmit, errors } = useFormAction(forgotPasswordAction);
  if (state.ok === true) {
    return <FormMessage tone="success">Si existe una cuenta con ese email, te enviamos un link para restablecer la contraseña. Revisá también la carpeta de spam.</FormMessage>;
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {state.ok === false && !state.fieldErrors && <FormMessage tone="error">{state.error}</FormMessage>}
      <Input name="email" type="email" label="Email" autoComplete="email" required error={errors.email} />
      <Button type="submit" size="lg" fullWidth loading={pending}>Enviar link</Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const { state, pending, onSubmit, errors } = useFormAction(resetPasswordAction);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="token" value={token} />
      {state.ok === false && !errors.password && !errors.confirmPassword && <FormMessage tone="error">{state.error}</FormMessage>}
      <PasswordInput name="password" label="Nueva contraseña" autoComplete="new-password" required error={errors.password} hint={PASSWORD_HINT} />
      <PasswordInput name="confirmPassword" label="Repetí la contraseña" autoComplete="new-password" required error={errors.confirmPassword} />
      <Button type="submit" size="lg" fullWidth loading={pending}>Guardar contraseña</Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const { state, pending, onSubmit, errors } = useFormAction(changePasswordAction);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate key={state.ok === true ? "done" : "form"}>
      {state.ok === true && <FormMessage tone="success">Contraseña actualizada.</FormMessage>}
      {state.ok === false && !state.fieldErrors && <FormMessage tone="error">{state.error}</FormMessage>}
      <PasswordInput name="currentPassword" label="Contraseña actual" autoComplete="current-password" required error={errors.currentPassword} />
      <PasswordInput name="password" label="Nueva contraseña" autoComplete="new-password" required error={errors.password} hint={PASSWORD_HINT} />
      <PasswordInput name="confirmPassword" label="Repetí la nueva contraseña" autoComplete="new-password" required error={errors.confirmPassword} />
      <Button type="submit" loading={pending} className="self-start">Cambiar contraseña</Button>
    </form>
  );
}
