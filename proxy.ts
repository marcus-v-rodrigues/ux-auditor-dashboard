import { auth } from "@/app/api/auth/[...nextauth]/route";
import type { NextRequest } from "next/server";

/**
 * Configuração do Proxy do NextAuth v5
 *
 * Este proxy protege todas as rotas do dashboard exigindo autenticação.
 * Usa o padrão BFF (Backend for Frontend) onde o frontend gerencia
 * a autenticação através do NextAuth.js.
 *
 * Rotas Protegidas:
 * - Todas as rotas exceto /api/auth/*, /auth/* e ativos públicos
 *
 * Rotas Públicas:
 * - /api/auth/* - Endpoints de autenticação do NextAuth
 * - /auth/* - Páginas de autenticação personalizadas
 * - /_next/* - Arquivos internos do Next.js
 * - Ativos estáticos (imagens, fontes, etc.)
 *
 * NOTA: No NextAuth v5, use AUTH_SECRET (não NEXTAUTH_SECRET)
 * NOTA: auth() é a forma recomendada para proxy no NextAuth v5
 */
export default auth((req: NextRequest & { auth: any }) => {
  const { nextUrl } = req;
  
  // Não verifica autenticação para rotas de callback do Auth.js
  // Isso evita loops de redirecionamento durante o fluxo OAuth
  if (nextUrl.pathname.startsWith("/api/auth/callback")) {
    return;
  }
  
  // Verifica se o usuário está autenticado
  if (!req.auth) {
    // Redireciona para a página de login com a URL original como callback
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return Response.redirect(signInUrl);
  }
  
  // Se o usuário está autenticado e tentando acessar /auth/signin, redireciona para a página inicial
  if (nextUrl.pathname === "/auth/signin" && req.auth) {
    return Response.redirect(new URL("/", req.url));
  }
  
  // Você pode adicionar lógica adicional de proxy aqui
  // Por exemplo, controle de acesso baseado em roles, logging, etc.
  
  // Exemplo: Verificar se o usuário tem uma role específica
  // if (req.auth.user?.role !== "admin" && nextUrl.pathname.startsWith("/admin")) {
  //   return Response.redirect(new URL("/unauthorized", req.url));
  // }
});

/**
 * Configuração do Matcher do Proxy
 *
 * Define em quais rotas o proxy deve ser executado.
 * - Protege todas as rotas exceto endpoints de autenticação e ativos públicos
 */
export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos de requisição exceto:
     * - api/auth/* (endpoints de autenticação do NextAuth)
     * - auth/* (páginas de autenticação personalizadas)
     * - _next/static (arquivos estáticos)
     * - _next/image (arquivos de otimização de imagem)
     * - favicon.ico (arquivo favicon)
     * - arquivos públicos (imagens, fontes, etc.)
     */
    "/((?!api/auth|auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
