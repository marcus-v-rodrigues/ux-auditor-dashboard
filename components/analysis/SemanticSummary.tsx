import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProcessingStatus, SessionProcessResponse } from "@/types/dashboard";
import { normalizeText, safeNumber } from "@/lib/normalization";
import { FileText, RefreshCw, Sparkles, SquareActivity } from "lucide-react";

interface SemanticSummaryProps {
  result?: SessionProcessResponse | null;
  status: ProcessingStatus;
  processingError?: string | null;
  onReprocess?: () => void;
}

function statusLabel(status: ProcessingStatus): string {
  switch (status) {
    case "idle":
      return "Aguardando upload";
    case "uploading":
      return "Enviando";
    case "queued":
      return "Na fila";
    case "processing":
      return "Processando";
    case "completed":
      return "Concluída";
    case "failed":
      return "Falhou";
  }
}

function statusClassName(status: ProcessingStatus): string {
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

export function SemanticSummary({
  result,
  status,
  processingError,
  onReprocess,
}: SemanticSummaryProps) {
  const structuredAnalysis =
    result?.structured_analysis &&
    typeof result.structured_analysis === "object" &&
    !Array.isArray(result.structured_analysis)
      ? (result.structured_analysis as Record<string, unknown>)
      : undefined;
  const narrative = normalizeText(result?.narrative, "");
  const hasNarrative = narrative.length > 0;
  const stats = result?.stats;
  const totalEvents = safeNumber(stats?.total_events, 0);
  const kinematicVectors = safeNumber(stats?.kinematic_vectors, 0);
  const userActions = safeNumber(stats?.user_actions, 0);
  const mlInsights = safeNumber(stats?.ml_insights, 0);
  const rageClicks = safeNumber(stats?.rage_clicks, 0);
  const confidence = safeNumber(structuredAnalysis?.overall_confidence, 0);
  const goalHypothesis =
    structuredAnalysis?.goal_hypothesis &&
    typeof structuredAnalysis.goal_hypothesis === "object" &&
    !Array.isArray(structuredAnalysis.goal_hypothesis)
      ? (structuredAnalysis.goal_hypothesis as Record<string, unknown>)
      : undefined;
  const goalSummary = normalizeText(goalHypothesis?.justification, "");

  return (
    <Card className="w-full min-w-0 border-border/70 bg-card/80 shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
              <FileText className="app-icon-accent h-4 w-4" />
              Resumo semântico
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Estado atual da sessão e leitura executiva do processamento assíncrono.
            </p>
          </div>
          <Badge variant="outline" className={`h-6 px-2 text-[10px] ${statusClassName(status)}`}>
            {statusLabel(status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {hasNarrative ? (
          <div className="rounded-xl border border-border/60 bg-background/60 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles className="app-icon-accent h-3.5 w-3.5" />
              Narrativa
            </div>
            <p className="text-sm leading-relaxed text-foreground">{narrative}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/60 bg-background/30 p-4 text-sm text-muted-foreground">
            Narrativa ainda indisponível. O worker pode estar em fila ou processando a sessão.
          </div>
        )}

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Confiança</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{confidence}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Eventos</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{totalEvents}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ações</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{userActions}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Vetores cinéticos</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{kinematicVectors}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Insights ML</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{mlInsights}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Rage clicks</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{rageClicks}</p>
          </div>
        </div>

        {goalSummary && (
          <div className="min-w-0 rounded-xl border border-border/60 bg-background/60 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <SquareActivity className="app-icon-accent h-3.5 w-3.5" />
              Hipótese principal
            </div>
            <p className="text-sm leading-relaxed text-foreground">{goalSummary}</p>
          </div>
        )}

        {status === "failed" && (
          <div className="app-callout-error rounded-xl p-4">
            <p className="text-sm font-medium">Processamento interrompido.</p>
            <p className="mt-1 text-sm opacity-80">
              {normalizeText(processingError, "O worker não retornou um erro detalhado.")}
            </p>
            {onReprocess && (
              <button
                type="button"
                onClick={onReprocess}
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-current/30 px-3 py-1.5 text-xs font-medium transition-colors hover:app-hover-surface"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reprocessar sessão
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
