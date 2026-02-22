import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InsightEvent, PsychometricData, IntentAnalysis } from "@/types/dashboard";
import { Eye, AlertTriangle, CheckCircle2, Brain, Target, BarChart3 } from "lucide-react";
import { SemanticSummary } from "./SemanticSummary";
import { SemanticDiagnostics } from "./SemanticDiagnostics";

/**
 * Interface de props para o componente InsightsPanel
 * @property insights - Array completo de insights/anomalias detectadas pela IA
 * @property currentTime - Tempo atual da reprodução em milissegundos
 * @property psychometrics - Dados psicométricos extraídos durante a análise (opcional)
 * @property intentAnalysis - Análise de intenção do usuário (opcional)
 * @property narrative - Texto narrativo gerado pela IA sobre a sessão (opcional)
 */
interface Props {
  insights: InsightEvent[];
  currentTime: number;
  psychometrics?: PsychometricData | null;
  intentAnalysis?: IntentAnalysis | null;
  narrative?: string | null;
}

/**
 * Painel lateral que exibe insights e anomalias detectadas pela IA durante a sessão.
 *
 * Funcionalidades:
 * - Filtra insights baseados no tempo atual de reprodução (janela de 1.5s)
 * - Exibe apenas insights relevantes para o momento atual
 * - Classificação por severidade (crítico/aviso)
 * - Visualização de bounding boxes no player quando aplicável
 * - Feedback visual de estado (vazio ou com anomalias)
 * - Exibição de dados psicométricos e análise de intenção
 * - Resumo semântico executivo com narrativa da sessão
 *
 * @param insights - Lista de todos os insights detectados
 * @param currentTime - Tempo atual em milissegundos
 * @param psychometrics - Dados psicométricos extraídos (opcional)
 * @param intentAnalysis - Análise de intenção do usuário (opcional)
 * @param narrative - Texto narrativo gerado pela IA sobre a sessão (opcional)
 */
