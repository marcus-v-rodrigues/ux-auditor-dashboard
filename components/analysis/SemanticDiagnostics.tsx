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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function formatFieldLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderEvidence(value: unknown): ReactNode {
  const items = safeUnknownArray(value)
    .map((item) => summarizeValue(item))
    .filter((item) => item.length > 0);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Evidências</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Badge key={`${item}-${index}`} variant="outline" className="app-chip text-[10px]">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function renderStructuredItem(value: unknown, index: number): ReactNode {
  if (!isRecord(value)) {
    return (
      <li key={`${index}-${summarizeValue(value)}`} className="rounded-lg border border-border/60 bg-background/60 p-3 text-sm text-foreground">
        {summarizeValue(value)}
      </li>
    );
  }

  const label = normalizeText(value.label, "");
  const description = normalizeText(value.description, "");
  const confidence =
    typeof value.confidence === "number" ? value.confidence : null;
  const remainingEntries = Object.entries(value).filter(
    ([key]) =>
      key !== "label" &&
      key !== "description" &&
      key !== "confidence" &&
      key !== "supporting_evidence"
  );

  return (
    <li key={`${index}-${label || description || "item"}`} className="rounded-lg border border-border/60 bg-background/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          {label || `Item ${index + 1}`}
        </p>
        {confidence !== null ? (
          <Badge variant="outline" className="text-[10px]">
            confiança {confidence}
          </Badge>
        ) : null}
      </div>

      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-foreground">{description}</p>
      ) : null}

      {remainingEntries.length > 0 ? (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {remainingEntries.map(([key, entry]) => (
            <div key={key} className="rounded-md border border-border/50 bg-background/40 p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {formatFieldLabel(key)}
              </p>
              <p className="mt-1 text-sm text-foreground">{summarizeValue(entry) || "Indisponível"}</p>
            </div>
          ))}
        </div>
      ) : null}

      {renderEvidence(value.supporting_evidence)}
    </li>
  );
}

function renderList(values: unknown[]): ReactNode {
  if (values.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum dado disponível.</p>;
  }

  return (
    <ul className="space-y-2">
      {values.map((value, index) => renderStructuredItem(value, index))}
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
  const structuredAnalysis =
    result?.structured_analysis &&
    typeof result.structured_analysis === "object" &&
    !Array.isArray(result.structured_analysis)
      ? (result.structured_analysis as Record<string, unknown>)
      : undefined;

  const confidence = safeNumber(structuredAnalysis?.overall_confidence, 0);
  const frictionPoints = safeUnknownArray(structuredAnalysis?.friction_points);
  const progressSignals = safeUnknownArray(structuredAnalysis?.progress_signals);
  const hypotheses = safeUnknownArray(structuredAnalysis?.hypotheses);
  const behavioralPatterns = safeUnknownArray(structuredAnalysis?.behavioral_patterns);
  const ambiguities = safeUnknownArray(structuredAnalysis?.ambiguities);
  const evidenceUsed = safeUnknownArray(structuredAnalysis?.evidence_used);
  const structuredGoalHypothesis = isRecord(structuredAnalysis?.goal_hypothesis)
    ? structuredAnalysis.goal_hypothesis
    : undefined;
  const goalHypothesis = structuredGoalHypothesis;

  return (
    <div className="w-full min-w-0 space-y-4">

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">

        <Card className="w-full min-w-0 border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
              <BrainCircuit className="app-icon-accent h-4 w-4" />
              Confiança e hipótese principal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="min-w-0 rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Confiança geral</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{confidence}</p>
            </div>

            <div className="grid min-w-0 gap-4 xl:grid-cols-2">
              <div className="min-w-0 space-y-3 xl:col-span-2">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Target className="h-3.5 w-3.5" />
                  Hipótese do Objetivo
                </div>
                {renderObjectPreview(goalHypothesis)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full min-w-0 border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
              <BrainCircuit className="app-icon-accent h-4 w-4" />
              Padrões comportamentais
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">{renderList(behavioralPatterns)}</CardContent>
        </Card>

        <Card className="w-full min-w-0 border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
              <ListChecks className="app-icon-accent h-4 w-4" />
              Fricções
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">{renderList(frictionPoints)}</CardContent>
        </Card>

        <Card className="w-full min-w-0 border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
              <CheckCircle2 className="app-icon-accent h-4 w-4" />
              Sinais de progresso
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">{renderList(progressSignals)}</CardContent>
        </Card>
        
      </div>

      <Card className="w-full min-w-0 border-border/70 bg-card/80 shadow-sm">
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

      {(ambiguities.length > 0 || evidenceUsed.length > 0) && (
        <Card className="w-full min-w-0 border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
              <BrainCircuit className="app-icon-accent h-4 w-4" />
              Complementos analíticos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {ambiguities.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase">
                    Ambiguidades
                  </Badge>
                </div>
                {renderList(ambiguities)}
              </div>
            ) : null}
            {evidenceUsed.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase">
                    Evidências utilizadas
                  </Badge>
                </div>
                {renderList(evidenceUsed)}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
