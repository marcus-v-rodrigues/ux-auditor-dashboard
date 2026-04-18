# Filosofia de Design e Princípios de IHC

## 1. Visão Geral
O design do **UX Auditor Dashboard** não é meramente estético; ele é fundamentado em princípios de **Interação Humano-Computador (IHC)** para suportar tarefas de alta carga cognitiva, como a análise de sessões de usuários. A interface utiliza uma estética "Dark/Neon" (High-Contrast Dark Mode) para minimizar o cansaço visual e destacar informações críticas.

## 2. Princípios de Design Aplicados

### A. Redução de Ruído Visual (Signal-to-Noise Ratio)
Analistas de UX lidam com grandes volumes de dados. A interface aplica o princípio de **Divulgação Progressiva**:
*   Dados brutos (JSON) são escondidos por trás de abas ou modais.
*   Insights críticos são destacados com cores neon (Roxo/Ciano), enquanto informações de suporte usam tons de cinza de baixo contraste.

### B. Gestalt e Agrupamento Semântico
A interface é dividida em quadrantes funcionais baseados na proximidade e destino da informação:
1.  **Quadrante de Contexto (Superior):** Identificação e status da sessão.
2.  **Quadrante de Observação (Centro):** Player de replay (o "fenômeno" observado).
3.  **Quadrante Analítico (Direita):** Diagnósticos qualitativos e resumos narrativos.
4.  **Quadrante Quantitativo (Inferior/Lateral):** Telemetria, psicometria e séries temporais.

## 3. Taxonomia Visual de Insights
A interface utiliza uma linguagem visual padronizada para comunicar severidade e tipo de descoberta:

| Elemento | Significado Semântico | Teoria de Cor |
|----------|-----------------------|---------------|
| **Roxo Neon** | Insights de IA / Narrativa | Associado à "Inteligência" e sofisticação tecnológica. |
| **Amarelo Ámbar** | Advertências / Confusão | Cor universal de atenção; indica hesitação do usuário. |
| **Vermelho Destrutivo** | Erros / Frustração Crítica | Indica quebra de fluxo ou *rage clicks*. |
| **Verde Esmeralda** | Sucesso / Conclusão | Confirmação de meta alcançada. |

## 4. Teoria da Carga Cognitiva (Sweller)
Para evitar que o auditor se perca, o dashboard utiliza o conceito de **Memória de Trabalho Externa**:
*   O **InsightsPanel** mantém uma lista persistente de anomalias que o analista não precisa memorizar enquanto assiste ao vídeo.
*   A **Sincronia Temporal** atua como um "ponteiro de atenção", movendo o foco do analista para o painel lateral exatamente quando algo relevante ocorre no vídeo.

## 5. Referências Teóricas
*   **Don Norman (2013):** *The Design of Everyday Things* (Conceito de Affordances e Signifiers na UI).
*   **Edward Tufte (2001):** *The Visual Display of Quantitative Information* (Maximização do Data-Ink Ratio).
