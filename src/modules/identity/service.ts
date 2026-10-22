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
  actorIsAdmin,
  type Actor,
} from "@/modules/identity/policy";
import { isRoleKey, type RoleKey } from "@/modules/identity/roles";
import type {
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from "@/modules/identity/schema";
import { logger } from "@/platform/logging/logger";
import {
  isLoginLocked,
  LOGIN_LOCK_WINDOW_MS,
} from "@/modules/identity/login-guard";
import { assertDemoLoginAllowed } from "@/modules/identity/demo-gate";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  issueTotpChallenge,
  totpUri,
  verifyTotpChallenge,
  verifyTotpCode,
} from "@/modules/identity/totp";

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
  assertDemoLoginAllowed(email);
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

export async function updateProfile(
  actor: Actor,
  input: UpdateProfileInput,
  correlationId: string,
) {
  const displayName = input.displayName.trim();
  const updated = await prisma.user.update({
    where: { id: actor.userId },
    data: { displayName },
    select: { id: true, email: true, displayName: true },
  });
  await prisma.auditLog.create({
    data: {
      actorId: actor.userId,
      action: "user.profile_updated",
      targetType: "user",
      targetId: actor.userId,
      afterState: { displayName },
      reason: "Customer updated profile",
      correlationId,
    },
  });
  return updated;
}

export type LoginResult =
  | {
      kind: "session";
      token: string;
      sessionId: string;
      userId: string;
      expiresAt: Date;
    }
  | {
      kind: "totp_required";
      challengeToken: string;
      userId: string;
    };

export async function loginUser(
  input: LoginInput,
  meta: { ipAddress?: string; userAgent?: string; correlationId: string },
): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();
  assertDemoLoginAllowed(email);
  const since = new Date(Date.now() - LOGIN_LOCK_WINDOW_MS);
  const recentFailures = await prisma.loginAttempt.count({
    where: { email, success: false, createdAt: { gte: since } },
  });
  if (isLoginLocked(recentFailures)) {
    await prisma.loginAttempt.create({
      data: {
        email,
        success: false,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        reason: "rate_limited",
      },
    });
    throw new RateLimitError(
      "Too many sign-in attempts. Try again in 15 minutes.",
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: { include: { role: true } } },
  });
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

  const actorRoles = user.roles.map((row) => ({
    key: row.role.key,
    sellerId: row.sellerId,
  }));
  const isAdmin = actorRoles.some((role) => role.key === "admin");

  if (isAdmin && user.totpEnabledAt && user.totpSecretEnc) {
    logger.info("auth.login_totp_required", {
      requestId: meta.correlationId,
      userId: user.id,
    });
    return {
      kind: "totp_required",
      challengeToken: issueTotpChallenge(user.id),
      userId: user.id,
    };
  }

  logger.info("auth.login", {
    requestId: meta.correlationId,
    userId: user.id,
  });
  const session = await createSessionForUser(user.id, meta);
  return { kind: "session", ...session };
}

export async function completeTotpLogin(
  challengeToken: string,
  code: string,
  meta: { ipAddress?: string; userAgent?: string; correlationId: string },
) {
  const userId = verifyTotpChallenge(challengeToken);
  if (!userId) {
    throw new AuthenticationError("Sign-in challenge expired. Try again.");
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.totpSecretEnc || !user.totpEnabledAt) {
    throw new AuthenticationError("Authenticator is not enabled for this account");
  }
  const secret = decryptTotpSecret(user.totpSecretEnc);
  if (!verifyTotpCode(secret, code)) {
    await prisma.loginAttempt.create({
      data: {
        email: user.email,
        success: false,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        reason: "invalid_totp",
      },
    });
    throw new AuthenticationError("Invalid authenticator code");
  }
  await prisma.loginAttempt.create({
    data: {
      email: user.email,
      success: true,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      reason: "totp_ok",
    },
  });
  logger.info("auth.login_totp", {
    requestId: meta.correlationId,
    userId: user.id,
  });
  return createSessionForUser(user.id, meta);
}

export async function beginAdminTotpEnrollment(actor: Actor) {
  if (!actorIsAdmin(actor)) {
    throw new AuthenticationError("Administrator role required");
  }
  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: actor.userId },
    data: {
      totpSecretEnc: encryptTotpSecret(secret),
      totpEnabledAt: null,
    },
  });
  return {
    secret,
    otpauthUrl: totpUri({ secret, email: actor.email }),
  };
}

export async function confirmAdminTotpEnrollment(actor: Actor, code: string) {
  if (!actorIsAdmin(actor)) {
    throw new AuthenticationError("Administrator role required");
  }
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: actor.userId },
  });
  if (!user.totpSecretEnc) {
    throw new AuthenticationError("Start authenticator setup first");
  }
  const secret = decryptTotpSecret(user.totpSecretEnc);
  if (!verifyTotpCode(secret, code)) {
    throw new AuthenticationError("Invalid authenticator code");
  }
  await prisma.user.update({
    where: { id: actor.userId },
    data: { totpEnabledAt: new Date() },
  });
  return { enabled: true as const };
}

export function adminTotpRequiredInProduction(actor: Actor): boolean {
  if (!actorIsAdmin(actor)) return false;
  // Admin 2FA is OFF by default while we build and test. To re-enable it
  // before real launch, set REQUIRE_ADMIN_TOTP=true in production.
  if (process.env.REQUIRE_ADMIN_TOTP !== "true") return false;
  return process.env.VERCEL_ENV === "production";
}

export async function adminHasTotpEnabled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpEnabledAt: true, totpSecretEnc: true },
  });
  return Boolean(user?.totpEnabledAt && user.totpSecretEnc);
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

export async function updateActorProfile(
  actor: Actor,
  input: UpdateProfileInput,
  correlationId: string,
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: actor.userId },
      data: { displayName: input.displayName },
      select: { id: true, displayName: true, email: true },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "profile.updated",
        targetType: "user",
        targetId: actor.userId,
        afterState: { displayName: updated.displayName },
        reason: "Customer updated profile display name",
        correlationId,
      },
    });
    return updated;
  });
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

export class RateLimitError extends Error {
  readonly code = "RATE_LIMITED";

  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export class ConflictError extends Error {
  readonly code = "CONFLICT";

  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export { assignRole };
