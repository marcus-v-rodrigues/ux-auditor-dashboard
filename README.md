# UX Auditor Dashboard

Dashboard para análise de experiência do usuário (UX) com autenticação OAuth2 usando NextAuth.js e Janus IDP.

## Características

- **Autenticação OAuth2 com PKCE**: Fluxo seguro de autenticação usando Proof Key for Code Exchange
- **Renovação Automática de Tokens**: Refresh automático usando refresh_token
- **Proteção de Rotas**: Middleware para proteger todas as rotas do dashboard
- **Fetch Autenticado**: Helper para chamadas de API do lado do servidor com injeção automática de token
- **Tipagem TypeScript**: Suporte completo TypeScript para todas as operações

## Documentação

Para informações detalhadas sobre autenticação, consulte:

- [Documentação de Autenticação](docs/AUTHENTICATION.md) - Guia completo de autenticação OAuth2 com PKCE
- [Fluxo de Dados](docs/DATA-FLOW.md) - Documentação do fluxo de dados da aplicação

## Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure seus valores:

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com suas configurações:

```bash
# Configuração do NextAuth
AUTH_URL=http://localhost:3001
AUTH_SECRET=seu-secret-key-aqui

# Configuração OAuth2 do Janus IDP
AUTH_ISSUER_URL=http://localhost:3000/oidc
AUTH_CLIENT_ID=ux-auditor
AUTH_CLIENT_SECRET=janus_dashboard_secret
AUTH_SCOPE=openid profile email offline_access

# Configuração da API
UX_AUDITOR_API_URL=http://localhost:8000
```

Gere o `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3001](http://localhost:3001) no seu navegador.

## Estrutura do Projeto

```
ux-auditor-dashboard/
├── app/                    # Aplicação Next.js
│   ├── api/               # Rotas de API
│   │   └── auth/          # Rotas de autenticação NextAuth
│   ├── auth/              # Páginas de autenticação
│   └── page.tsx           # Página principal
├── components/            # Componentes React
│   ├── auth/              # Componentes de autenticação
│   ├── player/            # Componentes do player de vídeo
│   └── ui/                # Componentes UI (shadcn/ui)
├── lib/                   # Bibliotecas utilitárias
│   └── authenticated-fetch.ts  # Helper de fetch autenticado
├── types/                 # Definições TypeScript
├── docs/                  # Documentação
├── proxy.ts               # Proxy de proteção de rotas (migrado de middleware.ts)
└── .env.local.example     # Template de variáveis de ambiente
```

## Tecnologias

- **Next.js 15** - Framework React
- **NextAuth.js v5** - Autenticação OAuth2
- **TypeScript** - Tipagem estática
- **shadcn/ui** - Componentes UI
- **Tailwind CSS** - Estilização
- **Janus IDP** - Provedor de identidade OIDC

## Desenvolvimento

### Executar em Modo de Desenvolvimento

```bash
npm run dev
```

### Build para Produção

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

## Recursos de Segurança

✅ **PKCE (Proof Key for Code Exchange)** - Previne interceptação de código de autorização  
✅ **Parâmetro State** - Proteção contra CSRF  
✅ **Gerenciamento de Tokens** - Tratamento de access_token e refresh_token  
✅ **Renovação Automática de Tokens** - Refresh automático usando refresh_token
✅ **Proteção de Rotas** - Autenticação baseada em proxy
✅ **Cookies de Sessão Criptografados** - Assinados com `AUTH_SECRET`

## Licença

Este projeto é parte do trabalho de mestrado e está sob licença acadêmica.

