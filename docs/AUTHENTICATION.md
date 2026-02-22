# Autenticação OAuth2 com NextAuth.js

Este documento descreve a implementação de autenticação OAuth2 usando NextAuth.js com Janus IDP como provedor, seguindo o padrão BFF (Backend for Frontend).

## Visão Geral

O sistema de autenticação implementa:
- **OAuth2 com PKCE**: Proof Key for Code Exchange para segurança aprimorada
- **Parâmetro State**: Proteção contra CSRF
- **Gerenciamento de Tokens**: Tratamento de access_token e refresh_token
- **Proteção de Rotas**: Autenticação baseada em middleware
- **Fetch Autenticado**: Chamadas de API do lado do servidor com injeção automática de token

## Arquitetura

```
┌─────────────┐     ┌──────────────┐      ┌─────────────┐
│   Browser   │────▶│ NextAuth.js  │────▶│  Janus IDP  │
│             │◀────│  (Camada BFF)│◀────│   (VPS)     │
└─────────────┘     └──────────────┘      └─────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Session Store │
                    │     (JWT)     │
                    └───────────────┘
```

## Estrutura de Arquivos

```
ux-auditor-dashboard/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts          # Configuração do NextAuth
│   └── auth/
│       ├── signin/
│       │   └── page.tsx              # Página de login
│       └── error/
│           └── page.tsx              # Página de erro
├── lib/
│   └── authenticated-fetch.ts        # Helper de fetch autenticado
├── middleware.ts                     # Proteção de rotas
├── types/
│   └── next-auth.d.ts                # Definições TypeScript
└── .env.local.example                # Template de variáveis de ambiente
```

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
# Configuração do NextAuth (v5 usa AUTH_URL e AUTH_SECRET)
AUTH_URL=http://localhost:3001
AUTH_SECRET=seu-secret-key-aqui-gerado-com-openssl-rand-base64-32

# Configuração OAuth2 do Janus IDP
AUTH_ISSUER_URL=https://seu-dominio-vps.com
AUTH_CLIENT_ID=seu-janus-client-id
AUTH_CLIENT_SECRET=seu-janus-client-secret
AUTH_SCOPE=openid email profile

# Configuração da API
UX_AUDITOR_API_URL=http://localhost:8000
```

### Gerar AUTH_SECRET

```bash
openssl rand -base64 32
```

## Uso

### 1. Fazer Login

Usuários são redirecionados automaticamente para a página de login ao acessar rotas protegidas:

```tsx
// O middleware lida com isso automaticamente
// Acesse qualquer rota protegida, ex: http://localhost:3000/dashboard
// O usuário será redirecionado para /auth/signin
```

### 2. Fazer Chamadas de API Autenticadas (Server Components)

Use o helper [`authenticatedFetch`](lib/authenticated-fetch.ts:1):

```tsx
import { authenticatedGet, authenticatedPost } from "@/lib/authenticated-fetch";

export default async function DashboardPage() {
  // Requisição GET
  const sessions = await authenticatedGet("/api/sessions");
  
  // Requisição POST
  const newSession = await authenticatedPost("/api/sessions", {
    name: "Minha Sessão",
    description: "Sessão de teste",
  });
  
  return <div>{/* Renderiza dados */}</div>;
}
```

### 3. Fazer Chamadas de API Autenticadas (API Routes)

```tsx
import { NextRequest, NextResponse } from "next/server";
import { authenticatedFetch } from "@/lib/authenticated-fetch";

export async function GET(request: NextRequest) {
  try {
    const data = await authenticatedFetch("/api/users");
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao buscar dados" },
      { status: 500 }
    );
  }
}
```

### 4. Acessar Dados da Sessão

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return <div>Não autenticado</div>;
  }
  
  return (
    <div>
      <p>Access Token: {session.accessToken?.slice(0, 20)}...</p>
      <p>Usuário: {session.user?.email}</p>
    </div>
  );
}
```

## Referência da API

### authenticatedFetch

Função principal para fazer requisições autenticadas.

```typescript
async function authenticatedFetch<T>(
  endpoint: string,
  options?: AuthenticatedFetchOptions
): Promise<T>
```

**Parâmetros:**
- `endpoint`: Endpoint da API (ex: `/api/users`)
- `options`: Opções de fetch (method, body, headers, etc.)

**Opções:**
- `baseUrl`: URL base personalizada (padrão: `UX_AUDITOR_API_URL`)
- `throwOnError`: Lançar erro em respostas não-2xx (padrão: `true`)
- `method`: Método HTTP (GET, POST, PUT, DELETE, PATCH)
- `body`: Corpo da requisição (automaticamente convertido para JSON)
- `headers`: Cabeçalhos personalizados

### Funções Helper

- [`authenticatedGet`](lib/authenticated-fetch.ts:179): Requisições GET
- [`authenticatedPost`](lib/authenticated-fetch.ts:193): Requisições POST
- [`authenticatedPut`](lib/authenticated-fetch.ts:208): Requisições PUT
- [`authenticatedDelete`](lib/authenticated-fetch.ts:223): Requisições DELETE
- [`authenticatedPatch`](lib/authenticated-fetch.ts:238): Requisições PATCH

