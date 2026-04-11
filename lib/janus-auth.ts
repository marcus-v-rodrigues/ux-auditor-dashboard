import type { JWT } from "next-auth/jwt";

export const JANUS_UX_AUDITOR_CLIENT_ID = "ux-auditor" as const;
export const JANUS_ADMIN_ROLE = "janus_admin" as const;

export type JanusClientRole = {
  code: string;
  clientId: string;
};

export type JanusRoles = {
  global: string[];
  client: JanusClientRole[];
};

export type JanusProfile = Record<string, unknown> & {
  sub?: string;
  id?: string;
  name?: string;
  email?: string;
  picture?: string;
  roles?: unknown;
  global_roles?: unknown;
  globalRoles?: unknown;
  client_roles?: unknown;
  clientRoles?: unknown;
  realm_access?: unknown;
  resource_access?: unknown;
};

export type JanusRoleSource = "profile" | "id_token" | "access_token" | "previous" | "empty";

export type JanusAccessDecision = {
  allowed: boolean;
  reason: "authenticated" | "missing_roles" | "missing_client_access";
  hasClientAccess: boolean;
  adminAccess: boolean;
};

export type JanusClaims = Record<string, unknown> & {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  iat?: number;
  exp?: number;
  scope?: string | string[];
  jti?: string;
  client_id?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  roles?: unknown;
  realm_access?: unknown;
  resource_access?: unknown;
};

export type JanusSessionUser = {
  id: string;
  sub: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles: JanusRoles;
};

type MaybeRecord = Record<string, unknown>;

function isRecord(value: unknown): value is MaybeRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    return value.split(/\s+/).map((item) => item.trim()).filter(Boolean);
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function pushUnique(values: string[], value: string): void {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function normalizeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  return base64 + "=".repeat((4 - (base64.length % 4)) % 4);
}

function decodeBase64Url(input: string): string {
  const normalized = normalizeBase64Url(input);

  if (typeof atob === "function") {
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(normalized, "base64").toString("utf-8");
  }

  throw new Error("Base64 decoder not available");
}

function normalizeClaims(input: unknown): JanusClaims {
  return isRecord(input) ? (input as JanusClaims) : {};
}

export function emptyJanusRoles(): JanusRoles {
  return {
    global: [],
    client: [],
  };
}

function normalizeClientRole(value: unknown): JanusClientRole | null {
  if (!isRecord(value)) {
    return null;
  }

  const code =
    toTrimmedString(value.code) ??
    toTrimmedString(value.role) ??
    toTrimmedString(value.name) ??
    toTrimmedString(value.id);
  const clientId =
    toTrimmedString(value.clientId) ??
    toTrimmedString(value.client_id) ??
    toTrimmedString(value.client) ??
    toTrimmedString(value.audience);

  if (!code || !clientId) {
    return null;
  }

  return { code, clientId };
}

function collectClientRoles(
  rawRoles: unknown,
  fallbackClientId?: string
): JanusClientRole[] {
  const collected: JanusClientRole[] = [];

  if (Array.isArray(rawRoles)) {
    for (const role of rawRoles) {
      if (typeof role === "string") {
        const code = toTrimmedString(role);
        if (code && fallbackClientId) {
          collected.push({ code, clientId: fallbackClientId });
        }
        continue;
      }

      const normalized = normalizeClientRole(role);
      if (normalized) {
        collected.push(normalized);
      }
    }
  } else if (isRecord(rawRoles)) {
    for (const [clientId, value] of Object.entries(rawRoles)) {
      if (Array.isArray(value)) {
        for (const role of value) {
          const code = toTrimmedString(role);
          if (code) {
            collected.push({ code, clientId });
          }
        }
        continue;
      }

      if (isRecord(value)) {
        const nestedRoles =
          value.roles ?? value.clientRoles ?? value.permissions ?? value.codes;
        for (const role of toStringArray(nestedRoles)) {
          collected.push({ code: role, clientId });
        }
      }
    }
  }

  return collected;
}

