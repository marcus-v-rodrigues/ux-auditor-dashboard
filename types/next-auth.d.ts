import { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import type {
  JanusClaims,
  JanusRoles,
  JanusSessionUser,
} from "@/lib/janus-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: JanusSessionUser;
    roles: JanusRoles;
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
    claims?: JanusClaims;
    scopes?: string[];
  }

  interface User extends DefaultUser {
    id: string;
    sub: string;
    roles: JanusRoles;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
    claims?: JanusClaims;
    scopes?: string[];
    roles?: JanusRoles;
    roleSource?: "profile" | "id_token" | "access_token" | "previous" | "empty";
    sub?: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
  }
}
