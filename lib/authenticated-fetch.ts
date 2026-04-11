import "server-only";

import { auth } from "@/auth";
import type { Session } from "next-auth";

export type AuthenticatedFetchErrorCode =
  | "UNAUTHENTICATED"
  | "SESSION_INVALID"
  | "TOKEN_EXPIRED"
  | "TOKEN_REJECTED"
  | "FORBIDDEN"
  | "BACKEND_ERROR"
  | "NETWORK_ERROR";

export interface AuthenticatedFetchOptions extends RequestInit {
  baseUrl?: string;
  throwOnError?: boolean;
}

export class AuthenticatedFetchError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: AuthenticatedFetchErrorCode,
    public response?: Response,
    public details?: string
  ) {
    super(message);
    this.name = "AuthenticatedFetchError";
  }
}

function getSessionToken(session: Session | null): string | undefined {
  return session?.accessToken;
}

function isTokenExpired(session: Session | null): boolean {
  if (!session?.expiresAt) {
    return false;
  }

  return Date.now() >= session.expiresAt;
}

async function getAuthenticatedSession(): Promise<Session> {
  const session = await auth();

  if (!session) {
    throw new AuthenticatedFetchError(
      "Autenticação necessária",
      401,
      "UNAUTHENTICATED"
    );
  }

  if (!session.user) {
    throw new AuthenticatedFetchError(
      "Sessão inválida",
      401,
      "SESSION_INVALID"
    );
  }

  if (session.error === "RefreshAccessTokenError") {
    throw new AuthenticatedFetchError(
      "Token expirado",
      401,
      "TOKEN_EXPIRED"
    );
  }

  const accessToken = getSessionToken(session);
  if (!accessToken) {
    throw new AuthenticatedFetchError(
      "Sessão inválida",
      401,
      "SESSION_INVALID"
    );
  }

  if (isTokenExpired(session)) {
    throw new AuthenticatedFetchError(
      "Token expirado",
      401,
      "TOKEN_EXPIRED"
    );
  }

  return session;
}

function resolveApiErrorMessage(status: number, fallback: string): {
  message: string;
  code: AuthenticatedFetchErrorCode;
} {
  if (status === 401) {
    return {
      message: "Token rejeitado pelo backend",
      code: "TOKEN_REJECTED",
    };
  }

  if (status === 403) {
    return {
      message: "Acesso negado pelo backend",
      code: "FORBIDDEN",
    };
  }

  return {
    message: fallback,
    code: "BACKEND_ERROR",
  };
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";

  if (response.status === 204) {
    return undefined;
  }

  if (contentType.includes("application/json")) {
    return response.json().catch(() => undefined);
  }

  return response.text().catch(() => undefined);
}

export async function authenticatedFetch<T = unknown>(
  endpoint: string,
  options: AuthenticatedFetchOptions = {}
): Promise<T> {
  const {
    baseUrl = process.env.UX_AUDITOR_API_URL || "http://localhost:8000",
    throwOnError = true,
    headers: customHeaders = {},
    ...restOptions
  } = options;

  const session = await getAuthenticatedSession();
  const accessToken = getSessionToken(session);

  if (!accessToken) {
    throw new AuthenticatedFetchError(
      "Sessão inválida",
      401,
      "SESSION_INVALID"
    );
  }

  const url = `${baseUrl}${endpoint}`;

  const headers = new Headers(customHeaders);
  if (!headers.has("Content-Type") && restOptions.body) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Authorization", `Bearer ${accessToken}`);

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers,
    });

    if (!response.ok) {
      const body = await readResponseBody(response);
      const bodyMessage =
        body && typeof body === "object" && "error" in body
          ? String((body as { error?: unknown }).error ?? "")
          : body && typeof body === "string"
            ? body
            : "";

      const fallback =
        bodyMessage || `Erro HTTP ao chamar ${endpoint}: ${response.status}`;
      const mapped = resolveApiErrorMessage(response.status, fallback);

      if (throwOnError) {
        throw new AuthenticatedFetchError(
          mapped.message,
          response.status,
          mapped.code,
          response,
          bodyMessage || undefined
        );
      }

      return body as T;
    }

    return (await readResponseBody(response)) as T;
  } catch (error) {
    if (error instanceof AuthenticatedFetchError) {
      throw error;
    }

    throw new AuthenticatedFetchError(
      `Erro de rede ao chamar ${endpoint}`,
      0,
      "NETWORK_ERROR",
      undefined,
      error instanceof Error ? error.message : "Erro desconhecido"
    );
  }
}

export async function authenticatedGet<T = unknown>(
  endpoint: string,
  options?: Omit<AuthenticatedFetchOptions, "method">
): Promise<T> {
  return authenticatedFetch<T>(endpoint, { ...options, method: "GET" });
}

export async function authenticatedPost<T = unknown>(
  endpoint: string,
  body: unknown,
  options?: Omit<AuthenticatedFetchOptions, "method" | "body">
): Promise<T> {
  return authenticatedFetch<T>(endpoint, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function authenticatedPut<T = unknown>(
  endpoint: string,
  body: unknown,
  options?: Omit<AuthenticatedFetchOptions, "method" | "body">
): Promise<T> {
  return authenticatedFetch<T>(endpoint, {
    ...options,
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function authenticatedDelete<T = unknown>(
  endpoint: string,
  options?: Omit<AuthenticatedFetchOptions, "method">
): Promise<T> {
  return authenticatedFetch<T>(endpoint, { ...options, method: "DELETE" });
}

export async function authenticatedPatch<T = unknown>(
  endpoint: string,
  body: unknown,
  options?: Omit<AuthenticatedFetchOptions, "method" | "body">
): Promise<T> {
  return authenticatedFetch<T>(endpoint, {
    ...options,
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
