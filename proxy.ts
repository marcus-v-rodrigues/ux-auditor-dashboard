import { auth } from "@/auth";
import {
  hasUxAuditorAppAccess,
  isJanusAdmin,
  canUseUxAuditor,
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

function redirectToAccessDenied(req: NextRequest): Response {
  const errorUrl = new URL("/auth/error", req.url);
  errorUrl.searchParams.set("error", "AccessDenied");
  return Response.redirect(errorUrl);
}

function unauthorizedJson(message: string, status: number): Response {
  return NextResponse.json({ error: message }, { status });
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
      ? unauthorizedJson("Autenticação necessária", 401)
      : redirectToSignIn(req);
  }

  const roles = req.auth.user?.roles;
  const hasAppAccess = hasUxAuditorAppAccess(roles);
  const hasClientAccess = canUseUxAuditor(roles);
  const adminAccess = isJanusAdmin(roles);

  if (!hasAppAccess) {
    return isApiPath(pathname)
      ? unauthorizedJson(
          "Acesso negado ao client ux-auditor",
          403
        )
      : redirectToAccessDenied(req);
  }

  if (!pathname.startsWith("/api/") && !hasClientAccess && !adminAccess) {
    return redirectToAccessDenied(req);
  }

  return;
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
    "/api/:path*",
  ],
};
