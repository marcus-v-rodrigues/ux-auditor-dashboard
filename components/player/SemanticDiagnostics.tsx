import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PsychometricData, IntentAnalysis } from "@/types/dashboard";
import { Quote, Brain, Activity, TrendingUp, RefreshCw, AlertCircle } from "lucide-react";

/**
 * Tipo para o status da jornada do usuário
 * - progressing: usuário está progredindo normalmente na tarefa
 * - looping: usuário está preso em um loop de ações repetitivas
 * - erratic: comportamento errático, sem direção clara
 */
type JourneyStatus = 'progressing' | 'looping' | 'erratic';

/**
 * Interface de props para o componente SemanticDiagnostics
 * @property narrative - Texto narrativo gerado pela IA sobre a sessão
 * @property psychometrics - Dados psicométricos extraídos durante a análise
 * @property intent_analysis - Análise de intenção do usuário
 */
interface SemanticDiagnosticsProps {
  narrative: string;
  psychometrics: PsychometricData;
  intent_analysis: IntentAnalysis;
}

/**
 * Função auxiliar para determinar o status da jornada do usuário
 * baseada nos dados psicométricos e análise de intenção.
 * 
 * Lógica de determinação:
 * - looping: alta frustração (>70%) com baixa probabilidade de sucesso (<30%)
 * - erratic: alta confusão (>70%) e múltiplas barreiras
 * - progressing: casos restantes (comportamento normal)
 * 
 * @param psychometrics - Dados psicométricos do usuário
 * @param intentAnalysis - Análise de intenção do usuário
 * @returns Status da jornada determinado
 */
function determineJourneyStatus(
  psychometrics: PsychometricData, 
  intentAnalysis: IntentAnalysis
): JourneyStatus {
  // Verifica se o usuário está em loop (alta frustração + baixa probabilidade de sucesso)
  if (psychometrics.frustration_score > 70 && intentAnalysis.success_probability < 30) {
    return 'looping';
  }
  
  // Verifica comportamento errático (alta confusão + múltiplas barreiras)
  if (psychometrics.confusion_score > 70 && intentAnalysis.barriers.length >= 2) {
    return 'erratic';
  }
  
  // Caso padrão: usuário está progredindo
  return 'progressing';
}

/**
 * Função auxiliar para obter as configurações visuais do badge de status
 * 
 * @param status - Status da jornada do usuário
 * @returns Objeto com classes CSS, ícone e texto do badge
 */
function getJourneyStatusConfig(status: JourneyStatus): {
  className: string;
  icon: React.ReactNode;
  label: string;
} {
  switch (status) {
    case 'progressing':
      return {
        className: 'bg-green-500/20 text-green-400 border-green-500/50',
        icon: <TrendingUp className="w-3 h-3" />,
        label: 'Progredindo'
      };
    case 'looping':
      return {
        className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
        icon: <RefreshCw className="w-3 h-3" />,
        label: 'Em Loop'
      };
    case 'erratic':
      return {
        className: 'bg-red-500/20 text-red-400 border-red-500/50',
        icon: <AlertCircle className="w-3 h-3" />,
        label: 'Errático'
      };
  }
}

/**
 * Função auxiliar para determinar a cor do indicador de progresso
 * baseada no valor do score (escala 0-10).
 * 
 * Regras de cores:
 * - Verde: score < 3 (baixo - boa experiência)
 * - Amarelo: score entre 3 e 7 (médio - atenção necessária)
 * - Vermelho: score > 7 (alto - problema crítico)
 * 
 * @param score - Valor do score (0-10)
 * @returns String com as classes CSS apropriadas para o indicador
 */
function getProgressColor(score: number): string {
  if (score < 3) {
    // Verde para scores baixos - indica boa experiência
    return "bg-green-500";
  } else if (score <= 7) {
    // Amarelo para scores médios - atenção necessária
    return "bg-yellow-500";
  } else {
    // Vermelho para scores altos - problema crítico
    return "bg-red-500";
  }
}

/**
 * Função auxiliar para determinar a cor do texto do valor
 * seguindo a mesma lógica das barras de progresso.
 * 
 * @param score - Valor do score (0-10)
 * @returns String com as classes CSS apropriadas para o texto
 */
function getTextColor(score: number): string {
  if (score < 3) {
    return "text-green-400";
  } else if (score <= 7) {
    return "text-yellow-400";
  } else {
    return "text-red-400";
  }
}

/**
 * Função auxiliar para obter o rótulo descritivo do score
 * 
 * @param score - Valor do score (0-10)
 * @returns String com o rótulo descritivo
 */
