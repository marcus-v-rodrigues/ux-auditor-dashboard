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
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
    claims?: JanusClaims;
    scopes?: string[];
    roles?: JanusRoles;
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
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
    claims?: JanusClaims;
    scopes?: string[];
    roles?: JanusRoles;
    sub?: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
  }
}
