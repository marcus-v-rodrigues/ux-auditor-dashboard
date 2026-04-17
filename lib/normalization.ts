import type {
  BoundingBox,
  InsightEvent,
  JobStatus,
  IntentAnalysis,
  Psychometrics,
  SessionJobSubmissionResponse,
  SessionJobStatusResponse,
  SessionProcessResponse,
  SessionProcessStats,
} from "@/types/dashboard";

type RecordLike = Record<string, unknown>;

function isRecord(value: unknown): value is RecordLike {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneRecord(value: RecordLike): RecordLike {
  return { ...value };
}

function firstNonEmptyString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
}

export function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

export function safeUnknownArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function normalizeText(value: unknown, fallback: string): string {
  const text = safeString(value, "").trim();
  return text.length > 0 ? text : fallback;
}

export function normalizeBoundingBox(value: unknown): BoundingBox | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    top: safeNumber(value.top, 0),
    left: safeNumber(value.left, 0),
    width: safeNumber(value.width, 0),
    height: safeNumber(value.height, 0),
  };
}

function normalizeInsightType(value: unknown): string {
  return normalizeText(value, "usability");
}

function normalizeInsightSeverity(value: unknown): string {
  return normalizeText(value, "medium");
}

export function normalizeInsightEvent(value: unknown, index: number): InsightEvent {
  const insight = isRecord(value) ? value : {};

  return {
    id: normalizeText(insight.id, `insight-${index}`),
    timestamp: safeNumber(insight.timestamp, 0),
    type: normalizeInsightType(insight.type),
    severity: normalizeInsightSeverity(insight.severity),
    message: normalizeText(insight.message, "Detalhe do insight indisponível."),
    boundingBox: normalizeBoundingBox(insight.boundingBox),
  };
}

export function normalizeInsightEvents(value: unknown): InsightEvent[] {
  return Array.isArray(value) ? value.map((item, index) => normalizeInsightEvent(item, index)) : [];
}

export function normalizeSessionProcessStats(value: unknown): SessionProcessStats {
  const stats = isRecord(value) ? value : {};

  return {
    total_events: safeNumber(stats.total_events, 0),
    kinematic_vectors: safeNumber(stats.kinematic_vectors, 0),
    user_actions: safeNumber(stats.user_actions, 0),
    ml_insights: safeNumber(stats.ml_insights, 0),
    rage_clicks: safeNumber(stats.rage_clicks, 0),
  };
}

export function normalizePsychometrics(value: unknown): Psychometrics | null {
  if (!isRecord(value)) {
    return null;
  }

  const psychometrics = cloneRecord(value);
  const goalHypothesis = isRecord(psychometrics.goal_hypothesis)
    ? cloneRecord(psychometrics.goal_hypothesis)
    : undefined;

  return {
    ...psychometrics,
    overall_confidence:
      typeof psychometrics.overall_confidence === "number"
        ? psychometrics.overall_confidence
        : undefined,
    goal_hypothesis: goalHypothesis,
    friction_points: safeUnknownArray(psychometrics.friction_points),
    progress_signals: safeUnknownArray(psychometrics.progress_signals),
  };
}

export function normalizeIntentAnalysis(value: unknown): IntentAnalysis | null {
  if (!isRecord(value)) {
    return null;
  }

  const intentAnalysis = cloneRecord(value);
  const goalHypothesis = isRecord(intentAnalysis.goal_hypothesis)
    ? cloneRecord(intentAnalysis.goal_hypothesis)
    : undefined;

  return {
    ...intentAnalysis,
    overall_confidence:
      typeof intentAnalysis.overall_confidence === "number"
        ? intentAnalysis.overall_confidence
        : undefined,
    goal_hypothesis: goalHypothesis,
    hypotheses: safeUnknownArray(intentAnalysis.hypotheses),
  };
}

export function normalizeStructuredAnalysis(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? cloneRecord(value) : null;
}

export function normalizeSessionProcessResponse(value: unknown): SessionProcessResponse {
  const response = isRecord(value) ? value : {};
  const structuredAnalysis =
    normalizeStructuredAnalysis(response.structured_analysis) ??
    (isRecord(response.llm_output) && isRecord(response.llm_output.structured_analysis)
      ? cloneRecord(response.llm_output.structured_analysis)
      : null);
  const fallbackNarrative = firstNonEmptyString(
    response.narrative,
    response.human_readable_summary,
    structuredAnalysis?.session_narrative
  );

  return {
    session_uuid: normalizeText(response.session_uuid, ""),
    user_id: normalizeText(response.user_id, ""),
    narrative: fallbackNarrative,
    psychometrics: normalizePsychometrics(response.psychometrics) ?? {},
    intent_analysis: normalizeIntentAnalysis(response.intent_analysis) ?? {},
    insights: normalizeInsightEvents(response.insights),
    stats: normalizeSessionProcessStats(response.stats),
    semantic_bundle: response.semantic_bundle,
    llm_output: response.llm_output,
    structured_analysis: structuredAnalysis,
  };
}

export function normalizeSessionJobSubmission(
  value: unknown
): SessionJobSubmissionResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    status: "queued",
    message: normalizeText(value.message, "Eventos da sessão enfileirados para processamento assíncrono"),
    session_uuid: normalizeText(value.session_uuid, ""),
    user_id: normalizeText(value.user_id, ""),
  };
}

export function normalizeSessionJobStatus(value: unknown): SessionJobStatusResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  const rawStatus = normalizeText(value.status, "queued").trim().toLowerCase();
  const normalizedStatus: JobStatus =
    rawStatus === "processing" || rawStatus === "completed" || rawStatus === "failed"
      ? rawStatus
      : "queued";

  return {
    session_uuid: normalizeText(value.session_uuid, ""),
    user_id: normalizeText(value.user_id, ""),
    status: normalizedStatus,
    raw_status: rawStatus,
    processing_error:
      typeof value.processing_error === "string" ? value.processing_error : null,
    result:
      value.result === null || value.result === undefined
        ? null
        : normalizeSessionProcessResponse(value.result),
  };
}
