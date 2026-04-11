import { auth } from "@/auth";
import {
  hasJanusRoles,
  resolveUxAuditorAccess,
} from "@/lib/janus-auth";
import type { Session } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/auth/signin",
  "/auth/error",
  "/auth/register",
];

const PUBLIC_PREFIXES = ["/api/auth"];

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

function redirectToSignIn(req: NextRequest): Response {
  const signInUrl = new URL("/auth/signin", req.url);
  signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
  return Response.redirect(signInUrl);
}

function unauthorizedJson(
  message: string,
  status: number,
  code?: string
): Response {
  return NextResponse.json({ error: message, code }, { status });
}

function redirectToDeniedReason(
  req: NextRequest,
  reason: "missing_roles" | "missing_client_access"
): Response {
  const errorUrl = new URL("/auth/error", req.url);
  errorUrl.searchParams.set(
    "error",
    reason === "missing_roles" ? "AccessDeniedNoRoles" : "AccessDeniedClient"
  );
  return Response.redirect(errorUrl);
}

export default auth((req: NextRequest & { auth: Session | null }) => {
  const { pathname } = req.nextUrl;

  if (pathname === "/auth/signin" && req.auth) {
    return Response.redirect(new URL("/", req.url));
  }

  if (pathname === "/auth/error" || pathname === "/auth/register") {
    return;
  }

  if (pathname.startsWith("/api/auth")) {
    return;
  }

  if (isPublicPath(pathname)) {
    return;
  }

  if (!req.auth) {
    return isApiPath(pathname)
      ? unauthorizedJson("Autenticação necessária", 401, "AUTH_REQUIRED")
      : redirectToSignIn(req);
  }

  const roles = req.auth.roles ?? req.auth.user?.roles;
  const access = resolveUxAuditorAccess(roles);
  const authenticated = Boolean(req.auth);
  const hasRoles = hasJanusRoles(roles);

  console.log("[Proxy RBAC]", {
    pathname,
    authenticated,
    hasRoles,
    globalRoles: roles?.global ?? [],
    clientRoles: roles?.client ?? [],
    hasClientAccess: access.hasClientAccess,
    adminAccess: access.adminAccess,
    allowed: access.allowed,
    reason: access.reason,
  });

  if (!access.allowed) {
    const denyReason =
      access.reason === "missing_roles"
        ? "missing_roles"
        : "missing_client_access";

    return isApiPath(pathname)
      ? unauthorizedJson(
          access.reason === "missing_roles"
            ? "Sessão autenticada sem roles válidas"
            : "Acesso negado ao client ux-auditor",
          403,
          access.reason === "missing_roles"
            ? "AUTHENTICATED_WITHOUT_ROLES"
            : "CLIENT_ACCESS_DENIED"
        )
      : redirectToDeniedReason(req, denyReason);
  }

  return;
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
    "/api/:path*",
  ],
};
