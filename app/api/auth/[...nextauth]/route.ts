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
 * - checks: pkce, state (exigido pelo Janus IDP)
 *
 * Fluxo PKCE:
 * 1. Gerar code_verifier (random string 43-128 chars)
 * 2. Gerar code_challenge (SHA256 hash do code_verifier, base64url encoded)
 * 3. Redirecionar para /oidc/auth com code_challenge e code_challenge_method=S256
 * 4. No callback, enviar code_verifier para /oidc/token junto com o code
 * 5. Receber access_token e refresh_token
 *
 * NOTA IMPORTANTE sobre comunicação Docker:
 * Devido ao conflito de DNS entre containers Docker e o navegador do usuário,
 * os endpoints são separados em duas categorias:
 *
 * URLs PÚBLICAS (acessadas pelo navegador do usuário):
 * - authorization_endpoint: http://localhost:3000/oidc/auth
 *   O navegador redireciona o usuário para esta URL para autenticação.
 *
 * URLs INTERNAS (acessadas pelo servidor backend via rede Docker):
 * - token_endpoint: http://janus-service:3000/oidc/token
 *   O servidor troca o código de autorização pelo token.
 * - userinfo_endpoint: http://janus-service:3000/oidc/me
 *   O servidor busca informações do usuário.
 * - jwks_uri: http://janus-service:3000/oidc/jwks
 *   O servidor busca as chaves públicas para validar tokens JWT.
 *
 * Variáveis de ambiente:
 * - AUTH_ISSUER_URL: URL pública do issuer (ex: http://localhost:3000/oidc)
 * - AUTH_JANUS_INTERNAL_URL: URL interna para comunicação Docker (ex: http://janus-service:3000/oidc)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function JanusProvider(clientId: string, clientSecret: string): any {
  // URL pública do issuer - usada pelo navegador do usuário para autorização
  // O navegador precisa acessar localhost:3000 pois é o que o usuário consegue resolver
  const issuerUrl = process.env.AUTH_ISSUER_URL;
  
  // URL interna para comunicação servidor-servidor no Docker
  // O servidor backend se comunica com o Janus através da rede Docker interna
  // Se não definida, usa o issuerUrl (para desenvolvimento local sem Docker)
  const internalUrl = process.env.AUTH_JANUS_INTERNAL_URL || issuerUrl;

  console.log("[JanusProvider] Configuração:", {
    issuerUrl,
    internalUrl,
    clientId,
    debug: process.env.NODE_ENV === "development",
  });

  return {
    id: "janus",
    name: "Janus IDP",
    type: "oauth",
    // Issuer público - usado para construir URLs de redirecionamento
    issuer: issuerUrl,
    clientId: clientId,
    clientSecret: clientSecret,
    // Habilita PKCE (Proof Key for Code Exchange) e State para proteção CSRF
    // O Janus IDP exige rigorosamente PKCE, então definimos explicitamente
    // PKCE: proteção contra interceptação de código de autorização
    // State: proteção contra ataques CSRF
    checks: ["pkce", "state"],
    // Configuração de autorização - URL PÚBLICA (acessada pelo navegador do usuário)
    // O navegador redireciona para o Janus em localhost:3000 para autenticação
    authorization: {
      url: `${issuerUrl}/auth`,
      params: {
        // Escopos solicitados: openid (obrigatório), profile, email, offline_access (para refresh_token)
        scope: process.env.AUTH_SCOPE || "openid profile email offline_access",
      },
    },
    // Endpoint de token - URL INTERNA (acessada pelo servidor backend)
    // O servidor troca o código de autorização pelo token através da rede Docker
    token: `${internalUrl}/token`,
    // Endpoint de userinfo - URL INTERNA (acessada pelo servidor)
    userinfo: `${internalUrl}/me`,
    // Endpoint JWKS para verificação de assinatura do id_token - URL INTERNA
    // O servidor busca as chaves públicas para validar o token JWT
    jwks_endpoint: `${internalUrl}/jwks`,
    // Extrai perfil do id_token em vez de fazer requisição userinfo
    idToken: true,
    // Callback para processar o perfil do usuário retornado pelo Janus
    // Mapeia os campos do perfil OIDC para o formato esperado pelo NextAuth
    profile(profile: { sub?: string; id?: string; name?: string; email?: string; picture?: string }) {
      console.log("[JanusProvider] Perfil recebido:", profile);
      return {
        // O campo 'sub' (subject) é o identificador único do usuário no OIDC
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
  // Adiciona logs de debug para ajudar na solução de problemas
  debug: process.env.NODE_ENV === "development",
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
        console.log("[JWT Callback] Login inicial:", {
          provider: account.provider,
          access_token: account.access_token ? "present" : "missing",
          refresh_token: account.refresh_token ? "present" : "missing",
          expires_at: account.expires_at,
        });
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
          console.log("[JWT Callback] Tentando renovar token");
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
          console.log("[JWT Callback] Token renovado com sucesso");
          
          return {
            ...token,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || token.refreshToken,
            expiresAt: Date.now() + (tokens.expires_in * 1000),
          };
        } catch (error) {
          console.error("[JWT Callback] Erro ao renovar token:", error);
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
      console.log("[Session Callback] Criando sessão:", {
        user: session.user?.email,
        accessToken: token.accessToken ? "present" : "missing",
        error: token.error,
      });
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
  // Eventos para rastrear o fluxo de autenticação
  events: {
    async signIn({ user, account, profile }) {
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
      console.log("[Event] Session:", { user: session?.user?.email });
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Configuração de cookies para funcionar corretamente no Docker
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

// Inicializa o NextAuth com a configuração
const { handlers, auth } = NextAuth(authOptions);

// Exporta os handlers GET e POST para as rotas de API
export const { GET, POST } = handlers;

// Exporta a função auth para uso em proxy e componentes do servidor
export { auth };
