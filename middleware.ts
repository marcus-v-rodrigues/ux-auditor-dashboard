import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Configuração do Middleware do NextAuth
 *
 * Este middleware protege todas as rotas do dashboard exigindo autenticação.
 * Usa o padrão BFF (Backend for Frontend) onde o frontend gerencia
 * a autenticação através do NextAuth.js.
 *
 * Rotas Protegidas:
 * - Todas as rotas exceto /api/auth/*, /auth/* e ativos públicos
 *
 * Rotas Públicas:
 * - /api/auth/* - Endpoints de autenticação do NextAuth
 * - /auth/signin - Página de login
 * - /auth/error - Página de erro
 * - /_next/* - Arquivos internos do Next.js
 * - Ativos estáticos (imagens, fontes, etc.)
 */
export async function middleware(req: NextRequest) {
  // Obtém o token da requisição
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // Verifica se o usuário está autenticado
  if (!token) {
    // Redireciona para a página de login com a URL original como callback
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }
  
  // Você pode adicionar lógica adicional de middleware aqui
  // Por exemplo, controle de acesso baseado em roles, logging, etc.
  
  // Exemplo: Verificar se o usuário tem uma role específica
  // if (token.role !== "admin" && req.nextUrl.pathname.startsWith("/admin")) {
  //   return NextResponse.redirect(new URL("/unauthorized", req.url));
  // }
  
  return NextResponse.next();
}

/**
 * Configuração do Matcher do Middleware
 *
 * Define em quais rotas o middleware deve ser executado.
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
