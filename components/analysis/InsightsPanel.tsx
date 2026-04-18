import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  InsightEvent,
  ProcessingStatus,
  SessionProcessResponse,
} from "@/types/dashboard";
import { safeNumber, safeString } from "@/lib/normalization";
import { AlertTriangle, BarChart3, Clock3 } from "lucide-react";
import { SemanticDiagnostics } from "./SemanticDiagnostics";
import { JsonDataCard } from "./JsonDataCard";

interface Props {
  result?: SessionProcessResponse | null;
  currentTime: number;
  processingStatus: ProcessingStatus;
  processingError?: string | null;
  onReprocess?: () => void;
}

function formatInsightLabel(insight: InsightEvent): string {
  const severity = safeString(insight.severity, "medium");
  if (severity === "critical") {
    return "Crítico";
  }
  if (severity === "low") {
    return "Baixo";
  }
  return "Médio";
}

function statusMessage(status: ProcessingStatus): string {
  switch (status) {
    case "uploading":
      return "Sessão em envio.";
    case "queued":
      return "Sessão recebida. Aguardando worker.";
    case "processing":
      return "Worker em execução. Processando sessão.";
    case "completed":
      return "Análise concluída.";
    case "failed":
      return "Falha no processamento ou timeout de polling.";
    default:
      return "Aguardando o próximo upload.";
  }
}

function statusBadgeClass(status: ProcessingStatus): string {
  switch (status) {
    case "completed":
      return "app-status-success";
    case "failed":
      return "app-status-error";
    case "processing":
    case "uploading":
      return "app-status-processing";
    case "queued":
      return "app-status-queued";
    default:
      return "app-status-neutral";
  }
}

function renderSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="border-border/70 bg-card/80 shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-72" />
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-52 w-full rounded-xl" />
      <Skeleton className="h-52 w-full rounded-xl" />
    </div>
  );
}

export function InsightsPanel({
  result,
  currentTime,
  processingStatus,
  processingError,
  onReprocess,
}: Props) {
  const insights = result?.insights ?? [];
  const activeInsights = insights.filter((insight) => Math.abs(insight.timestamp - currentTime) < 1000);
  const hasInsights = insights.length > 0;
  const hasActiveInsights = activeInsights.length > 0;
  const processingMessage = statusMessage(processingStatus);
  const totalInsights = safeNumber(insights.length, 0);
  const semanticBundle = result?.semantic_bundle;
  const llmOutput = result?.llm_output;

  return (
    <div className="app-panel-muted flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-2xl">
      <div className="app-divider border-b px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="app-heading flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
              <BarChart3 className="app-icon-accent h-4 w-4" />
              Resultados
            </h2>
            <p className="app-text-soft mt-1 text-xs">
              Sessão sincronizada com o replay e organizada pelo contrato real da API.
            </p>
          </div>
          <Badge variant="outline" className={`h-6 px-2 text-[10px] ${statusBadgeClass(processingStatus)}`}>
            {processingMessage}
          </Badge>
        </div>
        <div className="app-text-soft mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="app-chip rounded-full px-2 py-0.5">{processingMessage}</span>
          <span className="app-chip rounded-full px-2 py-0.5">
            {totalInsights} insights
          </span>
          <span className="app-chip rounded-full px-2 py-0.5">
            t={currentTime}ms
          </span>
        </div>
        {processingError && (
          <div className="app-callout-error mt-3 rounded-xl px-3 py-2 text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium">Falha de processamento</p>
                <p className="mt-1 opacity-80">{processingError}</p>
                {onReprocess && (
                  <button
                    type="button"
                    onClick={onReprocess}
                    className="mt-2 inline-flex items-center gap-2 rounded-md border border-current/30 px-2.5 py-1 text-[10px] font-medium transition-colors hover:app-hover-surface"
                  >
                    Reprocessar sessão
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
          {processingStatus === "queued" || processingStatus === "processing" ? (
            renderSkeleton()
          ) : (
            <>
              <SemanticDiagnostics result={result} />

                <Card className="w-full min-w-0 border-border/70 bg-card/80 shadow-sm">
                <CardHeader className="border-b border-border/60 pb-4">
                  <CardTitle className="app-heading flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
                    <Clock3 className="app-icon-accent h-4 w-4" />
                    Insights temporais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {!hasInsights ? (
                    <div className="rounded-xl border border-dashed border-border/60 bg-background/30 p-4 text-sm text-muted-foreground">
                      Nenhum insight foi retornado pela API.
                    </div>
                  ) : !hasActiveInsights ? (
                    <div className="rounded-xl border border-dashed border-border/60 bg-background/30 p-4 text-sm text-muted-foreground">
                      Há insights disponíveis, mas nenhum está alinhado com o tempo atual do replay.
                    </div>
                  ) : (
                    activeInsights.map((insight) => (
                      <div
                        key={insight.id}
                        className="rounded-xl border border-border/60 bg-background/60 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {insight.type}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                insight.severity === "critical"
                                  ? "app-status-error"
                                  : "app-status-processing"
                              }`}
                            >
                              {formatInsightLabel(insight)}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{insight.timestamp}ms</span>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-foreground">{insight.message}</p>
                        {insight.boundingBox && (
                          <div className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                            overlay disponível para sincronização visual
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <div className="grid min-w-0 gap-4 xl:grid-cols-2">
                {semanticBundle ? (
                  <JsonDataCard
                    title="Semantic bundle"
                    filename="semantic-bundle.json"
                    value={semanticBundle}
                  />
                ) : null}

                {llmOutput ? (
                  <JsonDataCard
                    title="Saída bruta do LLM"
                    filename="llm-output.json"
                    value={llmOutput}
                  />
                ) : null}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </div>
  );
}