## Recursos de Segurança

### PKCE (Proof Key for Code Exchange)

PKCE é ativado automaticamente pelo NextAuth.js para prevenir ataques de interceptação de código de autorização.

### Parâmetro State

O parâmetro state é usado para prevenir ataques CSRF durante o fluxo OAuth2.

### Armazenamento de Tokens

- **Access Token**: Armazenado na sessão JWT, acessível em componentes do servidor
- **Refresh Token**: Armazenado na sessão JWT para renovação de token
- **Cookie de Sessão**: Criptografado e assinado usando `AUTH_SECRET`

### Proteção de Rotas

O middleware protege todas as rotas exceto:
- `/api/auth/*`: Endpoints do NextAuth
- `/auth/*`: Páginas de autenticação
- `/_next/*`: Arquivos internos do Next.js
- Ativos estáticos

## Tratamento de Erros

### AuthenticatedFetchError

Classe de erro personalizada para erros de API:

```typescript
try {
  const data = await authenticatedFetch("/api/users");
} catch (error) {
  if (error instanceof AuthenticatedFetchError) {
    console.error(`Erro ${error.status}: ${error.message}`);
  }
}
```

### Erros de Autenticação

Usuários são redirecionados para `/auth/error` com códigos de erro:
- `Configuration`: Problema na configuração do servidor
- `AccessDenied`: Permissão negada
- `Verification`: Token expirado
- `OAuthSignin`: Erro na construção da URL de autorização
- `OAuthCallback`: Erro no tratamento da resposta do provedor OAuth

## Refresh de Token

O callback JWT inclui um placeholder para lógica de refresh de token:

```typescript
// Em app/api/auth/[...nextauth]/route.ts
async jwt({ token, account, user }) {
  // ... código existente ...
  
  // Access token expirou, tenta renová-lo
  if (Date.now() >= Number(token.expiresAt || 0)) {
    // Implemente lógica de refresh aqui
    // Exemplo:
    // const response = await fetch(`${process.env.AUTH_ISSUER_URL}/oauth2/token`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //   body: new URLSearchParams({
    //     grant_type: 'refresh_token',
    //     refresh_token: token.refreshToken,
    //     client_id: process.env.AUTH_CLIENT_ID!,
    //     client_secret: process.env.AUTH_CLIENT_SECRET!,
    //   }),
    // });
    // const tokens = await response.json();
    // return { ...token, accessToken: tokens.access_token, expiresAt: Date.now() + tokens.expires_in * 1000 };
  }
  
  return token;
}
```

## Testes

### Desenvolvimento Local

1. Configure sua instância do Janus IDP
2. Configure as variáveis de ambiente
3. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

4. Acesse `http://localhost:3000` - você será redirecionado para fazer login

### Testar Fetch Autenticado

Crie um componente de servidor de teste:

```tsx
// app/test-auth/page.tsx
import { authenticatedGet } from "@/lib/authenticated-fetch";

export default async function TestAuthPage() {
  try {
    const data = await authenticatedGet("/api/health");
    return <div>Autenticado: {JSON.stringify(data)}</div>;
  } catch (error) {
    return <div>Erro: {(error as Error).message}</div>;
  }
}
```

## Solução de Problemas

### "Usuário não autenticado"

Verifique:
1. Usuário está logado
2. Cookie de sessão está presente
3. `AUTH_SECRET` está configurado corretamente

### "Credenciais de cliente inválidas"

Verifique:
1. `AUTH_CLIENT_ID` e `AUTH_CLIENT_SECRET` estão corretos
2. Cliente está registrado no Janus IDP
3. URI de redirecionamento corresponde (ex: `http://localhost:3001/api/auth/callback/janus`)

### "Token expirado"

Implemente lógica de refresh de token no callback JWT (veja seção Refresh de Token).

### Middleware não protegendo rotas

Verifique:
1. Middleware está na raiz do projeto (`middleware.ts`)
2. Configuração do matcher está correta
3. Sem middleware conflitante

## Melhores Práticas

1. **Sempre use fetch do lado do servidor**: Use [`authenticatedFetch`](lib/authenticated-fetch.ts:1) em componentes do servidor e rotas de API
2. **Trate erros com elegância**: Envolva chamadas de API em blocos try-catch
3. **Implemente refresh de token**: Adicione lógica de refresh para sessões de longa duração
4. **Proteja variáveis de ambiente**: Nunca faça commit de `.env.local` no controle de versão
5. **Use HTTPS em produção**: Sempre use HTTPS para fluxos OAuth2
6. **Valide tokens**: Considere validar assinaturas JWT na API de backend

## Recursos Adicionais

- [Documentação do NextAuth.js](https://authjs.dev/)
- [RFC do OAuth 2.0](https://tools.ietf.org/html/rfc6749)
- [RFC do PKCE](https://tools.ietf.org/html/rfc7636)
- [Documentação do Janus IDP](https://www.janus-idp.io/)