function getScoreLabel(score: number): string {
  if (score < 3) {
    return "Baixo";
  } else if (score <= 7) {
    return "Médio";
  } else {
    return "Alto";
  }
}

/**
 * Componente de diagnóstico semântico executivo.
 * 
 * Apresenta uma visão consolidada da sessão de UX no topo do painel de insights:
 * - Narrativa em blockquote estilizado com borda lateral verde/roxo
 * - Barras de progresso para scores psicométricos (Frustração e Carga Cognitiva)
 * - Badges coloridos para status da jornada (progressing, looping, erratic)
 * 
 * Layout executivo otimizado para tomadas de decisão rápidas,
 * fornecendo resumo da IA antes dos detalhes técnicos.
 * 
 * @param narrative - Texto narrativo da sessão
 * @param psychometrics - Dados psicométricos completos
 * @param intent_analysis - Análise de intenção do usuário
 */
export function SemanticDiagnostics({ 
  narrative, 
  psychometrics, 
  intent_analysis 
}: SemanticDiagnosticsProps) {
  // Determina o status da jornada baseado nos dados
  const journeyStatus = determineJourneyStatus(psychometrics, intent_analysis);
  const statusConfig = getJourneyStatusConfig(journeyStatus);
  
  // Converte scores de 0-100 para escala 0-10
  const frustrationScore = psychometrics.frustration_score / 10;
  const cognitiveLoadScore = psychometrics.confusion_score / 10; // Usa confusion como proxy para carga cognitiva
  
  // Calcula valores percentuais para as barras de progresso
  const frustrationPercent = frustrationScore * 10;
  const cognitiveLoadPercent = cognitiveLoadScore * 10;

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-slate-700/50 shadow-lg">
      {/* Cabeçalho do card com título e status da jornada */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            Diagnóstico Semântico
          </CardTitle>
          
          {/* Badge de status da jornada */}
          <Badge 
            variant="outline" 
            className={`flex items-center gap-1.5 text-[10px] h-5 px-2 ${statusConfig.className}`}
          >
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Seção de narrativa - blockquote estilizado com borda lateral */}
        <div className="relative">
          {/* Borda lateral com gradiente verde/roxo (identidade visual) */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-purple-500 rounded-full" />
          
          {/* Conteúdo do blockquote */}
          <blockquote className="pl-4 pr-2 py-2 bg-slate-800/40 rounded-r-lg border border-slate-700/30 border-l-0">
            <div className="flex items-start gap-2">
              <Quote className="w-4 h-4 text-purple-400/60 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-200 italic leading-relaxed">
                {narrative}
              </p>
            </div>
          </blockquote>
        </div>

        {/* Seção de métricas psicométricas */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Brain className="w-3.5 h-3.5" />
            Métricas de Experiência
          </h4>

          {/* Barra de progresso para Frustração */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Frustração</span>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`text-[10px] h-5 ${getTextColor(frustrationScore)} border-current/30`}
                >
                  {getScoreLabel(frustrationScore)}
                </Badge>
                <span className={`text-xs font-mono ${getTextColor(frustrationScore)}`}>
                  {frustrationScore.toFixed(1)}/10
                </span>
              </div>
            </div>
            {/* Container da barra com indicador de cor dinâmica */}
            <div className="relative h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${getProgressColor(frustrationScore)}`}
                style={{ width: `${frustrationPercent}%` }}
              />
            </div>
          </div>

          {/* Barra de progresso para Carga Cognitiva */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Carga Cognitiva</span>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`text-[10px] h-5 ${getTextColor(cognitiveLoadScore)} border-current/30`}
                >
                  {getScoreLabel(cognitiveLoadScore)}
                </Badge>
                <span className={`text-xs font-mono ${getTextColor(cognitiveLoadScore)}`}>
                  {cognitiveLoadScore.toFixed(1)}/10
                </span>
              </div>
            </div>
            {/* Container da barra com indicador de cor dinâmica */}
            <div className="relative h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${getProgressColor(cognitiveLoadScore)}`}
                style={{ width: `${cognitiveLoadPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Indicador adicional: intenção principal */}
        <div className="pt-2 border-t border-slate-700/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Intenção Principal</span>
            <span className="text-xs text-slate-300 font-medium">
              {intent_analysis.primary_intent}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Prob. de Sucesso</span>
            <span className={`text-xs font-mono ${
              intent_analysis.success_probability > 70 ? 'text-green-400' :
              intent_analysis.success_probability > 40 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {intent_analysis.success_probability}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
