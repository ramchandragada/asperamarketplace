import { cookies } from "next/headers";
import { prisma } from "@/platform/db/prisma";
import {
  createSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from "@/modules/identity/crypto";
import {
  AuthenticationError,
  type Actor,
} from "@/modules/identity/policy";
import { isRoleKey, type RoleKey } from "@/modules/identity/roles";
import type { LoginInput, RegisterInput } from "@/modules/identity/schema";
import { logger } from "@/platform/logging/logger";

export const SESSION_COOKIE = "aspera_session";
const SESSION_DAYS = 14;

function sessionExpiry(from = new Date()): Date {
  return new Date(from.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

export async function ensureSystemRoles() {
  const { ROLE_DEFINITIONS } = await import("@/modules/identity/roles");
  for (const [key, definition] of Object.entries(ROLE_DEFINITIONS)) {
    await prisma.role.upsert({
      where: { key },
      create: {
        key,
        name: definition.name,
        description: definition.description,
      },
      update: {
        name: definition.name,
        description: definition.description,
      },
    });
  }
}

async function assignRole(
  userId: string,
  roleKey: RoleKey,
  sellerId?: string,
) {
  const role = await prisma.role.findUniqueOrThrow({ where: { key: roleKey } });
  const scopeKey = sellerId ?? "global";
  await prisma.userRole.upsert({
    where: {
      userId_roleId_scopeKey: {
        userId,
        roleId: role.id,
        scopeKey,
      },
    },
    create: {
      userId,
      roleId: role.id,
      scopeKey,
      sellerId: sellerId ?? null,
    },
    update: {},
  });
}

export async function registerUser(
  input: RegisterInput,
  meta: { ipAddress?: string; userAgent?: string; correlationId: string },
) {
  await ensureSystemRoles();
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const roleKey: RoleKey =
    input.intent === "seller" ? "seller_owner" : "customer";

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        passwordHash,
        displayName: input.displayName.trim(),
        emailVerifiedAt: new Date(),
      },
    });
    const role = await tx.role.findUniqueOrThrow({ where: { key: roleKey } });
    await tx.userRole.create({
      data: {
        userId: created.id,
        roleId: role.id,
        scopeKey: "global",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: created.id,
        action: "user.registered",
        targetType: "user",
        targetId: created.id,
        afterState: { email, intent: input.intent, role: roleKey },
        reason: "Self registration",
        correlationId: meta.correlationId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: "UserRegistered",
        aggregateType: "user",
        aggregateId: created.id,
        payload: { email, intent: input.intent, role: roleKey },
      },
    });
    return created;
  });

  return createSessionForUser(user.id, meta);
}

export async function loginUser(
  input: LoginInput,
  meta: { ipAddress?: string; userAgent?: string; correlationId: string },
) {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  const valid =
    user && user.status === "active"
      ? await verifyPassword(input.password, user.passwordHash)
      : false;

  await prisma.loginAttempt.create({
    data: {
      email,
      success: Boolean(valid),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      reason: valid ? null : "invalid_credentials",
    },
  });

  if (!user || !valid) {
    throw new AuthenticationError("Invalid email or password");
  }

  logger.info("auth.login", {
    requestId: meta.correlationId,
    userId: user.id,
  });
  return createSessionForUser(user.id, meta);
}

async function createSessionForUser(
  userId: string,
  meta: { ipAddress?: string; userAgent?: string; correlationId: string },
) {
  const token = createSessionToken();
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt: sessionExpiry(),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  });

  return {
    token,
    sessionId: session.id,
    userId,
    expiresAt: session.expiresAt,
  };
}

export async function logoutSession(token: string | undefined) {
  if (!token) {
    return;
  }
  const tokenHash = hashSessionToken(token);
  await prisma.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function resolveActorFromToken(
  token: string | undefined,
): Promise<Actor | null> {
  if (!token) {
    return null;
  }
  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          roles: {
            include: { role: true },
          },
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }
  if (session.user.status !== "active" || session.user.deletedAt) {
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  const roles = session.user.roles
    .map((entry) => {
      if (!isRoleKey(entry.role.key)) {
        return null;
      }
      return { key: entry.role.key, sellerId: entry.sellerId };
    })
    .filter((entry): entry is { key: RoleKey; sellerId: string | null } =>
      Boolean(entry),
    );

  return {
    userId: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    roles,
    sessionId: session.id,
  };
}

export async function requireActor(): Promise<Actor> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const actor = await resolveActorFromToken(token);
  if (!actor) {
    throw new AuthenticationError();
  }
  return actor;
}

export async function getOptionalActor(): Promise<Actor | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  return resolveActorFromToken(token);
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

export class ConflictError extends Error {
  readonly code = "CONFLICT";

  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export { assignRole };
