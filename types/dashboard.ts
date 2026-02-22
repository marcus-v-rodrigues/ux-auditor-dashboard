// types/dashboard.ts

export type InsightSeverity = 'low' | 'medium' | 'critical';
export type InsightType = 'accessibility' | 'usability' | 'heuristic';

export interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface InsightEvent {
  id: string;
  timestamp: number; // Momento do vídeo em ms
  type: InsightType;
  severity: InsightSeverity;
  message: string;
  boundingBox?: BoundingBox; // Coordenadas originais da gravação
}

export interface TelemetryLog {
  id: string;
  timestamp: number;
  eventType: string;
  details: string;
}

/**
 * Estatísticas de ações do usuário durante a sessão
 */
export interface SessionStats {
  // Ações do usuário extraídas durante o processamento
  user_actions: TelemetryLog[];
}

/**
 * Interface para a resposta do endpoint de processamento de sessão
 * Contém os dados processados pelo pipeline de IA (Preprocessor, Isolation Forest, Heurísticas e LLM)
 */
export interface SessionProcessResponse {
  // Insights/anomalias detectadas durante a análise
  insights: InsightEvent[];
  // Narrativa gerada pela IA sobre a sessão
  narrative: string;
  // Dados psicométricos do usuário durante a sessão
  psychometrics: PsychometricData;
  // Análise de intenção do usuário
  intent_analysis: IntentAnalysis;
  // Estatísticas e ações do usuário durante a sessão
  stats?: SessionStats;
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