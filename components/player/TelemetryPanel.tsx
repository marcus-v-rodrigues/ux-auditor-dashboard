import { ScrollArea } from "@/components/ui/scroll-area";
import { TelemetryLog } from "@/types/dashboard";
import { Activity } from "lucide-react";

/**
 * Interface de props para o componente TelemetryPanel
 * @property logs - Array completo de logs de telemetria da sessão
 * @property currentTime - Tempo atual da reprodução em milissegundos
 */
interface Props {
  logs: TelemetryLog[];
  currentTime: number;
}

/**
 * Painel lateral que exibe logs de telemetria de entrada humana (HID - Human Interface Devices).
 *
 * Funcionalidades:
 * - Exibe eventos de interação do usuário (cliques, digitação, movimentos)
 * - Filtra logs baseados no tempo atual de reprodução
 * - Mostra logs em ordem cronológica inversa (mais recentes no topo)
 * - Formatação monoespaçada para fácil leitura de dados técnicos
 * - Animações de entrada para novos logs
 *
 * @param logs - Lista completa de logs de telemetria
 * @param currentTime - Tempo atual em milissegundos
 */
export function TelemetryPanel({ logs, currentTime }: Props) {
  /**
   * Filtra logs que ocorreram até o tempo atual de reprodução.
   * Isso garante que apenas eventos relevantes para o momento
   * atual da sessão sejam exibidos.
   */
  const pastLogs = logs.filter(l => l.timestamp <= currentTime);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Cabeçalho do painel de telemetria */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          Telemetria (HID)
        </h2>
      </div>
      
      {/* Área de scroll com lista de logs */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {/* Renderiza logs em ordem inversa (mais recentes primeiro) */}
          {pastLogs.slice().reverse().map((log) => (
            <div
              key={log.id}
              className="text-[10px] md:text-xs font-mono p-2 rounded bg-slate-800/40 border-l-2 border-blue-500/50 animate-in fade-in slide-in-from-left-1"
            >
              {/* Timestamp formatado com padding para alinhamento */}
              <span className="text-slate-500 mr-2">
                [{String(log.timestamp).padStart(4, '0')}ms]
              </span>
              
              {/* Tipo do evento (click, input, scroll, etc.) */}
              <span className="text-slate-200 font-semibold">{log.eventType}</span>
              
              {/* Detalhes adicionais do evento */}
              <div className="text-slate-400 truncate mt-0.5">
                {log.details}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}