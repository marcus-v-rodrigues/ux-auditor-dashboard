import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionProcessResponse } from "@/types/dashboard";
import { normalizeText, safeNumber, safeUnknownArray } from "@/lib/normalization";
import { BrainCircuit, CheckCircle2, ListChecks, Target } from "lucide-react";
import type { ReactNode } from "react";

interface SemanticDiagnosticsProps {
  result?: SessionProcessResponse | null;
}

function summarizeValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, 4)
      .map((item) => summarizeValue(item))
      .filter((item) => item.length > 0)
      .join(" • ");
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries
      .slice(0, 4)
      .map(([key, entry]) => `${key}: ${summarizeValue(entry)}`)
      .join(" • ");
  }

  return "";
}

function renderList(values: unknown[]): ReactNode {
  if (values.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum dado disponível.</p>;
  }

  return (
    <ul className="space-y-2">
      {values.map((value, index) => (
        <li key={`${index}-${summarizeValue(value)}`} className="rounded-lg border border-border/60 bg-background/60 p-3 text-sm text-foreground">
          {summarizeValue(value)}
        </li>
      ))}
    </ul>
  );
}

function renderObjectPreview(value: unknown): ReactNode {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return <p className="text-sm text-muted-foreground">Sem hipótese estruturada disponível.</p>;
  }

  const entries = Object.entries(value as Record<string, unknown>);

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem hipótese estruturada disponível.</p>;
  }

  return (
    <div className="space-y-2">
      {entries.slice(0, 6).map(([key, entry]) => (
        <div key={key} className="rounded-lg border border-border/60 bg-background/60 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{key}</p>
          <p className="mt-1 text-sm text-foreground">{summarizeValue(entry) || "Indisponível"}</p>
        </div>
      ))}
    </div>
  );
}

export function SemanticDiagnostics({ result }: SemanticDiagnosticsProps) {
  const psychometrics = result?.psychometrics;
  const intentAnalysis = result?.intent_analysis;
  const structuredAnalysis = result?.structured_analysis;

  const confidence = safeNumber(psychometrics?.overall_confidence, 0);
  const intentConfidence = safeNumber(intentAnalysis?.overall_confidence, 0);
  const frictionPoints = safeUnknownArray(psychometrics?.friction_points);
  const progressSignals = safeUnknownArray(psychometrics?.progress_signals);
  const hypotheses = safeUnknownArray(intentAnalysis?.hypotheses);
  const goalHypothesis = psychometrics?.goal_hypothesis ?? intentAnalysis?.goal_hypothesis;
  const goalSummary = normalizeText(
    (goalHypothesis as Record<string, unknown> | undefined)?.summary,
    ""
  );

  return (
    <div className="space-y-4">
      <Card className="border-border/70 bg-card/80 shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
            <BrainCircuit className="h-4 w-4 text-sky-300" />
            Confiança e hipótese principal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Psicometria</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{confidence}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Intenção</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{intentConfidence}</p>
            </div>
          </div>

          {goalSummary ? (
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Resumo da hipótese</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{goalSummary}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 bg-background/30 p-4 text-sm text-muted-foreground">
              A API não forneceu um resumo textual da hipótese principal.
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                Psychometrics.goal_hypothesis
              </div>
              {renderObjectPreview(psychometrics?.goal_hypothesis)}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                intent_analysis.goal_hypothesis
              </div>
              {renderObjectPreview(intentAnalysis?.goal_hypothesis)}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
              <ListChecks className="h-4 w-4 text-sky-300" />
              Fricções
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">{renderList(frictionPoints)}</CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
              <CheckCircle2 className="h-4 w-4 text-sky-300" />
              Sinais de progresso
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">{renderList(progressSignals)}</CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
              <Badge variant="outline" className="h-6 px-2 text-[10px]">
                {hypotheses.length}
              </Badge>
            Hipóteses
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">{renderList(hypotheses)}</CardContent>
      </Card>

      {structuredAnalysis && (
        <Card className="border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
              <BrainCircuit className="h-4 w-4 text-sky-300" />
              Estrutura analítica rica
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">{renderObjectPreview(structuredAnalysis)}</CardContent>
        </Card>
      )}
    </div>
  );
}
