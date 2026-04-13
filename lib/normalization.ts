import type {
  BoundingBox,
  InsightEvent,
  InsightEventPayload,
  InsightSeverity,
  InsightType,
  IntentAnalysis,
  IntentAnalysisPayload,
  PsychometricData,
  PsychometricDataPayload,
  SessionStatsPayload,
  TelemetryLog,
  TelemetryLogPayload,
} from "@/types/dashboard";

type RecordLike = Record<string, unknown>;

function isRecord(value: unknown): value is RecordLike {
  return value !== null && typeof value === "object";
}

/**
 * Converte qualquer valor numérico válido para `number`.
 * Valores ausentes, nulos ou `NaN` caem no fallback.
 */
export function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Garante que o valor seja uma string; caso contrário, usa o fallback.
 */
export function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * Normaliza arrays heterogêneos para uma lista de strings não vazias.
 */
export function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

/**
 * Normaliza um valor percentual para a faixa 0-100.
 */
export function safePercent(value: unknown, fallback = 0): number {
  const numeric = safeNumber(value, fallback);
  return Math.min(100, Math.max(0, numeric));
}

/**
 * Remove espaços e troca textos vazios pelo fallback informado.
 */
export function normalizeText(value: unknown, fallback: string): string {
  const text = safeString(value, "").trim();
  return text.length > 0 ? text : fallback;
}

/**
 * Normaliza a bounding box recebida da API para um shape totalmente numérico.
 */
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

function normalizeInsightType(value: unknown): InsightType {
  const type = safeString(value, "usability");
  return type === "accessibility" || type === "usability" || type === "heuristic"
    ? type
    : "usability";
}

function normalizeInsightSeverity(value: unknown): InsightSeverity {
  const severity = safeString(value, "medium");
  return severity === "low" || severity === "medium" || severity === "critical"
    ? severity
    : "medium";
}

/**
 * Normaliza um insight parcial da API para o contrato usado pela UI.
 */
export function normalizeInsightEvent(
  value: InsightEventPayload | unknown,
  index: number
): InsightEvent {
  const insight = isRecord(value) ? value : {};

  return {
    id: safeString(insight.id, `insight-${index}`),
    timestamp: safeNumber(insight.timestamp, 0),
    type: normalizeInsightType(insight.type),
    severity: normalizeInsightSeverity(insight.severity),
    message: normalizeText(insight.message, "Detalhe do insight indisponível."),
    boundingBox: normalizeBoundingBox(insight.boundingBox),
  };
}

/**
 * Normaliza um log de telemetria parcial para o formato exibido no painel.
 */
export function normalizeTelemetryLog(
  value: TelemetryLogPayload | unknown,
  index: number
): TelemetryLog {
  const log = isRecord(value) ? value : {};

  return {
    id: safeString(log.id, `log-${index}`),
    timestamp: safeNumber(log.timestamp, 0),
    eventType: normalizeText(log.eventType, "desconhecido"),
    details: normalizeText(log.details, "Detalhes indisponíveis."),
  };
}

/**
 * Normaliza a coleção de logs da resposta do backend.
 */
export function normalizeTelemetryLogs(
  value: SessionStatsPayload | null | undefined
): TelemetryLog[] {
  const actions = value?.user_actions;
  return Array.isArray(actions) ? actions.map((action, index) => normalizeTelemetryLog(action, index)) : [];
}

/**
 * Normaliza os dados psicométricos recebidos pela API.
 */
export function normalizePsychometricData(
  value: PsychometricDataPayload | PsychometricData | null | undefined
): PsychometricData | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    engagement_score: safePercent(value.engagement_score, 0),
    frustration_score: safePercent(value.frustration_score, 0),
    confusion_score: safePercent(value.confusion_score, 0),
    behavior_patterns: safeStringArray(value.behavior_patterns),
  };
}

/**
 * Normaliza a análise de intenção recebida pela API.
 */
export function normalizeIntentAnalysisData(
  value: IntentAnalysisPayload | IntentAnalysis | null | undefined
): IntentAnalysis | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    primary_intent: normalizeText(value.primary_intent, "Não identificado"),
    secondary_intents: safeStringArray(value.secondary_intents),
    success_probability: safeNumber(value.success_probability, 0),
    barriers: safeStringArray(value.barriers),
  };
}
