// types/dashboard.ts

import type { eventWithTime } from '@rrweb/types';

export type InsightSeverity = 'low' | 'medium' | 'critical';
export type InsightType = 'accessibility' | 'usability' | 'heuristic';
export type RrwebSessionEvent = eventWithTime;

export interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Versão parcial da bounding box recebida da API.
 */
export interface BoundingBoxPayload {
  top?: number | null;
  left?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface InsightEvent {
  id: string;
  timestamp: number; // Momento do vídeo em ms
  type: InsightType;
  severity: InsightSeverity;
  message: string;
  boundingBox?: BoundingBox; // Coordenadas originais da gravação
}

/**
 * Versão parcial de um insight recebida da API.
 */
export interface InsightEventPayload {
  id?: string | null;
  timestamp?: number | null;
  type?: string | null;
  severity?: string | null;
  message?: string | null;
  boundingBox?: BoundingBoxPayload | null;
}

export interface TelemetryLog {
  id: string;
  timestamp: number;
  eventType: string;
  details: string;
}

/**
 * Versão parcial de um log de telemetria recebida da API.
 */
export interface TelemetryLogPayload {
  id?: string | null;
  timestamp?: number | null;
  eventType?: string | null;
  details?: string | null;
}

/**
 * Estatísticas de ações do usuário durante a sessão
 */
export interface SessionStats {
  // Ações do usuário extraídas durante o processamento
  user_actions: TelemetryLog[];
}

/**
 * Versão parcial dos dados psicométricos recebidos da API.
 * Os campos podem estar ausentes ou nulos quando o backend retorna payload incompleto.
 */
export interface PsychometricDataPayload {
  engagement_score?: number | null;
  frustration_score?: number | null;
  confusion_score?: number | null;
  behavior_patterns?: unknown;
}

/**
 * Versão parcial da análise de intenção recebida da API.
 * Os campos podem estar ausentes ou nulos quando o backend retorna payload incompleto.
 */
export interface IntentAnalysisPayload {
  primary_intent?: string | null;
  secondary_intents?: unknown;
  success_probability?: number | null;
  barriers?: unknown;
}

/**
 * Versão parcial das estatísticas recebidas da API.
 */
export interface SessionStatsPayload {
  user_actions?: TelemetryLogPayload[] | null;
}

/**
 * Interface para a resposta do endpoint de processamento de sessão
 * Contém os dados processados pelo pipeline de IA (Preprocessor, Isolation Forest, Heurísticas e LLM)
 */
export interface SessionProcessResponse {
  // Insights/anomalias detectadas durante a análise
  insights?: InsightEventPayload[] | null;
  // Narrativa gerada pela IA sobre a sessão
  narrative?: string | null;
  // Dados psicométricos do usuário durante a sessão
  psychometrics?: PsychometricDataPayload | null;
  // Análise de intenção do usuário
  intent_analysis?: IntentAnalysisPayload | null;
  // Estatísticas e ações do usuário durante a sessão
  stats?: SessionStatsPayload | null;
}

/**
 * Dados psicométricos extraídos durante a análise
 */
export interface PsychometricData {
  // Nível de engajamento do usuário (0-100)
  engagement_score: number;
  // Nível de frustração detectado (0-100)
  frustration_score: number;
  // Nível de confusão detectado (0-100)
  confusion_score: number;
  // Padrões de comportamento identificados
  behavior_patterns: string[];
}

/**
 * Análise de intenção do usuário
 */
export interface IntentAnalysis {
  // Intenção principal identificada
  primary_intent: string;
  // Intenções secundárias
  secondary_intents: string[];
  // Taxa de sucesso na consecução da intenção (0-100)
  success_probability: number;
  // Barreiras identificadas para consecução do objetivo
  barriers: string[];
}
