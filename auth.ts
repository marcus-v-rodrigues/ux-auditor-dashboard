import NextAuth, { type NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import {
  buildSessionUserFromToken,
  decodeJwtPayload,
  extractJanusRoles,
  extractScopes,
  type JanusClaims,
} from "@/lib/janus-auth";

function resolveDisplayName(
  name?: string | null,
  preferredUsername?: string | null,
  givenName?: string | null,
  familyName?: string | null
): string | null {
  if (name) {
    return name;
  }

  if (preferredUsername) {
    return preferredUsername;
  }

  const composedName = [givenName, familyName].filter(Boolean).join(" ");
  return composedName.length > 0 ? composedName : null;
}

function parseExpiresAt(expiresAt?: number): number | undefined {
  if (!expiresAt || Number.isNaN(expiresAt)) {
    return undefined;
  }

  return expiresAt * 1000;
}

function isValidAudience(aud: JanusClaims["aud"], expected: string): boolean {
  if (Array.isArray(aud)) {
    return aud.includes(expected);
  }

  return aud === expected;
}

function mergeTokenClaims(token: JWT, accessToken?: string): JWT {
  const claims = accessToken ? decodeJwtPayload(accessToken) : {};
  const roles = extractJanusRoles(claims);
  const scopes = extractScopes(claims.scope);
  const resolvedSub = claims.sub ?? token.sub;

  return {
    ...token,
    accessToken: accessToken ?? token.accessToken,
    claims,
    roles,
    scopes,
    sub: resolvedSub,
    name: resolveDisplayName(
      token.name,
      claims.preferred_username ?? claims.name,
      claims.given_name,
      claims.family_name
    ),
    email: token.email ?? claims.email ?? null,
    picture: token.picture ?? claims.picture ?? null,
  };
}

async function refreshJanusToken(token: JWT): Promise<JWT> {
  const issuerUrl = process.env.AUTH_ISSUER_URL;
  const internalUrl = process.env.AUTH_JANUS_INTERNAL_URL || issuerUrl;

  if (!internalUrl) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }

  const response = await fetch(`${internalUrl}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refreshToken as string,
      client_id: process.env.AUTH_CLIENT_ID!,
      client_secret: process.env.AUTH_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
      expiresAt: token.expiresAt ?? Date.now(),
    };
  }

  const tokens = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const refreshedToken = mergeTokenClaims(token, tokens.access_token);

  return {
    ...refreshedToken,
    accessToken: tokens.access_token ?? token.accessToken,
    refreshToken: tokens.refresh_token ?? token.refreshToken,
    expiresAt: tokens.expires_in
      ? Date.now() + tokens.expires_in * 1000
      : token.expiresAt,
    error: undefined,
  };
}

function JanusProvider(clientId: string, clientSecret: string): NextAuthConfig["providers"][number] {
  const issuerUrl = process.env.AUTH_ISSUER_URL;
  const internalUrl = process.env.AUTH_JANUS_INTERNAL_URL || issuerUrl;

  if (!issuerUrl || !internalUrl) {
    throw new Error("AUTH_ISSUER_URL and AUTH_JANUS_INTERNAL_URL must be configured");
  }

  return {
    id: "janus",
    name: "Janus IDP",
    type: "oauth",
    issuer: issuerUrl,
    clientId,
    clientSecret,
    checks: ["pkce", "state"],
    authorization: {
      url: `${issuerUrl}/auth`,
      params: {
        scope: process.env.AUTH_SCOPE || "openid profile email offline_access",
        resource: process.env.AUTH_AUDIENCE,
      },
    },
    token: `${internalUrl}/token`,
    userinfo: `${internalUrl}/userinfo`,
    jwks_endpoint: `${internalUrl}/jwks`,
    idToken: true,
    profile(profile: {
      sub?: string;
      id?: string;
      name?: string;
      email?: string;
      picture?: string;
    }) {
      return {
        id: profile.sub || profile.id || "",
        sub: profile.sub || profile.id || "",
        name: profile.name,
        email: profile.email,
        image: profile.picture || null,
        roles: {
          global: [],
          client: [],
        },
      };
    },
  } as NextAuthConfig["providers"][number];
}

const authOptions: NextAuthConfig = {
  basePath: "/api/auth",
  debug: process.env.NODE_ENV === "development",
  providers: [
    JanusProvider(
      process.env.AUTH_CLIENT_ID!,
      process.env.AUTH_CLIENT_SECRET!
    ),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        const accessToken = account.access_token as string | undefined;
        const claims = accessToken ? decodeJwtPayload(accessToken) : {};
        const roles = extractJanusRoles(claims);
        const scopes = extractScopes(claims.scope);
        const expectedAudience = process.env.AUTH_AUDIENCE;

        if (expectedAudience && !isValidAudience(claims.aud, expectedAudience)) {
          console.warn("[JWT Callback] Audience inválida", {
            expected: expectedAudience,
            received: claims.aud,
          });
        }

        const normalizedToken = mergeTokenClaims(
          {
            ...token,
            sub:
              (typeof user.id === "string" && user.id) ||
              claims.sub ||
              token.sub ||
              "",
            name: user.name ?? token.name ?? claims.name ?? null,
            email: user.email ?? token.email ?? claims.email ?? null,
            picture: (user as { image?: string | null }).image ?? token.picture ?? claims.picture ?? null,
            accessToken,
            refreshToken: account.refresh_token,
            expiresAt: parseExpiresAt(account.expires_at) ?? Date.now() + 60 * 60 * 1000,
          } as JWT,
          accessToken
        );

        return {
          ...normalizedToken,
          claims,
          roles: roles.global.length || roles.client.length ? roles : normalizedToken.roles,
          scopes,
          error: undefined,
        };
      }

      const now = Date.now();
      if (token.expiresAt && now < token.expiresAt - 30_000) {
        return token;
      }

      if (token.accessToken && !token.expiresAt) {
        return token;
      }

      if (token.refreshToken) {
        try {
          return await refreshJanusToken(token);
        } catch (error) {
          console.error("[JWT Callback] Falha ao renovar token", error);
          return {
            ...token,
            error: "RefreshAccessTokenError",
          };
        }
      }

      return {
        ...token,
        error: "RefreshAccessTokenError",
      };
    },
    async session({ session, token }) {
      const claims = (token.claims ?? {}) as JanusClaims;
      const roles = token.roles ?? extractJanusRoles(claims);
      const user = buildSessionUserFromToken({
        ...token,
        claims,
        roles,
      } as JWT);

      return {
        ...session,
        user,
        accessToken: token.accessToken,
        expiresAt: token.expiresAt,
        error: token.error,
        claims,
        scopes: token.scopes ?? extractScopes(claims.scope),
        roles,
      };
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  events: {
    async signIn({ user, account }) {
      console.log("[Event] SignIn:", {
        user: user?.email,
        provider: account?.provider,
        expiresAt: account?.expires_at,
      });
    },
    async createUser({ user }) {
      console.log("[Event] CreateUser:", { user: user?.email });
    },
    async updateUser({ user }) {
      console.log("[Event] UpdateUser:", { user: user?.email });
    },
    async linkAccount({ user, account }) {
      console.log("[Event] LinkAccount:", {
        user: user?.email,
        provider: account?.provider,
      });
    },
    async session({ session }) {
      console.log("[Event] Session:", {
        user: session?.user?.email,
        sub: session?.user?.sub,
        hasAccessToken: Boolean(session?.accessToken),
      });
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

export { handlers, auth, signIn, signOut };