function collectGlobalRoles(rawRoles: unknown): string[] {
  const collected: string[] = [];

  for (const role of toStringArray(rawRoles)) {
    pushUnique(collected, role);
  }

  return collected;
}

export function normalizeJanusRoles(input: unknown): JanusRoles {
  const roles = extractJanusRoles(normalizeClaims(input));
  return hasJanusRoles(roles) ? roles : emptyJanusRoles();
}

export function hasJanusRoles(roles: JanusRoles | undefined | null): boolean {
  return Boolean(roles && (roles.global.length > 0 || roles.client.length > 0));
}

function cloneJanusRoles(roles: JanusRoles): JanusRoles {
  return {
    global: [...roles.global],
    client: roles.client.map((role) => ({ ...role })),
  };
}

export function resolveJanusRolesFromSources(options: {
  profileRoles?: unknown;
  idToken?: string;
  accessToken?: string;
  previousRoles?: JanusRoles | null;
}): { roles: JanusRoles; source: JanusRoleSource } {
  const profileRoles = normalizeJanusRoles(options.profileRoles);
  if (hasJanusRoles(profileRoles)) {
    return { roles: profileRoles, source: "profile" };
  }

  const idTokenRoles = options.idToken
    ? extractJanusRoles(decodeJwtPayload(options.idToken))
    : emptyJanusRoles();
  if (hasJanusRoles(idTokenRoles)) {
    return { roles: idTokenRoles, source: "id_token" };
  }

  const accessTokenRoles = options.accessToken
    ? extractJanusRoles(decodeJwtPayload(options.accessToken))
    : emptyJanusRoles();
  if (hasJanusRoles(accessTokenRoles)) {
    return { roles: accessTokenRoles, source: "access_token" };
  }

  if (hasJanusRoles(options.previousRoles ?? undefined)) {
    return {
      roles: cloneJanusRoles(options.previousRoles as JanusRoles),
      source: "previous",
    };
  }

  return { roles: emptyJanusRoles(), source: "empty" };
}

export function normalizeJanusProfile(profile: unknown): JanusProfile {
  const claims = normalizeClaims(profile);
  const roles = normalizeJanusRoles(claims.roles ?? claims);
  const sub =
    toTrimmedString(claims.sub) ??
    toTrimmedString(claims.id) ??
    "";

  return {
    ...claims,
    sub,
    id: sub,
    name: toTrimmedString(claims.name),
    email: toTrimmedString(claims.email),
    picture: toTrimmedString(claims.picture),
    roles,
  };
}

export function decodeJwtPayload(token: string): JanusClaims {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return {};
    }

    const payload = decodeBase64Url(parts[1]);
    return normalizeClaims(JSON.parse(payload));
  } catch {
    return {};
  }
}

export function extractScopes(scopeClaim: unknown): string[] {
  return toStringArray(scopeClaim);
}

