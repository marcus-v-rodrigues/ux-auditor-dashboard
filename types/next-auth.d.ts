/**
 * Definições de Tipos TypeScript do NextAuth
 *
 * Este arquivo estende os tipos padrão do NextAuth para incluir
 * propriedades personalizadas para a integração OAuth2 do Janus IDP.
 *
 * Com a mudança para JWTs no Janus IDP, os access_tokens agora contêm
 * claims que podem ser extraídos e usados na aplicação:
 *
 * Claims padrão do JWT:
 * - iss: Issuer (URL do IdP)
 * - sub: Subject (ID único do usuário)
 * - aud: Audience (Resource indicator)
 * - iat: Issued At (timestamp de criação)
 * - exp: Expiration (timestamp de expiração)
 * - scope: Escopos autorizados
 * - jti: JWT ID (identificador único do token)
 * - client_id: ID do cliente OAuth
 *
 * Claims personalizadas (opcionais):
 * - roles: Papéis do usuário (ex: ['admin', 'user'])
 * - email: Email do usuário
 */

import { DefaultSession } from "@auth/core/types";

/**
 * Claims extraídas do access_token JWT do Janus IDP
 *
 * Estas claims são extraídas do JWT após validação da assinatura
 * e estão disponíveis na sessão do usuário.
 */
export interface JwtClaims {
  /** Issuer - URL do IdP (ex: http://localhost:3000/oidc) */
  iss?: string;
  /** Subject - ID único do usuário */
  sub?: string;
  /** Audience - Resource indicator esperado */
  aud?: string;
  /** Issued At - timestamp de criação do token */
  iat?: number;
  /** Expiration - timestamp de expiração do token */
  exp?: number;
  /** Escopos autorizados (ex: 'openid profile email') */
  scope?: string;
  /** JWT ID - identificador único do token */
  jti?: string;
  /** ID do cliente OAuth que solicitou o token */
  client_id?: string;
  /** Papéis do usuário (claim personalizada) */
  roles?: string[];
  /** Email do usuário (claim personalizada) */
  email?: string;
}

/**
 * Interface Session Estendida
 *
 * Adiciona propriedades personalizadas ao objeto Session do NextAuth:
 * - accessToken: Token de acesso JWT para chamadas de API
 * - refreshToken: Token de refresh JWT para renovação de token
 * - error: Mensagem de erro se o refresh de token falhar
 * - claims: Claims extraídas do JWT para uso na aplicação
 * - scopes: Lista de escopos autorizados
 * - roles: Lista de papéis do usuário
 * - userSub: ID único do usuário (do claim 'sub')
 */
declare module "@auth/core/types" {
  interface Session extends DefaultSession {
    /** Token de acesso JWT para chamadas de API */
    accessToken?: string;
    /** Token de refresh para renovação do access_token */
    refreshToken?: string;
    /** Mensagem de erro se o refresh de token falhar */
    error?: string;
    /** Claims extraídas do JWT validado */
    claims?: JwtClaims;
    /** Lista de escopos autorizados (extraídos do claim 'scope') */
    scopes?: string[];
    /** Lista de papéis do usuário (claim personalizada 'roles') */
    roles?: string[];
    /** ID único do usuário (do claim 'sub') - renomeado para evitar conflito */
    userSub?: string;
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
 * - claims: Claims extraídas do access_token JWT
 * - scopes: Lista de escopos autorizados
 * - roles: Lista de papéis do usuário
 * - userSub: ID único do usuário
 */
declare module "next-auth/jwt" {
  interface JWT {
    /** Token de acesso JWT para chamadas de API */
    accessToken?: string;
    /** Token de refresh para renovação do access_token */
    refreshToken?: string;
    /** Timestamp de expiração do token (em milissegundos) */
    expiresAt?: number;
    /** Mensagem de erro se o refresh de token falhar */
    error?: string;
    /** Claims extraídas do JWT validado (tipo genérico para flexibilidade) */
    claims?: Record<string, unknown>;
    /** Lista de escopos autorizados */
    scopes?: string[];
    /** Lista de papéis do usuário */
    roles?: string[];
    /** ID único do usuário (do claim 'sub') - renomeado para evitar conflito */
    userSub?: string;
  }
}
