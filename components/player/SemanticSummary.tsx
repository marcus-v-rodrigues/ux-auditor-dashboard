import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Brain } from "lucide-react";

/**
 * Interface para os dados psicométricos do resumo semântico
 * Contém scores de frustração e carga cognitiva em escala 0-10
 */
interface PsychometricsSummary {
  /** Score de frustração (0-10) */
  frustration_score: number;
  /** Score de carga cognitiva (0-10) */
  cognitive_load_score: number;
}

/**
 * Interface de props para o componente SemanticSummary
 * @property narrative - Texto narrativo gerado pela IA sobre a sessão
 * @property psychometrics - Objeto contendo os scores psicométricos
 */
interface SemanticSummaryProps {
  narrative: string;
  psychometrics: PsychometricsSummary;
}

/**
 * Função auxiliar para determinar a cor do indicador de progresso
 * baseada no valor do score.
 * 
 * Regras de cores:
 * - Verde: score < 3 (baixo)
 * - Amarelo: score entre 4 e 7 (médio)
 * - Vermelho: score > 8 (alto)
 * 
 * @param score - Valor do score (0-10)
 * @returns String com as classes CSS apropriadas para o indicador
 */
function getProgressColor(score: number): string {
  if (score < 3) {
    // Verde para scores baixos - indica boa experiência
    return "bg-green-500";
  } else if (score >= 4 && score <= 7) {
    // Amarelo para scores médios - atenção necessária
    return "bg-yellow-500";
  } else if (score > 8) {
    // Vermelho para scores altos - problema crítico
    return "bg-red-500";
  }
  // Caso intermediário (score entre 3 e 4, ou entre 7 e 8)
  return "bg-yellow-500";
}

/**
 * Função auxiliar para determinar a cor do texto do badge
 * seguindo a mesma lógica das barras de progresso.
 * 
 * @param score - Valor do score (0-10)
 * @returns String com as classes CSS apropriadas para o texto
 */
function getTextColor(score: number): string {
  if (score < 3) {
    return "text-green-400";
  } else if (score >= 4 && score <= 7) {
    return "text-yellow-400";
  } else if (score > 8) {
    return "text-red-400";
  }
  return "text-yellow-400";
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
  } else if (score >= 4 && score <= 7) {
    return "Médio";
  } else if (score > 8) {
    return "Alto";
  }
  return "Médio";
}

/**
 * Componente de resumo semântico executivo.
 * 
 * Apresenta uma visão consolidada da sessão de UX com:
 * - Narrativa em itálico como resumo da sessão
 * - Barras de progresso para scores psicométricos
 * - Cores dinâmicas baseadas nos valores dos scores
 * 
 * Layout executivo otimizado para tomadas de decisão rápidas.
 * 
 * @param narrative - Texto narrativo da sessão
 * @param psychometrics - Dados psicométricos com scores de frustração e carga cognitiva
 */
export function SemanticSummary({ narrative, psychometrics }: SemanticSummaryProps) {
  // Calcula valores percentuais para as barras de progresso (escala 0-10 para 0-100%)
  const frustrationPercent = (psychometrics.frustration_score / 10) * 100;
  const cognitiveLoadPercent = (psychometrics.cognitive_load_score / 10) * 100;

  return (
    <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50">
      {/* Cabeçalho do card com ícone e título */}
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-400" />
          Resumo Executivo
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Seção de narrativa - exibida em itálico como resumo da sessão */}
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
          <p className="text-sm text-slate-200 italic leading-relaxed">
            &ldquo;{narrative}&rdquo;
          </p>
        </div>

        {/* Seção de métricas psicométricas */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Brain className="w-3.5 h-3.5" />
            Métricas Psicométricas
          </h4>

          {/* Barra de progresso para Frustração */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Frustração</span>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`text-[10px] h-5 ${getTextColor(psychometrics.frustration_score)} border-current/30`}
                >
                  {getScoreLabel(psychometrics.frustration_score)}
                </Badge>
                <span className={`text-xs font-mono ${getTextColor(psychometrics.frustration_score)}`}>
                  {psychometrics.frustration_score.toFixed(1)}/10
                </span>
              </div>
            </div>
            {/* Container da barra com indicador de cor dinâmica */}
            <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${getProgressColor(psychometrics.frustration_score)}`}
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
                  className={`text-[10px] h-5 ${getTextColor(psychometrics.cognitive_load_score)} border-current/30`}
                >
                  {getScoreLabel(psychometrics.cognitive_load_score)}
                </Badge>
                <span className={`text-xs font-mono ${getTextColor(psychometrics.cognitive_load_score)}`}>
                  {psychometrics.cognitive_load_score.toFixed(1)}/10
                </span>
              </div>
            </div>
            {/* Container da barra com indicador de cor dinâmica */}
            <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${getProgressColor(psychometrics.cognitive_load_score)}`}
                style={{ width: `${cognitiveLoadPercent}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
