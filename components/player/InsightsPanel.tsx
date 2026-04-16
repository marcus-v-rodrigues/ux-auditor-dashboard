import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  InsightEvent,
  ProcessingStatus,
  SessionProcessResponse,
} from "@/types/dashboard";
import { safeNumber, safeString } from "@/lib/normalization";
import { AlertTriangle, BarChart3, Clock3, FileText, Layers3 } from "lucide-react";
import { SemanticSummary } from "./SemanticSummary";
import { SemanticDiagnostics } from "./SemanticDiagnostics";

interface Props {
  result?: SessionProcessResponse | null;
  currentTime: number;
  processingStatus: ProcessingStatus;
  processingError?: string | null;
  onRetryStatus?: () => void;
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
      return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
    case "failed":
      return "bg-red-500/15 text-red-200 border-red-500/30";
    case "processing":
    case "uploading":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "queued":
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  }
}

function describeValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 4).map((item) => describeValue(item)).filter(Boolean).join(" • ");
  }

  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[objeto complexo]";
    }
  }

  return "";
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
  onRetryStatus,
}: Props) {
  const insights = result?.insights ?? [];
  const activeInsights = insights.filter((insight) => Math.abs(insight.timestamp - currentTime) < 1000);
  const hasInsights = insights.length > 0;
  const hasActiveInsights = activeInsights.length > 0;
  const processingMessage = statusMessage(processingStatus);
  const totalInsights = safeNumber(insights.length, 0);
  const structuredAnalysis = result?.structured_analysis;
  const semanticBundle = result?.semantic_bundle;
  const llmOutput = result?.llm_output;

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-slate-950/30 backdrop-blur">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
              <BarChart3 className="h-4 w-4 text-sky-300" />
              Resultados
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Sessão sincronizada com o replay e organizada pelo contrato real da API.
            </p>
          </div>
          <Badge variant="outline" className={`h-6 px-2 text-[10px] ${statusBadgeClass(processingStatus)}`}>
            {processingStatus}
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="rounded-full border border-white/10 px-2 py-0.5">{processingMessage}</span>
          <span className="rounded-full border border-white/10 px-2 py-0.5">
            {totalInsights} insights
          </span>
          <span className="rounded-full border border-white/10 px-2 py-0.5">
            t={currentTime}ms
          </span>
        </div>
        {processingError && (
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium">Falha de processamento</p>
                <p className="mt-1 text-red-100/80">{processingError}</p>
                {onRetryStatus && (
                  <button
                    type="button"
                    onClick={onRetryStatus}
                    className="mt-2 inline-flex items-center gap-2 rounded-md border border-red-500/30 px-2.5 py-1 text-[10px] font-medium text-red-100 transition-colors hover:bg-red-500/10"
                  >
                    Reconsultar status
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="min-h-0 min-w-0 w-full flex-1">
        <div className="min-w-0 w-full space-y-4 p-5">
          {processingStatus === "queued" || processingStatus === "processing" ? (
            renderSkeleton()
          ) : (
            <>
              <SemanticSummary
                result={result}
                status={processingStatus}
                processingError={processingError}
                onRetryStatus={onRetryStatus}
              />

              <SemanticDiagnostics result={result} />

              <Card className="w-full min-w-0 border-border/70 bg-card/80 shadow-sm">
                <CardHeader className="border-b border-border/60 pb-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
                    <Clock3 className="h-4 w-4 text-sky-400" />
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
                                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                                  : "border-amber-500/30 bg-amber-500/10 text-amber-200"
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

              {structuredAnalysis ? (
                <Card className="w-full min-w-0 border-border/70 bg-card/80 shadow-sm">
                  <CardHeader className="border-b border-border/60 pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
                      <Layers3 className="h-4 w-4 text-sky-400" />
                      Estrutura analítica rica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    {Object.entries(structuredAnalysis).slice(0, 6).map(([key, value]) => (
                      <div key={key} className="rounded-xl border border-border/60 bg-background/60 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">{key}</p>
                        <p className="mt-1 text-sm text-white">{describeValue(value) || "Indisponível"}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}

              {semanticBundle ? (
                <Card className="w-full min-w-0 border-border/70 bg-card/80 shadow-sm">
                  <CardHeader className="border-b border-border/60 pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
                      <FileText className="h-4 w-4 text-sky-400" />
                      Semantic bundle
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <pre className="w-full max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded-xl border border-border/60 bg-background/70 p-3 text-[11px] leading-relaxed text-slate-200">
                      {JSON.stringify(semanticBundle, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ) : null}

              {llmOutput ? (
                <Card className="w-full min-w-0 border-border/70 bg-card/80 shadow-sm">
                  <CardHeader className="border-b border-border/60 pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
                      <FileText className="h-4 w-4 text-sky-400" />
                      Saída bruta do LLM
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <pre className="w-full max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded-xl border border-border/60 bg-background/70 p-3 text-[11px] leading-relaxed text-slate-200">
                      {JSON.stringify(llmOutput, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ) : null}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
