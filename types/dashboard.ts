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