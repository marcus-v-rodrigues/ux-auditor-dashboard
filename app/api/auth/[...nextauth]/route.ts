import NextAuth, { NextAuthConfig } from "next-auth";
import crypto from "crypto";

/**
 * Provedor OIDC Personalizado para Janus IDP com PKCE
 *
 * Implementação do fluxo Authorization Code com PKCE (Proof Key for Code Exchange)
 * conforme RFC 7636 para segurança aprimorada em aplicações públicas.
 *
 * Configurações:
 * - client_id: ux-auditor
 * - client_secret: janus_dashboard_secret (ou UX_CLIENT_SECRET do .env)
 * - redirect_uri: http://localhost:3001/api/auth/callback/janus
 * - scopes: openid profile email offline_access
 *
 * Fluxo PKCE:
 * 1. Gerar code_verifier (random string 43-128 chars)
 * 2. Gerar code_challenge (SHA256 hash do code_verifier, base64url encoded)
 * 3. Redirecionar para /oidc/auth com code_challenge e code_challenge_method=S256
 * 4. No callback, enviar code_verifier para /oidc/token junto com o code
 * 5. Receber access_token e refresh_token
 *
 * NOTA IMPORTANTE sobre comunicação Docker:
 * O container do dashboard precisa se comunicar com o Janus IDP para descoberta OIDC
 * e troca de tokens. No ambiente Docker, usamos o nome do serviço (janus-service)
 * para comunicação interna, mas o issuer permanece como localhost para que o
 * navegador do usuário possa acessar os endpoints de autorização.
 *
 * O Janus IDP expõe os seguintes endpoints:
 * - authorization_endpoint: /oidc/auth (acessado pelo navegador do usuário)
 * - token_endpoint: /oidc/token (acessado pelo servidor)
 * - userinfo_endpoint: /oidc/me (acessado pelo servidor)
 * - jwks_uri: /oidc/jwks (acessado pelo servidor)
 *
 * Variáveis de ambiente:
 * - AUTH_ISSUER_URL: URL pública do issuer (ex: http://localhost:3000/oidc)
 * - AUTH_JANUS_INTERNAL_URL: URL interna para comunicação Docker (ex: http://janus-service:3000/oidc)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function JanusProvider(clientId: string, clientSecret: string): any {
  // URL pública do issuer - usada pelo navegador do usuário
  const issuerUrl = process.env.AUTH_ISSUER_URL;
  // URL interna para comunicação servidor-servidor no Docker
  // Se não definida, usa o issuerUrl (para desenvolvimento local sem Docker)
  const internalUrl = process.env.AUTH_JANUS_INTERNAL_URL || issuerUrl;

  return {
    id: "janus",
    name: "Janus IDP",
    type: "oauth",
    // Issuer público - usado para validação
    issuer: issuerUrl,
    clientId: clientId,
    clientSecret: clientSecret,
    // Habilita PKCE (Proof Key for Code Exchange)
    // O NextAuth.js v5 gera automaticamente code_verifier e code_challenge
    checks: ["pkce", "state"],
    // Endpoint de autorização - URL pública (acessada pelo navegador do usuário)
    authorization: {
      url: `${issuerUrl}/auth`,
      params: {
        // Escopos solicitados: openid (obrigatório), profile, email, offline_access (para refresh_token)
        scope: process.env.AUTH_SCOPE || "openid profile email offline_access",
        // Parâmetros PKCE são adicionados automaticamente pelo NextAuth.js
        // - code_challenge: derivado do code_verifier
        // - code_challenge_method: S256 (SHA256)
      },
    },
    // Endpoint de token - URL interna (acessada pelo servidor)
    token: `${internalUrl}/token`,
    // Endpoint de userinfo - URL interna (acessada pelo servidor)
    userinfo: `${internalUrl}/me`,
    // Callback para processar o perfil do usuário retornado pelo Janus
    profile(profile: { sub?: string; id?: string; name?: string; email?: string; picture?: string }) {
      return {
        id: profile.sub || profile.id,
        name: profile.name,
        email: profile.email,
        image: profile.picture || null,
      };
    },
  };
}

/**
 * Configuração do NextAuth com PKCE
 *
 * Esta configuração implementa:
 * - Provedor OAuth2 personalizado para Janus IDP
 * - PKCE (Proof Key for Code Exchange) para segurança aprimorada
 * - Parâmetro State para proteção contra CSRF
 * - Gerenciamento de tokens com access_token e refresh_token
 * - Callback de sessão para expor o access_token aos componentes do servidor
 *
 * Fluxo PKCE implementado:
 * 1. Geração automática de code_verifier (random string)
 * 2. Geração automática de code_challenge (SHA256 hash)
 * 3. Envio de code_challenge no endpoint de autorização
 * 4. Envio de code_verifier no endpoint de token
 * 5. Armazenamento de access_token e refresh_token
 *
 * NOTA: No NextAuth v5, use AUTH_URL (não NEXTAUTH_URL) para configurar a URL base.
 * Exemplo: AUTH_URL=http://localhost:3001
 */
const authOptions: NextAuthConfig = {
  // Configuração explícita da URL base para evitar problemas de redirecionamento
  // Em produção, defina AUTH_URL no ambiente. Em desenvolvimento, usamos o padrão.
  basePath: "/api/auth",
  providers: [
    JanusProvider(
      process.env.AUTH_CLIENT_ID!,
      process.env.AUTH_CLIENT_SECRET!
    ),
  ],
  callbacks: {
    /**
     * Callback JWT
     *
     * Gerencia o ciclo de vida do token JWT:
     * - Extrai access_token e refresh_token do Janus
     * - Trata expiração de tokens
     * - Persiste tokens no JWT
     */
    async jwt({ token, account, user }) {
      // Login inicial - extrai tokens da conta OAuth2
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 60 * 60 * 1000, // Default 1 hour
        };
      }

      // Retorna o token anterior se o access_token ainda não expirou
      if (Date.now() < Number(token.expiresAt || 0)) {
        return token;
      }

      // Access token expirou, tenta renová-lo usando refresh_token
      if (token.refreshToken) {
        try {
          const issuerUrl = process.env.AUTH_ISSUER_URL;
          const internalUrl = process.env.AUTH_JANUS_INTERNAL_URL || issuerUrl;
          
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
            throw new Error("Falha ao renovar token");
          }

          const tokens = await response.json();
          
          return {
            ...token,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || token.refreshToken,
            expiresAt: Date.now() + (tokens.expires_in * 1000),
          };
        } catch (error) {
          console.error("Erro ao renovar token:", error);
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

    /**
     * Callback de Sessão
     *
     * Expõe o access_token na sessão para uso em componentes do servidor
     * e rotas de API. Isso permite chamadas fetch autenticadas para a API de backend.
     */
    async session({ session, token }) {
      if (session.user) {
        session.accessToken = token.accessToken as string | undefined;
        session.refreshToken = token.refreshToken as string | undefined;
        session.error = token.error as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
};

// Inicializa o NextAuth com a configuração
const { handlers } = NextAuth(authOptions);

// Exporta os handlers GET e POST para as rotas de API
export const { GET, POST } = handlers;
