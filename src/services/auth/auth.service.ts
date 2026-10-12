import "server-only";
import { after } from "next/server";
import type { AuthTokenType } from "@prisma/client";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { generateToken, hashPassword, hashToken, verifyPassword } from "@/lib/auth/crypto";
import { notify } from "@/services/notifications/notification.service";
import type { LoginInput, RegisterInput } from "@/schemas/auth";

const HOUR_MS = 3_600_000;
const TOKEN_TTL: Record<AuthTokenType, number> = {
  EMAIL_VERIFICATION: 24 * HOUR_MS,
  PASSWORD_RESET: HOUR_MS,
};
const DEFAULT_ROLE = "CUSTOMER";
/** Hash de referencia para igualar el tiempo de respuesta cuando el email no existe. */
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword(generateToken()));

async function issueToken(userId: string, type: AuthTokenType): Promise<string> {
  const token = generateToken();
  await db.authToken.deleteMany({ where: { userId, type, usedAt: null } });
  await db.authToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL[type]),
    },
  });
  return token;
}

async function consumeToken(token: string, type: AuthTokenType): Promise<string> {
  const record = await db.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.type !== type || record.usedAt || record.expiresAt < new Date()) {
    throw new AppError("VALIDATION", "El link es inválido o venció. Solicitá uno nuevo.");
  }
  await db.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record.userId;
}

function actionUrl(path: string, token: string): string {
  return `${getEnv().NEXT_PUBLIC_SITE_URL}${path}?token=${encodeURIComponent(token)}`;
}

export async function registerUser(input: RegisterInput): Promise<{ id: string }> {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError("CONFLICT", "Ya existe una cuenta con ese email.", {
      email: "Ya existe una cuenta con ese email",
    });
  }
  const role = await db.role.findUnique({ where: { name: DEFAULT_ROLE } });
  if (!role) throw new AppError("INTERNAL", "La configuración de roles no está inicializada.");

  const user = await db.user.create({
    data: {
      email: input.email,
      passwordHash: await hashPassword(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
      roleId: role.id,
    },
  });
  const token = await issueToken(user.id, "EMAIL_VERIFICATION");
  // El email se envía después de responder: no bloquea el registro.
  after(() =>
    notify({
      event: "user.registered",
      email: user.email,
      userId: user.id,
      data: { firstName: user.firstName, actionUrl: actionUrl("/verificar-email", token) },
    }),
  );
  return { id: user.id };
}

export async function authenticate(input: LoginInput): Promise<{ id: string }> {
  const user = await db.user.findUnique({ where: { email: input.email } });
  const valid = await verifyPassword(input.password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !valid || !user.isActive) {
    throw new AppError("UNAUTHENTICATED", "Email o contraseña incorrectos.");
  }
  return { id: user.id };
}

export async function sendVerificationEmail(userId: string): Promise<void> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.emailVerifiedAt) return;
  const token = await issueToken(user.id, "EMAIL_VERIFICATION");
  after(() =>
    notify({
      event: "auth.email_verification",
      email: user.email,
      userId: user.id,
      data: { firstName: user.firstName, actionUrl: actionUrl("/verificar-email", token) },
    }),
  );
}

/**
 * Verificación de email por link GET (idempotente): los clientes de correo y
 * los scanners hacen prefetch del link, y un refresh posterior no debe mostrar
 * "link inválido" si el email ya quedó verificado. El consumo del token es
 * atómico, así que de varios GETs concurrentes sólo uno aplica la verificación.
 */
export async function verifyEmail(token: string): Promise<void> {
  const record = await db.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.type !== "EMAIL_VERIFICATION") {
    throw new AppError("VALIDATION", "El link es inválido o venció. Solicitá uno nuevo.");
  }

  if (record.usedAt) {
    // Token ya consumido (refresh, segundo click o prefetch del cliente de email):
    // se responde éxito y se re-aplica la verificación si el primer GET quedó a medias.
    await db.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } });
    return;
  }

  if (record.expiresAt < new Date()) {
    throw new AppError("VALIDATION", "El link es inválido o venció. Solicitá uno nuevo.");
  }

  // Consumo atómico del token (sólo el primer GET lo gana) + verificación.
  await db.authToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  await db.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } });
}

/** Siempre responde igual para no revelar qué emails están registrados. */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return;
  const token = await issueToken(user.id, "PASSWORD_RESET");
  after(() =>
    notify({
      event: "auth.password_reset",
      email: user.email,
      userId: user.id,
      data: { firstName: user.firstName, actionUrl: actionUrl("/restablecer", token) },
    }),
  );
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const userId = await consumeToken(token, "PASSWORD_RESET");
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password) } }),
    db.session.deleteMany({ where: { userId } }),
  ]);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  password: string,
): Promise<void> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new AppError("VALIDATION", "La contraseña actual es incorrecta.", {
      currentPassword: "Contraseña incorrecta",
    });
  }
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(password) },
  });
}
