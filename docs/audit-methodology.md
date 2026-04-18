# Metodologia de Auditoria Assistida por IA

## 1. Visão Geral
Este documento descreve o processo metodológico de utilização do **UX Auditor Dashboard** para realizar auditorias de usabilidade. A plataforma foi desenhada para atuar como um **Copiloto do Auditor**, aumentando a produtividade através da automação de tarefas repetitivas (detecção de cliques) e síntese de informações complexas (narrativa de jornada).

## 2. Etapas do Processo de Auditoria

### Etapa 1: Ingestão e Preparação de Dados
O auditor inicia o processo enviando arquivos JSON capturados pelo plugin `rrweb-recorder`. 
*   **Teoria:** O sistema valida a integridade da sessão para garantir que a reconstrução do DOM seja 100% fiel à experiência do usuário original.

### Etapa 2: Monitoramento de Processamento (IA Pipeline)
Após o upload, o sistema enfileira o job de IA. O Dashboard fornece feedback visual em tempo real sobre o progresso:
*   **Significado:** Permite que o analista prepare o contexto da auditoria enquanto a IA processa anomalias estatísticas e gera a interpretação semântica.

### Etapa 3: Análise Narrativa (Macro)
Antes de assistir ao replay, o auditor deve ler a **Narrativa Executiva** (gerada pelo LLM) no cabeçalho ou no painel lateral.
*   **Propósito:** Fornecer um "spoiler cognitivo" que reduz o tempo de descoberta. A IA sintetiza em 2 parágrafos o que levaria 10 minutos para ser observado.

### Etapa 4: Observação Sincronizada (Micro)
O auditor inicia a reprodução do replay. O Dashboard atua como um sistema de radar:
*   **Insights em Tempo Real:** Quando a IA detecta um "Loop de Frustração", o Dashboard destaca o card correspondente e projeta um *overlay* neon sobre o elemento problemático.
*   **Correlação Telemetria-Vídeo:** O auditor observa as barras de psicometria (Frustração, Confusão) enquanto assiste ao vídeo. Picos na barra vermelha (Frustração) devem ser correlacionados com ações específicas do usuário na tela.

### Etapa 5: Diagnóstico Semântico e Heurístico
O analista consulta a aba de **Diagnóstico Semântico** para ver a classificação final da jornada (ex: "Em Loop", "Progredindo").
*   **Ação:** O auditor deve validar se a percepção da IA condiz com o fenômeno observado. O Dashboard permite "Reprocessar" a sessão se novas heurísticas forem calibradas.

## 3. Guia de Interpretação de Métricas

### Psicometria (Scores de 0-100)
*   **Frustração > 70:** Indica falha crítica de usabilidade ou erro técnico recorrente.
*   **Confusão > 70:** Indica falta de *affordance* ou arquitetura de informação ambígua.
*   **Engajamento < 30:** Indica provável abandono da tarefa ou desinteresse.

### Análise de Intenção
O Dashboard apresenta a **Intenção Primária** (ex: "Efetuar login") e a **Probabilidade de Sucesso**. Uma baixa probabilidade de sucesso com alta frustração é o cenário prioritário para correção imediata (Fix Priority).

## 4. Práticas Recomendadas para Auditores
1.  **Use o Scrubbing:** Arraste a barra de tempo para os picos de frustração indicados pela IA. Não assista ao vídeo linearmente se o tempo for escasso.
2.  **Inspecione o DOM:** Use as ferramentas de desenvolvedor do navegador sobre o iframe do player para entender a estrutura técnica do erro identificado pela IA.
3.  **Reprocessamento:** Se o backend de IA for atualizado com novas heurísticas, utilize o botão "Reprocessar" para atualizar os diagnósticos de sessões antigas.
