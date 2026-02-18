# Implementação de Autenticação OAuth2

Esta implementação adiciona autenticação OAuth2 ao UX Auditor Dashboard usando NextAuth.js com Janus IDP como provedor, seguindo o padrão BFF (Backend for Frontend).

## O Que Foi Implementado

### 1. Configuração do NextAuth.js
**Arquivo:** [`app/api/auth/[...nextauth]/route.ts`](app/api/auth/[...nextauth]/route.ts:1)

- Provedor OAuth2 personalizado para Janus IDP
- PKCE e parâmetro State para proteção contra CSRF
- Gerenciamento de tokens (access_token e refresh_token)
- Callback JWT para gerenciamento do ciclo de vida dos tokens
- Callback de sessão para expor o access_token aos componentes do servidor

### 2. Middleware para Proteção de Rotas
**Arquivo:** [`middleware.ts`](middleware.ts:1)

- Protege todas as rotas do dashboard
- Redireciona usuários não autenticados para a página de login
- Suporta URL de callback para redirecionamento após login

### 3. Helper de Fetch Autenticado
**Arquivo:** [`lib/authenticated-fetch.ts`](lib/authenticated-fetch.ts:1)

- Fetch do lado do servidor com injeção automática de token
- Funções helper: `authenticatedGet`, `authenticatedPost`, `authenticatedPut`, `authenticatedDelete`, `authenticatedPatch`
- Tratamento de erros personalizado com [`AuthenticatedFetchError`](lib/authenticated-fetch.ts:19)
- Chamadas de API com tipagem TypeScript

### 4. Definições de Tipos TypeScript
**Arquivo:** [`types/next-auth.d.ts`](types/next-auth.d.ts:1)

- Interface Session estendida com `accessToken`, `refreshToken`, `error`
- Suporte completo TypeScript para propriedades personalizadas

### 5. Páginas de Autenticação
**Arquivos:** 
- [`app/auth/signin/page.tsx`](app/auth/signin/page.tsx:1) - Página de login
- [`app/auth/error/page.tsx`](app/auth/error/page.tsx:1) - Página de erro com códigos de erro

### 6. Configuração de Ambiente
**Arquivo:** [`.env.local.example`](.env.local.example:1)

- Template para todas as variáveis de ambiente necessárias
- Inclui configuração do NextAuth, Janus IDP e API

### 7. Documentação
**Arquivo:** [`docs/AUTHENTICATION.md`](docs/AUTHENTICATION.md:1)

- Guia completo de autenticação
- Exemplos de uso
- Referência da API
- Recursos de segurança
- Guia de solução de problemas

## Início Rápido

### 1. Instalar Dependências

```bash
npm install next-auth@beta
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure seus valores:

```bash
cp .env.local.example .env.local
```

Edite `.env.local`:

```bash
# Configuração do NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu-secret-key-aqui

# Configuração OAuth2 do Janus IDP
JANUS_IDP_ISSUER=https://seu-dominio-vps.com
JANUS_IDP_CLIENT_ID=seu-janus-client-id
JANUS_IDP_CLIENT_SECRET=seu-janus-client-secret
JANUS_IDP_SCOPE=openid email profile

# Configuração da API
UX_AUDITOR_API_URL=http://localhost:8000
```

Gere o `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

### 4. Testar a Autenticação

1. Acesse `http://localhost:3000`
2. Você será redirecionado para `/auth/signin`
3. Clique em "Sign in with Janus IDP"
4. Complete o fluxo OAuth2
5. Você será redirecionado de volta para o dashboard

## Exemplos de Uso

### Fazendo Chamadas de API Autenticadas (Server Components)

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

### Acessando Dados da Sessão

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
      <p>Usuário: {session.user?.email}</p>
      <p>Access Token: {session.accessToken?.slice(0, 20)}...</p>
    </div>
  );
}
```

### Tratamento de Erros

```tsx
import { authenticatedGet, AuthenticatedFetchError } from "@/lib/authenticated-fetch";

export default async function DataPage() {
  try {
    const data = await authenticatedGet("/api/users");
    return <div>{JSON.stringify(data)}</div>;
  } catch (error) {
    if (error instanceof AuthenticatedFetchError) {
      return <div>Erro {error.status}: {error.message}</div>;
    }
    return <div>Erro desconhecido</div>;
  }
}
```

## Recursos de Segurança

✅ **PKCE (Proof Key for Code Exchange)** - Previne interceptação de código de autorização  
✅ **Parâmetro State** - Proteção contra CSRF  
✅ **Gerenciamento de Tokens** - Tratamento de access_token e refresh_token  
✅ **Proteção de Rotas** - Autenticação baseada em middleware  
✅ **Cookies de Sessão Criptografados** - Assinados com `NEXTAUTH_SECRET`  
✅ **Chamadas de API com Tipagem** - Suporte completo TypeScript

## Estrutura de Arquivos

```
ux-auditor-dashboard/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts          # Configuração do NextAuth
│   ├── auth/
│   │   ├── signin/
│   │   │   └── page.tsx              # Página de login
│   │   └── error/
│   │       └── page.tsx              # Página de erro
│   └── ...
├── lib/
│   ├── authenticated-fetch.ts        # Helper de fetch autenticado
│   └── utils.ts
├── middleware.ts                     # Proteção de rotas
├── types/
│   ├── dashboard.ts
│   └── next-auth.d.ts                # Definições TypeScript
├── docs/
│   └── AUTHENTICATION.md             # Documentação completa
├── .env.local.example                # Template de variáveis de ambiente
└── README-AUTHENTICATION.md          # Este arquivo
```

## Próximos Passos

1. **Configurar o Janus IDP**: Configure sua instância do Janus IDP e registre a aplicação
2. **Atualizar URIs de Redirecionamento**: Adicione `http://localhost:3000/api/auth/callback/janus` ao seu cliente do Janus IDP
3. **Implementar Refresh de Token**: Adicione lógica de refresh no callback JWT (veja [`docs/AUTHENTICATION.md`](docs/AUTHENTICATION.md:1))
4. **Adicionar Controle de Acesso Baseado em Roles**: Estenda o middleware para controle de acesso baseado em roles
5. **Testar Integração**: Verifique o fluxo de autenticação com sua API de backend

## Solução de Problemas

Veja [`docs/AUTHENTICATION.md`](docs/AUTHENTICATION.md:1) para guia detalhado de solução de problemas.

Problemas comuns:
- **"Usuário não autenticado"**: Verifique `NEXTAUTH_SECRET` e cookie de sessão
- **"Credenciais de cliente inválidas"**: Verifique client ID e secret do Janus IDP
- **"Token expirado"**: Implemente lógica de refresh de token
- **Middleware não funcionando**: Certifique-se de que o middleware está na raiz do projeto

## Recursos Adicionais

- [Documentação do NextAuth.js](https://authjs.dev/)
- [RFC do OAuth 2.0](https://tools.ietf.org/html/rfc6749)
- [RFC do PKCE](https://tools.ietf.org/html/rfc7636)
- [Documentação do Janus IDP](https://www.janus-idp.io/)
