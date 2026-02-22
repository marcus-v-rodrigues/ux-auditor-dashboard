import { cookies } from "next/headers";
import type { Session } from "next-auth";

/**
 * Opções de Fetch Autenticado
 * Estende o RequestInit padrão com configuração opcional
 */
export interface AuthenticatedFetchOptions extends RequestInit {
  /**
   * URL base para a API (padrão: variável de ambiente UX_AUDITOR_API_URL)
   */
  baseUrl?: string;
  /**
   * Se deve lançar um erro em respostas não-2xx (padrão: true)
   */
  throwOnError?: boolean;
}

/**
 * Erro de Fetch Autenticado
 * Classe de erro personalizada para erros de API com contexto adicional
 */
export class AuthenticatedFetchError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message);
    this.name = "AuthenticatedFetchError";
  }
}

/**
 * Obtém a sessão atual do NextAuth
 * 
 * @returns A sessão atual ou null se não estiver autenticado
 */
async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("next-auth.session-token")?.value;
  
  if (!sessionToken) {
    return null;
  }
  
  // Busca sessão da API do NextAuth
  // Nota: NextAuth v5 usa AUTH_URL (não NEXTAUTH_URL)
  try {
    const response = await fetch(new URL("/api/auth/session", process.env.AUTH_URL || "http://localhost:3001"), {
      headers: {
        cookie: `next-auth.session-token=${sessionToken}`,
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const session = await response.json();
    return session as Session;
  } catch {
    return null;
  }
}

/**
 * Helper de Fetch Autenticado
 * 
 * Esta função helper faz requisições autenticadas para a API de backend
 * recuperando automaticamente a sessão e injetando o cabeçalho Authorization.
 * 
 * @param endpoint - O endpoint da API (ex: "/api/users", "/sessions/123")
 * @param options - Opções de fetch (method, body, headers, etc.)
 * 
 * @example
 * ```typescript
 * // Requisição GET
 * const data = await authenticatedFetch("/api/users");
 * 
 * // Requisição POST com corpo JSON
 * const result = await authenticatedFetch("/api/sessions", {
 *   method: "POST",
 *   body: JSON.stringify({ name: "Minha Sessão" }),
 * });
 * 
 * // URL base personalizada
 * const data = await authenticatedFetch("/external-api/data", {
 *   baseUrl: "https://api.example.com",
 * });
 * ```
 * 
 * @throws {AuthenticatedFetchError} Quando a requisição falha ou o usuário não está autenticado
 * @returns A resposta JSON analisada
 */
export async function authenticatedFetch<T = any>(
  endpoint: string,
  options: AuthenticatedFetchOptions = {}
): Promise<T> {
  const {
    baseUrl = process.env.UX_AUDITOR_API_URL || "http://localhost:8000",
    throwOnError = true,
    headers: customHeaders = {},
    ...restOptions
  } = options;

  // Obtém a sessão atual
  const session = await getSession();

  // Verifica se o usuário está autenticado
  if (!session || !session.accessToken) {
    throw new AuthenticatedFetchError(
      "Usuário não autenticado ou access_token ausente",
      401
    );
  }

  // Constrói a URL completa
  const url = `${baseUrl}${endpoint}`;

  // Prepara os cabeçalhos com Authorization
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.accessToken}`,
    ...customHeaders,
  };

  try {
    // Faz a requisição autenticada
    const response = await fetch(url, {
      ...restOptions,
      headers,
    });

    // Trata respostas não-2xx
    if (!response.ok) {
      let errorMessage = `Erro HTTP! status: ${response.status}`;
      
      try {
        // Tenta analisar mensagem de erro do corpo da resposta
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Se a análise falhar, usa mensagem de erro padrão
      }

      if (throwOnError) {
        throw new AuthenticatedFetchError(errorMessage, response.status, response);
      }
    }

    // Analisa e retorna a resposta
    const data = await response.json();
    return data as T;
  } catch (error) {
    // Relança AuthenticatedFetchError
    if (error instanceof AuthenticatedFetchError) {
      throw error;
    }

    // Trata erros de rede
    throw new AuthenticatedFetchError(
      `Erro de rede: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      0
    );
  }
}

/**
 * Requisição GET Autenticada
 * 
 * @param endpoint - O endpoint da API
 * @param options - Opções adicionais de fetch
 * @returns A resposta JSON analisada
 */
export async function authenticatedGet<T = any>(
  endpoint: string,
  options?: Omit<AuthenticatedFetchOptions, "method">
): Promise<T> {
  return authenticatedFetch<T>(endpoint, { ...options, method: "GET" });
}

/**
 * Requisição POST Autenticada
 * 
 * @param endpoint - O endpoint da API
 * @param body - O corpo da requisição (será convertido para JSON)
 * @param options - Opções adicionais de fetch
 * @returns A resposta JSON analisada
 */
export async function authenticatedPost<T = any>(
  endpoint: string,
  body: any,
  options?: Omit<AuthenticatedFetchOptions, "method" | "body">
): Promise<T> {
  return authenticatedFetch<T>(endpoint, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Requisição PUT Autenticada
 * 
 * @param endpoint - O endpoint da API
 * @param body - O corpo da requisição (será convertido para JSON)
 * @param options - Opções adicionais de fetch
 * @returns A resposta JSON analisada
 */
export async function authenticatedPut<T = any>(
  endpoint: string,
  body: any,
  options?: Omit<AuthenticatedFetchOptions, "method" | "body">
): Promise<T> {
  return authenticatedFetch<T>(endpoint, {
    ...options,
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * Requisição DELETE Autenticada
 * 
 * @param endpoint - O endpoint da API
 * @param options - Opções adicionais de fetch
 * @returns A resposta JSON analisada
 */
export async function authenticatedDelete<T = any>(
  endpoint: string,
  options?: Omit<AuthenticatedFetchOptions, "method">
): Promise<T> {
  return authenticatedFetch<T>(endpoint, { ...options, method: "DELETE" });
}

/**
 * Requisição PATCH Autenticada
 * 
 * @param endpoint - O endpoint da API
 * @param body - O corpo da requisição (será convertido para JSON)
 * @param options - Opções adicionais de fetch
 * @returns A resposta JSON analisada
 */
export async function authenticatedPatch<T = any>(
  endpoint: string,
  body: any,
  options?: Omit<AuthenticatedFetchOptions, "method" | "body">
): Promise<T> {
  return authenticatedFetch<T>(endpoint, {
    ...options,
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
