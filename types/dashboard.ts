import type { eventWithTime } from "@rrweb/types";

export type JobStatus = "queued" | "processing" | "completed" | "failed";
export type ProcessingStatus = "idle" | "uploading" | JobStatus;

export type InsightSeverity = "low" | "medium" | "critical" | string;
export type InsightType = "accessibility" | "usability" | "heuristic" | string;

export type RrwebSessionEvent = eventWithTime;

export interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface InsightEvent {
  id: string;
  timestamp: number;
  type: InsightType;
  severity: InsightSeverity;
  message: string;
  boundingBox?: BoundingBox;
}

export interface SessionJobSubmissionResponse {
  status: "queued";
  message: string;
  session_uuid: string;
  user_id: string;
}

export interface SessionProcessStats {
  total_events: number;
  kinematic_vectors: number;
  user_actions: number;
  ml_insights: number;
  rage_clicks: number;
}

export type Psychometrics = {
  overall_confidence?: number;
  goal_hypothesis?: Record<string, unknown>;
  friction_points?: unknown[];
  progress_signals?: unknown[];
} & Record<string, unknown>;

export type IntentAnalysis = {
  goal_hypothesis?: Record<string, unknown>;
  hypotheses?: unknown[];
  overall_confidence?: number;
} & Record<string, unknown>;

export interface SessionProcessResponse {
  session_uuid: string;
  user_id: string;
  narrative: string;
  psychometrics: Psychometrics;
  intent_analysis: IntentAnalysis;
  insights: InsightEvent[];
  stats: SessionProcessStats;
  semantic_bundle?: unknown;
  llm_output?: unknown;
  structured_analysis?: Record<string, unknown> | null;
}

export interface SessionJobStatusResponse {
  session_uuid: string;
  user_id: string;
  status: JobStatus;
  raw_status?: string;
  processing_error: string | null;
  result: SessionProcessResponse | null;
}

export interface SessionHistoryItem {
  session_uuid: string;
  status: JobStatus;
  created_at: string;
  narrative_preview: string | null;
}

export interface SessionRawMetadata {
  session_meta?: Record<string, unknown>;
  privacy?: Record<string, unknown>;
  capture_config?: Record<string, unknown>;
  axe_preliminary_analysis?: Record<string, unknown>;
  page_semantics?: Record<string, unknown>;
  interaction_summary?: Record<string, unknown>;
  ui_dynamics?: Record<string, unknown>;
  heuristic_evidence?: Record<string, unknown>;
  ux_markers?: Record<string, unknown>[];
}

export interface SessionRawResponse {
  user_id: string;
  session_uuid: string;
  events: RrwebSessionEvent[];
  metadata: SessionRawMetadata;
  timestamp: string;
}

export interface TelemetryLog {
  id: string;
  timestamp: number;
  eventType: string;
  details: string;
}