export function extractJanusRoles(payload: JanusClaims): JanusRoles {
  const global: string[] = [];
  const client: JanusClientRole[] = [];

  const addGlobal = (value: unknown) => {
    const role = toTrimmedString(value);
    if (role) {
      pushUnique(global, role);
    }
  };

  const addClient = (role: unknown, clientId: unknown) => {
    const code = toTrimmedString(role);
    const resolvedClientId = toTrimmedString(clientId);

    if (!code || !resolvedClientId) {
      return;
    }

    if (!client.some((item) => item.code === code && item.clientId === resolvedClientId)) {
      client.push({ code, clientId: resolvedClientId });
    }
  };

  const directRoles = payload.roles;
  if (Array.isArray(directRoles)) {
    for (const role of directRoles) {
      if (typeof role === "string") {
        addGlobal(role);
        continue;
      }

      const normalized = normalizeClientRole(role);
      if (normalized) {
        addClient(normalized.code, normalized.clientId);
      }
    }
  } else if (isRecord(directRoles)) {
    const objectGlobal =
      directRoles.global ??
      directRoles.globalRoles ??
      directRoles.global_roles ??
      directRoles.global_role;
    const objectClient =
      directRoles.client ??
      directRoles.clientRoles ??
      directRoles.client_roles ??
      directRoles.client_role;

    for (const role of toStringArray(objectGlobal)) {
      addGlobal(role);
    }

    for (const role of collectClientRoles(objectClient)) {
      addClient(role.code, role.clientId);
    }
  }

  for (const role of collectGlobalRoles(payload.global_roles ?? payload.globalRoles)) {
    addGlobal(role);
  }

  for (const role of collectClientRoles(payload.client_roles ?? payload.clientRoles)) {
    addClient(role.code, role.clientId);
  }

  const realmAccess = payload.realm_access;
  if (isRecord(realmAccess)) {
    for (const role of toStringArray(realmAccess.roles)) {
      addGlobal(role);
    }
  }

  const resourceAccess = payload.resource_access;
  if (isRecord(resourceAccess)) {
    for (const [clientId, access] of Object.entries(resourceAccess)) {
      if (!isRecord(access)) {
        continue;
      }

      for (const role of toStringArray(access.roles)) {
        addClient(role, clientId);
      }
    }
  }

  return { global, client };
}

export function buildSessionUserFromToken(token: JWT): JanusSessionUser {
  const claims = normalizeClaims(token.claims);
  const sub =
    toTrimmedString(token.sub) ??
    toTrimmedString(claims.sub) ??
    toTrimmedString(claims.user_id) ??
    "";

  const preferredName = [
    toTrimmedString(claims.given_name),
    toTrimmedString(claims.family_name),
  ]
    .filter(Boolean)
    .join(" ");

  const name =
    token.name ??
    toTrimmedString(claims.name) ??
    toTrimmedString(claims.preferred_username) ??
    (preferredName.length > 0 ? preferredName : null);

  const email = token.email ?? toTrimmedString(claims.email) ?? null;
  const image = token.picture ?? toTrimmedString(claims.picture) ?? null;
  const roles = token.roles ?? extractJanusRoles(claims);

  return {
    id: sub,
    sub,
    name,
    email,
    image,
    roles,
  };
}

export function hasClientAccess(
  roles: JanusRoles | undefined,
  clientId: string = JANUS_UX_AUDITOR_CLIENT_ID
): boolean {
  if (!roles) {
    return false;
  }

  return roles.client.some((role) => role.clientId === clientId);
}

export function isJanusAdmin(roles: JanusRoles | undefined): boolean {
  return roles?.global.includes(JANUS_ADMIN_ROLE) ?? false;
}

export function canUseUxAuditor(roles: JanusRoles | undefined): boolean {
  return hasClientAccess(roles, JANUS_UX_AUDITOR_CLIENT_ID);
}

export function hasUxAuditorAppAccess(roles: JanusRoles | undefined): boolean {
  return canUseUxAuditor(roles) || isJanusAdmin(roles);
}

export function resolveUxAuditorAccess(
  roles: JanusRoles | undefined
): JanusAccessDecision {
  const adminAccess = isJanusAdmin(roles);
  const hasClientAccessValue = canUseUxAuditor(roles);

  if (!roles || !hasJanusRoles(roles)) {
    return {
      allowed: adminAccess,
      reason: "missing_roles",
      hasClientAccess: hasClientAccessValue,
      adminAccess,
    };
  }

  if (adminAccess || hasClientAccessValue) {
    return {
      allowed: true,
      reason: "authenticated",
      hasClientAccess: hasClientAccessValue,
      adminAccess,
    };
  }

  return {
    allowed: false,
    reason: "missing_client_access",
    hasClientAccess: hasClientAccessValue,
    adminAccess,
  };
}
