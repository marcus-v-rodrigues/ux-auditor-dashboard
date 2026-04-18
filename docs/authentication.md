# Módulo: Autenticação, Segurança e RBAC

## 1. Visão Geral e Propósito
O ecossistema de segurança do **UX Auditor Dashboard** é fundamentado no protocolo **OpenID Connect (OIDC)**. O sistema opera sob o paradigma de **Segurança por Camadas**, onde a identidade é centralizada no **Janus IDP**, a sessão é gerida pelo **BFF (Next.js)** e a autorização é validada de forma distribuída tanto na interface quanto nas APIs de backend.

## 2. Fluxo de Autenticação (OIDC + PKCE)
O sistema utiliza o fluxo de **Authorization Code com PKCE**, garantindo que nenhum segredo do cliente seja exposto ao navegador.

### Ciclo de Vida da Sessão
1.  **Handshake:** O analista inicia o login; o Dashboard gera o `code_verifier` e o redireciona ao Janus.
2.  **Autorização:** Após o login bem-sucedido, o Janus retorna um código de autorização temporário.
3.  **Troca Segura:** O servidor (BFF) troca o código pelo **Access Token** e **Refresh Token** via canal privado (Server-to-Server).
4.  **Sessão HttpOnly:** Os tokens são armazenados em um cookie de sessão criptografado e marcado como `HttpOnly`, tornando-os invisíveis para scripts maliciosos (proteção contra XSS).

## 3. Proteção de Rotas via RBAC
O Dashboard implementa um sistema de **Role-Based Access Control (RBAC)** que separa as permissões em níveis globais e específicos por cliente.

### Arquitetura do Proxy de Proteção
A proteção de rotas é centralizada no arquivo `proxy.ts`. Este componente atua como um middleware de alta performance que intercepta todas as requisições antes que elas atinjam os componentes de página.

```mermaid
graph TD
    Request[Requisição do Usuário] --> Proxy{Proxy de Segurança}
    Proxy -- "Não Autenticado" --> Login[/auth/signin]
    Proxy -- "Autenticado" --> RoleCheck{Verifica Roles}
    RoleCheck -- "Global: admin" --> Access[Acesso Total]
    RoleCheck -- "Client: ux-auditor" --> Access
    RoleCheck -- "Sem Permissão" --> Error[/auth/error?code=AccessDenied]
```

### Lógica de Autorização
O sistema normaliza as permissões vindas do IDP no seguinte formato:
*   **Global Roles:** Permissões transversais à plataforma (ex: `janus_admin`).
*   **Client Roles:** Permissões granulares para o `clientId = ux-auditor`.

O `proxy.ts` garante que apenas usuários com acesso explícito à aplicação `ux-auditor` ou administradores globais possam visualizar os dados de auditoria, aplicando o **Princípio do Menor Privilégio**.

## 4. Propagação de Autenticação para o Backend
O Dashboard atua como um **Token Relay**. Ele recebe o token do IDP e o propaga para a **UX Auditor API (Backend Python)** de forma transparente e segura.

### O Helper `authenticatedFetch`
Para garantir que todas as chamadas de rede incluam a identidade do analista, utilizamos o utilitário `lib/authenticated-fetch.ts`. 

**Mecânica de Funcionamento:**
1.  **Extração de Sessão:** O helper recupera o `accessToken` diretamente da sessão do NextAuth no servidor.
2.  **Injeção de Header:** Adiciona o cabeçalho `Authorization: Bearer <token>` em cada requisição.
3.  **Tratamento de 401/403:** Caso o token expire, o helper captura a falha e sinaliza para o sistema de Refresh Token renovar a sessão automaticamente.

```typescript
// Exemplo de propagação segura no BFF
export async function GET(request: Request) {
  // O token é injetado automaticamente pelo helper server-side
  const response = await authenticatedGet("/api/sessions");
  return Response.json(response);
}
```

## 5. Validação de Token no Backend (Zero-Trust)
Embora o Dashboard valide a sessão, o backend Python adota uma postura de **Zero-Trust (Confiança Zero)**. Ele valida cada token individualmente utilizando:
1.  **Assinatura RS256:** Verifica se o token foi realmente assinado pela chave privada do Janus IDP.
2.  **Endpoint JWKS:** O backend consulta dinamicamente a chave pública do IDP para validar a assinatura, eliminando a necessidade de chaves compartilhadas (*Shared Secrets*).
3.  **Audience (aud):** Verifica se o campo `aud` do token corresponde ao recurso `ux-auditor-api`, impedindo que tokens de outras aplicações sejam usados indevidamente aqui.

## 6. Referências e Padrões de Segurança
*   **Token Relay Pattern:** Padrão arquitetural onde o gateway/BFF repassa tokens de segurança para serviços de downstream.
*   **RS256 Algorythm:** Algoritmo de assinatura assimétrica que garante a integridade sem expor a chave de assinatura.
*   **HttpOnly Cookies:** Mecanismo de defesa contra roubo de sessão via ataques XSS.
