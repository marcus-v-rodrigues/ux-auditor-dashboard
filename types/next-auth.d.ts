/**
 * Definições de Tipos TypeScript do NextAuth
 *
 * Este arquivo estende os tipos padrão do NextAuth para incluir
 * propriedades personalizadas para a integração OAuth2 do Janus IDP.
 */

import "next-auth";

/**
 * Interface Session Estendida
 *
 * Adiciona propriedades personalizadas ao objeto Session do NextAuth:
 * - accessToken: Token de acesso JWT para chamadas de API
 * - refreshToken: Token de refresh JWT para renovação de token
 * - error: Mensagem de erro se o refresh de token falhar
 */
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }
}

/**
 * Interface JWT Estendida
 *
 * Adiciona propriedades personalizadas ao objeto JWT do NextAuth:
 * - accessToken: Token de acesso JWT para chamadas de API
 * - refreshToken: Token de refresh JWT para renovação de token
 * - expiresAt: Timestamp de expiração do token
 * - error: Mensagem de erro se o refresh de token falhar
 */
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
  }
}
