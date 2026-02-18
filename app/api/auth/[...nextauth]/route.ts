import NextAuth, { NextAuthConfig } from "next-auth";
import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";

/**
 * Provedor OAuth2 Personalizado para Janus IDP
 * Implementa PKCE e State para proteção contra CSRF
 */
function JanusProvider(options: any): OAuthConfig<any> {
  return {
    id: "janus",
    name: "Janus IDP",
    type: "oauth",
    authorization: {
      params: {
        grant_type: "authorization_code",
        response_type: "code",
      },
    },
    token: `${process.env.JANUS_IDP_ISSUER}/oauth2/token`,
    userinfo: `${process.env.JANUS_IDP_ISSUER}/oauth2/userinfo`,
    profile(profile: any) {
      return {
        id: profile.sub || profile.id,
        name: profile.name,
        email: profile.email,
        image: profile.picture || null,
      };
    },
    options,
  };
}

/**
 * Configuração do NextAuth
 *
 * Esta configuração implementa:
 * - Provedor OAuth2 personalizado para Janus IDP
 * - PKCE (Proof Key for Code Exchange) para segurança aprimorada
 * - Parâmetro State para proteção contra CSRF
 * - Gerenciamento de tokens com access_token e refresh_token
 * - Callback de sessão para expor o access_token aos componentes do servidor
 */
const authOptions: NextAuthConfig = {
  providers: [
    JanusProvider({
      clientId: process.env.JANUS_IDP_CLIENT_ID!,
      clientSecret: process.env.JANUS_IDP_CLIENT_SECRET!,
      authorization: {
        url: `${process.env.JANUS_IDP_ISSUER}/oauth2/authorize`,
        params: {
          scope: process.env.JANUS_IDP_SCOPE || "openid email profile",
        },
      },
    }),
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

      // Access token expirou, tenta renová-lo
      // Nota: Implemente lógica de refresh aqui se necessário
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
