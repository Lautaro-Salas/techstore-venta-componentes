import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "./crypto";
import type { SessionUser } from "@/types/auth";

export const SESSION_COOKIE = "ts_session";
const SESSION_DAYS = 30;
const DAY_MS = 86_400_000;
const SESSION_TTL_MS = SESSION_DAYS * DAY_MS;
/** Renueva la sesión cuando le queda menos de la mitad de vida. */
const RENEW_THRESHOLD_MS = SESSION_TTL_MS / 2;

async function clientInfo(): Promise<{ ip?: string; userAgent?: string }> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? undefined;
  return { ip, userAgent: h.get("user-agent")?.slice(0, 255) ?? undefined };
}

export async function getClientIp(): Promise<string> {
  return (await clientInfo()).ip ?? "unknown";
}

export async function createSession(userId: string): Promise<void> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const info = await clientInfo();
  await db.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt, ...info } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}

/** Revoca todas las sesiones del usuario excepto la de la request actual. */
export async function destroyOtherSessions(userId: string): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  await db.session.deleteMany({
    where: { userId, ...(token ? { tokenHash: { not: hashToken(token) } } : {}) },
  });
}

/** Usuario autenticado de la request actual (memoizado por request). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
    },
  });
  if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;

  if (session.expiresAt.getTime() - Date.now() < RENEW_THRESHOLD_MS) {
    await db.session.update({
      where: { id: session.id },
      data: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
    });
  }

  const { user } = session;
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role.name,
    permissions: user.role.permissions.map((rp) => rp.permission.key),
    emailVerified: user.emailVerifiedAt !== null,
  };
});
