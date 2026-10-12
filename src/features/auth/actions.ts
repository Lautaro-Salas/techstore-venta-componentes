"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formDataToObject, parseOrThrow, runAction } from "@/lib/actions";
import { AppError } from "@/lib/errors";
import { checkRateLimit, type RateLimitName } from "@/lib/rate-limit";
import {
  createSession,
  destroyOtherSessions,
  destroySession,
  getClientIp,
  getCurrentUser,
} from "@/lib/auth/session";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/schemas/auth";
import * as auth from "@/services/auth/auth.service";
import { mergeGuestCart } from "@/services/cart/cart.service";
import type { FormState } from "@/types/actions";

/** Solo se permiten redirecciones internas para evitar open redirects. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/cuenta";
}

async function limit(name: RateLimitName, key = "") {
  const ip = await getClientIp();
  if (!checkRateLimit(name, `${ip}:${key}`)) {
    throw new AppError(
      "RATE_LIMITED",
      "Demasiados intentos. Esperá unos minutos y volvé a intentar.",
    );
  }
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await runAction(async () => {
    const input = parseOrThrow(loginSchema, formDataToObject(formData));
    await limit("login", input.email);
    // Tope por IP: la clave ip:email sólo limita intentos por cuenta, no por origen.
    await limit("loginIp");
    const user = await auth.authenticate(input);
    await createSession(user.id);
    await mergeGuestCart(user.id);
  });
  if (!result.ok) return result;
  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await runAction(async () => {
    await limit("register");
    const input = parseOrThrow(registerSchema, formDataToObject(formData));
    const user = await auth.registerUser(input);
    await createSession(user.id);
    await mergeGuestCart(user.id);
  });
  if (!result.ok) return result;
  revalidatePath("/", "layout");
  redirect(`${safeNext(formData.get("next"))}${formData.get("next") ? "" : "?bienvenida=1"}`);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function forgotPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runAction(async () => {
    const input = parseOrThrow(forgotPasswordSchema, formDataToObject(formData));
    await limit("passwordReset", input.email);
    await auth.requestPasswordReset(input.email);
  });
}

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await runAction(async () => {
    const input = parseOrThrow(resetPasswordSchema, formDataToObject(formData));
    await auth.resetPassword(input.token, input.password);
  });
  if (!result.ok) return result;
  redirect("/ingresar?restablecida=1");
}

export async function resendVerificationAction(): Promise<FormState> {
  return runAction(async () => {
    const user = await getCurrentUser();
    if (!user) throw new AppError("UNAUTHENTICATED", "Iniciá sesión para continuar.");
    await limit("passwordReset", `verify:${user.id}`);
    await auth.sendVerificationEmail(user.id);
  });
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runAction(async () => {
    const user = await getCurrentUser();
    if (!user) throw new AppError("UNAUTHENTICATED", "Iniciá sesión para continuar.");
    const input = parseOrThrow(changePasswordSchema, formDataToObject(formData));
    await auth.changePassword(user.id, input.currentPassword, input.password);
    // Cambiar la contraseña cierra las demás sesiones (si las hubiera).
    await destroyOtherSessions(user.id);
  });
}
