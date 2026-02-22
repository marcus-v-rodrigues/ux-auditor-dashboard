'use client';

import { useState } from 'react';
import { TelemetryPanel } from '@/components/player/TelemetryPanel';
import { InsightsPanel } from '@/components/player/InsightsPanel';
import VideoPlayer from '@/components/player/VideoPlayer';
import { FileUploader } from '@/components/FileUploader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, FileJson, Sparkles, AlertCircle } from 'lucide-react';
import { InsightEvent, TelemetryLog, SessionProcessResponse, PsychometricData, IntentAnalysis } from '@/types/dashboard';
import { authenticatedPost } from '@/lib/authenticated-fetch';

/**
 * Página principal do Dashboard UX Auditor
 * 
 * Gerencia o fluxo completo de análise de sessões:
 * 1. Upload de arquivo de sessão rrweb
 * 2. Reprodução da gravação
 * 3. Disparo de análise de IA
 * 4. Exibição de insights e diagnósticos
 */
export default function DashboardPage() {
  // Estado do tempo atual de reprodução em milissegundos
  const [currentTime, setCurrentTime] = useState(0);
  // Estado dos eventos rrweb carregados do arquivo
  const [events, setEvents] = useState<any[]>([]);
  // Nome do arquivo/sessão exibido no header
  const [fileName, setFileName] = useState<string>("");
  // UUID da sessão retornado após upload bem-sucedido
  const [sessionUuid, setSessionUuid] = useState<string>("");

  // Dados auxiliares (telemetria/insights)
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [insights, setInsights] = useState<InsightEvent[]>([]);
  
  // Estados para dados processados pela IA
  // Narrativa gerada pela IA sobre a sessão
  const [narrative, setNarrative] = useState<string>("");
  // Dados psicométricos extraídos durante a análise
  const [psychometrics, setPsychometrics] = useState<PsychometricData | null>(null);
  // Análise de intenção do usuário
  const [intentAnalysis, setIntentAnalysis] = useState<IntentAnalysis | null>(null);

  // Estados de controle da análise de IA
  // Indica se o pipeline de análise está em execução
  const [isProcessing, setIsProcessing] = useState(false);
  // Mensagem de erro caso a análise falhe
  const [errorMessage, setErrorMessage] = useState<string>("");

  /**
   * Callback executado quando o arquivo é carregado com sucesso
   * Inicializa todos os estados necessários para a sessão
   * 
   * @param uploadedEvents - Array de eventos rrweb do arquivo
   * @param uuid - Identificador único da sessão retornado pelo backend
   */
  const handleFileLoaded = (uploadedEvents: any[], uuid: string) => {
    setEvents(uploadedEvents);
    setSessionUuid(uuid);
    setFileName(`Session: ${uuid.slice(0, 8)}...`);
    // Limpa estados de sessões anteriores
    setLogs([]);
    setInsights([]);
    setNarrative("");
    setPsychometrics(null);
    setIntentAnalysis(null);
    setErrorMessage("");
  };

  /**
   * Reseta completamente a sessão atual
   * Limpa todos os estados e volta para a tela de upload
   */
  const resetSession = () => {
    setEvents([]);
    setFileName("");
    setSessionUuid("");
    setCurrentTime(0);
    setInsights([]);
    setLogs([]);
    setNarrative("");
    setPsychometrics(null);
    setIntentAnalysis(null);
    setErrorMessage("");
    setIsProcessing(false);
  };

  /**
   * Dispara o pipeline de análise de IA no backend
   * 
   * Fluxo do pipeline no backend:
   * 1. Preprocessor - Pré-processa os eventos rrweb
   * 2. Isolation Forest - Detecta anomalias estatísticas
   * 3. Heurísticas - Aplica regras de UX pré-definidas
   * 4. LLM - Gera insights narrativos com IA (Hermes-405B)
   * 
   * Utiliza authenticatedPost para injetar automaticamente o token JWT do Janus
   * no cabeçalho Authorization, garantindo autenticação segura com o backend.
   * 
   * @throws Error se a sessão não estiver disponível ou a API falhar
   */
  const triggerAnalysis = async () => {
    // Verifica se existe uma sessão válida antes de prosseguir
    if (!sessionUuid) {
      setErrorMessage("Nenhuma sessão ativa para analisar. Faça o upload de um arquivo primeiro.");
      return;
    }

    // Limpa erros anteriores e inicia o estado de processamento
    setErrorMessage("");
    setIsProcessing(true);

    try {
      // Monta o endpoint de processamento
      const endpoint = `/sessions/${sessionUuid}/process`;

      // Usa authenticatedPost para fazer a requisição com token JWT do Janus
      // O helper injeta automaticamente o header Authorization: Bearer <token>
      const data: SessionProcessResponse = await authenticatedPost<SessionProcessResponse>(
        endpoint,
        {} // Corpo vazio - o backend usa o sessionUuid para identificar a sessão
      );

      // Mapeia a resposta para os estados reativos da aplicação
      // Isso garante que os painéis laterais reflitam os dados processados
      
      // Atualiza os insights detectados pelo pipeline
      if (data.insights && Array.isArray(data.insights)) {
        setInsights(data.insights);
      }

      // Atualiza a narrativa gerada pela IA
      if (data.narrative) {
        setNarrative(data.narrative);
      }

      // Atualiza os dados psicométricos extraídos
      if (data.psychometrics) {
        setPsychometrics(data.psychometrics);
      }

      // Atualiza a análise de intenção do usuário
      if (data.intent_analysis) {
        setIntentAnalysis(data.intent_analysis);
      }

      // Mapeia as ações do usuário para o estado de logs do TelemetryPanel
      if (data.stats?.user_actions && Array.isArray(data.stats.user_actions)) {
        setLogs(data.stats.user_actions);
      }

    } catch (error) {
      // Tratamento de erros robusto
      console.error("Erro durante a análise de IA:", error);
      
      // Define a mensagem de erro apropriada para exibição na UI
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else if (typeof error === 'string') {
        setErrorMessage(error);
      } else {
        setErrorMessage("Ocorreu um erro inesperado durante a análise. Por favor, tente novamente.");
      }
    } finally {
      // Garante que o estado de processamento seja finalizado
      setIsProcessing(false);
    }
  };

  // Filtra overlays ativos baseados no tempo atual de reprodução
  // Considera um overlay como ativo se estiver dentro de uma janela de 1 segundo
  const activeOverlays = insights.filter(
    (i) => Math.abs(i.timestamp - currentTime) < 1000 && i.boundingBox
  );

  // SE NÃO TIVER ARQUIVO CARREGADO -> MOSTRA TELA DE UPLOAD
  if (events.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-card">
           <h1 className="font-semibold text-lg text-foreground">UX Auditor</h1>
        </header>
        <FileUploader onFileLoaded={handleFileLoaded} />
      </div>
    );
  }

  // SE TIVER ARQUIVO -> MOSTRA PLAYER COM PAINÉIS
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      
      {/* Lado Esquerdo - Painel de Telemetria */}
      <aside className="w-[280px] hidden md:block z-20 shadow-xl border-r border-border">
        {/* Exibe Skeleton durante o processamento da IA para evitar interface "congelada" */}
        {isProcessing && logs.length === 0 ? (
          <div className="flex flex-col h-full bg-card border-r border-border">
            <div className="p-4 border-b border-border bg-card/50">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex-1 p-2 space-y-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <TelemetryPanel logs={logs} currentTime={currentTime} />
        )}
      </aside>

      {/* Centro (Palco Principal) */}
      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="h-14 border-b border-border flex items-center px-4 bg-card justify-between shrink-0">
           <div className="flex items-center gap-3">
             {/* Botão de voltar para a tela de upload */}
             <Button variant="ghost" size="icon" onClick={resetSession} className="text-muted-foreground hover:text-foreground">
               <ArrowLeft className="h-5 w-5" />
             </Button>
             <div>
               <h1 className="text-sm font-semibold text-foreground flex items-center gap-2">
                 <FileJson className="h-4 w-4 text-primary"/>
                 {fileName}
               </h1>
             </div>
           </div>
           
           {/* Botão de Iniciar Auditoria de IA - Renderizado condicionalmente */}
           {sessionUuid && (
             <Button
               onClick={triggerAnalysis}
               disabled={isProcessing}
               className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
             >
               {isProcessing ? (
                 <>
                   {/* Ícone de carregamento animado durante o processamento */}
                   <Sparkles className="h-4 w-4 animate-spin" />
                   Processando com IA...
                 </>
               ) : (
                 <>
                   <Sparkles className="h-4 w-4" />
                   Iniciar Auditoria de IA
                 </>
               )}
             </Button>
           )}
        </header>

        {/* Exibição de erro caso a análise falhe */}
        {errorMessage && (
          <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Indicador de narrativa gerada pela IA */}
        {narrative && !isProcessing && (
          <div className="mx-4 mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-md">
            <p className="text-xs text-purple-300 font-medium mb-1">Análise da IA:</p>
            <p className="text-sm text-foreground">{narrative}</p>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden min-h-0">  
          {/* Wrapper do Player: Força o player a ficar contido neste espaço */}
          <div className="flex-1 w-full h-full relative flex items-center justify-center min-h-0">
              <VideoPlayer 
                events={events}
                currentTime={currentTime}
                overlays={activeOverlays}
                onTimeUpdate={setCurrentTime}
              />
          </div>
          {/* Timeline Visual (Só aparece se tiver insights gerados) */}
          {insights.length > 0 && (
            <div className="w-full max-w-5xl mt-8 px-1">
               <div className="h-12 w-full bg-card border border-border rounded relative overflow-hidden">
                  {/* Barra de progresso da reprodução */}
                  <div 
                    className="absolute top-0 bottom-0 border-r border-primary bg-primary/5 transition-all duration-100 ease-linear"
                    style={{ width: `${(currentTime / (events[events.length-1]?.timestamp - events[0]?.timestamp)) * 100}%` }} 
                  />
                  {/* Marcadores de insights na timeline */}
                  {insights.map(i => (
                    <div 
                      key={i.id}
                      className={`absolute bottom-0 h-2 w-2 rounded-full mb-2 ml-[-4px] ${
                        i.severity === 'critical' ? 'bg-destructive' : 'bg-yellow-500'
                      }`}
                      style={{ left: `${(i.timestamp / 5000) * 100}%` }} // Nota: Cálculo de tempo precisa ser normalizado com o total do vídeo real
                    />
                  ))}
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Lado Direito - Painel de Insights */}
      <aside className="w-[300px] hidden lg:block z-20 shadow-xl border-l border-border">
        {/* Exibe Skeleton durante o processamento da IA para evitar interface "congelada" */}
        {isProcessing && insights.length === 0 ? (
          <div className="flex flex-col h-full bg-card border-l border-border">
            <div className="p-4 border-b border-border bg-card/50">
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex-1 p-4 space-y-4">
              {/* Skeleton para seção de Psicometria */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-md">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-2 w-full mb-2" />
                <Skeleton className="h-2 w-full mb-2" />
                <Skeleton className="h-2 w-full" />
              </div>
              {/* Skeleton para seção de Intenção */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
                <Skeleton className="h-4 w-28 mb-3" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-2 w-3/4" />
              </div>
              {/* Skeleton para lista de anomalias */}
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <InsightsPanel 
            insights={insights} 
            currentTime={currentTime}
            psychometrics={psychometrics}
            intentAnalysis={intentAnalysis}
            narrative={narrative}
          />
        )}
      </aside>

    </div>
  );
}