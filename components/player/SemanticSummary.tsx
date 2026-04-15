import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProcessingStatus, SessionProcessResponse } from "@/types/dashboard";
import { normalizeText, safeNumber } from "@/lib/normalization";
import { FileText, RefreshCw, Sparkles, SquareActivity } from "lucide-react";

interface SemanticSummaryProps {
  result?: SessionProcessResponse | null;
  status: ProcessingStatus;
  processingError?: string | null;
  onRetryStatus?: () => void;
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

export function SemanticSummary({
  result,
  status,
  processingError,
  onRetryStatus,
}: SemanticSummaryProps) {
  const narrative = normalizeText(result?.narrative, "");
  const hasNarrative = narrative.length > 0;
  const stats = result?.stats;
  const totalEvents = safeNumber(stats?.total_events, 0);
  const kinematicVectors = safeNumber(stats?.kinematic_vectors, 0);
  const userActions = safeNumber(stats?.user_actions, 0);
  const mlInsights = safeNumber(stats?.ml_insights, 0);
  const rageClicks = safeNumber(stats?.rage_clicks, 0);
  const confidence = safeNumber(result?.psychometrics?.overall_confidence, 0);
  const goalSummary = normalizeText(
    result?.psychometrics?.goal_hypothesis?.summary ??
      result?.intent_analysis?.goal_hypothesis?.summary,
    ""
  );

  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
              <FileText className="h-4 w-4 text-sky-300" />
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
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
              Narrativa
            </div>
            <p className="text-sm leading-relaxed text-foreground">{narrative}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/60 bg-background/30 p-4 text-sm text-muted-foreground">
            Narrativa ainda indisponível. O worker pode estar em fila ou processando a sessão.
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
          <div className="rounded-xl border border-border/60 bg-background/60 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <SquareActivity className="h-3.5 w-3.5 text-sky-300" />
              Hipótese principal
            </div>
            <p className="text-sm leading-relaxed text-foreground">{goalSummary}</p>
          </div>
        )}

        {status === "failed" && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm font-medium text-red-200">Processamento interrompido.</p>
            <p className="mt-1 text-sm text-red-100/80">
              {normalizeText(processingError, "O worker não retornou um erro detalhado.")}
            </p>
            {onRetryStatus && (
              <button
                type="button"
                onClick={onRetryStatus}
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-100 transition-colors hover:bg-red-500/10"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reconsultar status
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
