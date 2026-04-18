# Módulo: Diagnóstico Semântico e Heurísticas de UX

## 1. Visão Geral e Propósito
O módulo de Diagnóstico Semântico (`SemanticDiagnostics.tsx`) é responsável por traduzir métricas quantitativas (scores numéricos da IA) em diagnósticos qualitativos estruturados. Ele implementa heurísticas de especialista para categorizar a experiência do usuário em estados de jornada compreensíveis por analistas de UX.

## 2. Fundamentação Matemática das Heurísticas
O sistema utiliza uma função de decisão para inferir o estado cognitivo e de jornada do usuário. Podemos formalizar o diagnóstico do estado ($Status$) como uma função por partes baseada em limiares críticos ($T$):

$$
Status = 
\begin{cases} 
	ext{Em Loop (Crítico)} & 	ext{se } F > 70 \land P_s < 30 \\
	ext{Comportamento Errático} & 	ext{se } C > 70 \land |B| \ge 2 \\
	ext{Em Fluxo (Saudável)} & 	ext{caso contrário}
\end{cases}
$$

Onde:
*   $F$ (Frustration Score): Medida de eventos negativos (ex: *rage clicks*).
*   $C$ (Confusion Score): Medida de redundância e vacilação na jornada.
*   $P_s$ (Success Probability): Probabilidade estatística de conclusão da tarefa atual.
*   $B$ (Barriers): Conjunto de obstáculos semânticos identificados pelo LLM.

### Escalonamento de Cores (Heatmap Visual)
Para visualização de severidade, aplica-se uma função de transferência discretizada para mapeamento de cores:

$$
Color(s) = 
\begin{cases} 
	ext{Verde (Baixa Severidade)} & 	ext{se } s < 3 \\
	ext{Amarelo (Atenção)} & 	ext{se } 3 \le s \le 7 \\
	ext{Vermelho (Severidade Alta)} & 	ext{se } s > 7
\end{cases}
$$
*Onde $s$ é o score normalizado [0-10].*

## 3. Justificativa Arquitetural (Interpretação no Cliente)
A decisão de processar o diagnóstico semântico no **Frontend** fundamenta-se nos seguintes princípios de engenharia:

### A. Separação de Responsabilidades (Separation of Concerns)
O backend é responsável pela **inferência estatística** (processamento pesado e geração de scores brutos). O frontend assume a **interpretação contextual**. Isso segue o princípio de que o significado dos dados pode variar conforme o contexto da interface, permitindo que a camada de visualização adapte as heurísticas sem re-treinar modelos de IA.

### B. Flexibilidade e Calibração
Manter a lógica no componente React permite a calibração de limiares ($T_f, T_c, T_s$) em tempo real via *props* ou configuração, facilitando a realização de Testes A/B sobre as próprias heurísticas de UX.

### C. Performance e Responsividade (HCI)
A execução *client-side* elimina a latência de rede para atualizações diagnósticas durante o *replay*. Considerando a complexidade $O(1)$ da função de decisão, a resposta da UI é instantânea conforme o analista navega pela timeline da sessão.

## 4. Referências e Base Teórica
*   **Heuristic Evaluation (Nielsen, 1994):** O sistema automatiza a detecção de violações de heurísticas monitorando sinais de erro e loops de recuperação.
*   **Cognitive Load Theory (Sweller, 1988):** A métrica de confusão ($C$) atua como um *proxy* para a carga cognitiva intrínseca e extrínseca enfrentada pelo usuário na interface.
