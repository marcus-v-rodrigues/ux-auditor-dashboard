# UX Auditor Dashboard

O **UX Auditor Dashboard** é a camada de interface e orquestração de uma plataforma avançada de análise de usabilidade assistida por Inteligência Artificial. Ele foi projetado para transformar gravações brutas de interações web (rrweb) em diagnósticos semânticos, facilitando o trabalho de auditores de UX.

## 🚀 Principais Recursos de Interface

- **Motor de Replay Inteligente:** Reconstrução de DOM em sandbox com injeção dinâmica de overlays de IA.
- **Sincronia Temporal (Sliding Window):** Painéis analíticos que reagem em tempo real à reprodução do vídeo.
- **Radar de Anomalias:** Destaque visual de frustrações, confusões e erros detectados por modelos de ML e LLM.
- **Resumo Narrativo de IA:** Síntese executiva da jornada do usuário para uma rápida compreensão do contexto.
- **Histórico de Auditorias:** Repositório centralizado de diagnósticos com gestão de status de processamento.

## 📚 Documentação Técnica e Metodológica

Para uma compreensão profunda da plataforma, consulte os documentos abaixo:

1.  [**Visão Geral e Arquitetura de Interface**](docs/overview.md) - Componentes e fluxos de dados.
2.  [**Metodologia de Auditoria**](docs/audit-methodology.md) - Como utilizar a ferramenta como um copiloto.
3.  [**Filosofia de Design e IHC**](docs/ui-design-philosophy.md) - Princípios de design para redução de carga cognitiva.
4.  [**Engenharia de Sincronia**](docs/visualization-engine.md) - Detalhes sobre a reconstrução de DOM e projeção de coordenadas.
5.  [**Diagnóstico Semântico e Heurísticas**](docs/semantic-diagnosis.md) - Lógica de interpretação de scores de usabilidade.
6.  [**Autenticação e Segurança (OIDC)**](docs/authentication.md) - Fluxo OAuth2, PKCE e proteção de rotas (BFF).
7.  [**Ingestão de Dados (rrweb)**](docs/data-ingestion.md) - Teoria e prática da captura baseada em DOM.
8.  [**Referência de API (BFF)**](docs/api-endpoints.md) - Endpoints internos do Dashboard.

## 🛠️ Configuração e Instalação

### 1. Pré-requisitos
- Node.js 18+
- Docker & Docker Compose (para ambiente completo)

### 2. Variáveis de Ambiente
Copie o arquivo de exemplo e configure suas chaves:
```bash
cp .env.example .env
```

### 3. Rodando o Projeto (Modo Dev)
```bash
npm install
npm run dev
```
Acesse [http://localhost:3001](http://localhost:3001).

## 🔒 Segurança e Arquitetura
O sistema utiliza o padrão **Backend for Frontend (BFF)** para isolar tokens sensíveis e garantir que a comunicação com o backend seja sempre autenticada e protegida por cookies criptografados (HttpOnly).

---
*Este projeto é parte de uma pesquisa de mestrado em Experiência do Usuário e Inteligência Artificial.*
