import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InsightEvent } from "@/types/dashboard";
import { Eye, AlertTriangle, CheckCircle2 } from "lucide-react";

/**
 * Interface de props para o componente InsightsPanel
 * @property insights - Array completo de insights/anomalias detectadas pela IA
 * @property currentTime - Tempo atual da reprodução em milissegundos
 */
interface Props {
  insights: InsightEvent[];
  currentTime: number;
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
 *
 * @param insights - Lista de todos os insights detectados
 * @param currentTime - Tempo atual em milissegundos
 */
export function InsightsPanel({ insights, currentTime }: Props) {
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
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800">
      {/* Cabeçalho do painel */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Eye className="w-4 h-4 text-purple-500" />
          Diagnóstico AI
        </h2>
      </div>
      
      {/* Área de scroll com lista de insights */}
      <ScrollArea className="flex-1 p-4">
        {/* Estado vazio: nenhum insight ativo no momento */}
        {activeInsights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-600 space-y-2">
            <CheckCircle2 className="w-8 h-8 opacity-20" />
            <p className="text-xs">Nenhuma anomalia no momento.</p>
          </div>
        ) : (
          /* Lista de insights ativos */
          <div className="space-y-3">
            {activeInsights.map((insight) => (
              <Card key={insight.id} className={`bg-slate-800 border-0 border-l-4 ${
                // Indicador visual de severidade na borda esquerda
                insight.severity === 'critical' ? 'border-l-red-500' : 'border-l-yellow-500'
              }`}>
                <CardHeader className="p-3 pb-1">
                  <div className="flex justify-between items-center mb-1">
                    {/* Badge com tipo do insight e cor baseada na severidade */}
                    <Badge variant="outline" className={`text-[10px] h-5 ${
                         insight.severity === 'critical' ? 'text-red-400 border-red-900 bg-red-900/20' : 'text-yellow-400 border-yellow-900 bg-yellow-900/20'
                    }`}>
                      {insight.type}
                    </Badge>
                    {/* Timestamp do insight */}
                    <span className="text-[10px] text-slate-500 font-mono">{insight.timestamp}ms</span>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  {/* Descrição detalhada do insight */}
                  <p className="text-xs text-slate-200 leading-relaxed">{insight.message}</p>
                  
                  {/* Indicador de ação requerida para insights críticos */}
                  {insight.severity === 'critical' && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-red-400 font-bold uppercase tracking-wide">
                      <AlertTriangle className="w-3 h-3" /> Ação Requerida
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}