export function InsightsPanel({ insights, currentTime, psychometrics, intentAnalysis, narrative }: Props) {
  /**
   * Filtra insights ativos baseando-se no tempo atual de reprodução.
   * Considera um insight como "ativo" se estiver dentro de uma janela
   * de ±1.5 segundos do tempo atual, proporcionando uma experiência
   * visual mais fluida e contextual.
   */
  const activeInsights = insights.filter(
    (i) => Math.abs(i.timestamp - currentTime) < 1500
  );

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Cabeçalho do painel */}
      <div className="p-4 border-b border-border bg-card/50">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Eye className="w-4 h-4 text-purple-500" />
          AI Diagnostics
        </h2>
      </div>
      
      {/* Área de scroll com lista de insights e dados processados */}
      <ScrollArea className="flex-1 p-4">
        {/* Diagnóstico Semântico Executivo - Resumo da IA no topo do painel */}
        {narrative && psychometrics && intentAnalysis && (
          <div className="mb-4">
            <SemanticDiagnostics
              narrative={narrative}
              psychometrics={psychometrics}
              intent_analysis={intentAnalysis}
            />
          </div>
        )}

        {/* Seção de Dados Psicométricos - Exibida quando disponível */}
        {psychometrics && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4" />
              Psicometria
            </h3>
            <div className="space-y-2">
              {/* Barra de engajamento */}
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">Engajamento</span>
                  <span className="text-green-400">{psychometrics.engagement_score}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${psychometrics.engagement_score}%` }}
                  />
                </div>
              </div>
              {/* Barra de frustração */}
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">Frustração</span>
                  <span className="text-red-400">{psychometrics.frustration_score}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{ width: `${psychometrics.frustration_score}%` }}
                  />
                </div>
              </div>
              {/* Barra de confusão */}
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">Confusão</span>
                  <span className="text-yellow-400">{psychometrics.confusion_score}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 rounded-full transition-all"
                    style={{ width: `${psychometrics.confusion_score}%` }}
                  />
                </div>
              </div>
              {/* Padrões de comportamento */}
              {psychometrics.behavior_patterns.length > 0 && (
                <div className="mt-2 pt-2 border-t border-blue-500/20">
                  <p className="text-[10px] text-muted-foreground mb-1">Padrões:</p>
                  <div className="flex flex-wrap gap-1">
                    {psychometrics.behavior_patterns.map((pattern, idx) => (
                      <Badge key={idx} variant="outline" className="text-[9px] h-4 bg-blue-500/10 border-blue-500/30 text-blue-300">
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Seção de Análise de Intenção - Exibida quando disponível */}
        {intentAnalysis && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 mb-3">
              <Target className="w-4 h-4" />
              Intenção do Usuário
            </h3>
            {/* Intenção principal */}
            <div className="mb-2">
              <p className="text-[10px] text-muted-foreground mb-1">Intenção Principal:</p>
              <p className="text-xs text-foreground font-medium">{intentAnalysis.primary_intent}</p>
            </div>
            {/* Intenções secundárias */}
            {intentAnalysis.secondary_intents.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] text-muted-foreground mb-1">Intenções Secundárias:</p>
                <div className="flex flex-wrap gap-1">
                  {intentAnalysis.secondary_intents.map((intent, idx) => (
                    <Badge key={idx} variant="outline" className="text-[9px] h-4 bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
                      {intent}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {/* Probabilidade de sucesso */}
            <div className="mb-2">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-muted-foreground">Prob. de Sucesso</span>
                <span className="text-emerald-400">{intentAnalysis.success_probability}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${intentAnalysis.success_probability}%` }}
                />
              </div>
            </div>
            {/* Barreiras identificadas */}
            {intentAnalysis.barriers.length > 0 && (
              <div className="mt-2 pt-2 border-t border-emerald-500/20">
                <p className="text-[10px] text-muted-foreground mb-1">Barreiras:</p>
                <ul className="text-[10px] text-red-300 space-y-1">
                  {intentAnalysis.barriers.map((barrier, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                      {barrier}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Seção de Insights/Anomalias */}
        <div className="mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-orange-500" />
            Anomalias Detectadas
          </h3>
        </div>
        
        {/* Estado vazio: nenhum insight ativo no momento */}
        {activeInsights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground space-y-2">
            <CheckCircle2 className="w-8 h-8 opacity-20" />
            <p className="text-xs">No anomalies at the moment.</p>
          </div>
        ) : (
          /* Lista de insights ativos */
          <div className="space-y-3">
            {activeInsights.map((insight) => (
              <Card key={insight.id} className={`bg-secondary border-0 border-l-4 ${
                // Indicador visual de severidade na borda esquerda
                insight.severity === 'critical' ? 'border-l-destructive' : 'border-l-yellow-500'
              }`}>
                <CardHeader className="p-3 pb-1">
                  <div className="flex justify-between items-center mb-1">
                    {/* Badge com tipo do insight e cor baseada na severidade */}
                    <Badge variant="outline" className={`text-[10px] h-5 ${
                         insight.severity === 'critical' ? 'text-destructive border-destructive/50 bg-destructive/10' : 'text-yellow-400 border-yellow-900 bg-yellow-900/20'
                    }`}>
                      {insight.type}
                    </Badge>
                    {/* Timestamp do insight */}
                    <span className="text-[10px] text-muted-foreground font-mono">{insight.timestamp}ms</span>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  {/* Descrição detalhada do insight */}
                  <p className="text-xs text-foreground leading-relaxed">{insight.message}</p>
                  
                  {/* Indicador de ação requerida para insights críticos */}
                  {insight.severity === 'critical' && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-destructive font-bold uppercase tracking-wide">
                      <AlertTriangle className="w-3 h-3" /> Ação Requerida
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Seção de Resumo Semântico - Exibida na parte inferior quando narrativa está disponível */}
        {narrative && psychometrics && (
          <div className="mt-6 pt-4 border-t border-border">
            <SemanticSummary
              narrative={narrative}
              psychometrics={{
                frustration_score: psychometrics.frustration_score / 10, // Converte de 0-100 para 0-10
                cognitive_load_score: psychometrics.confusion_score / 10, // Usa confusion como proxy para carga cognitiva
              }}
            />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}