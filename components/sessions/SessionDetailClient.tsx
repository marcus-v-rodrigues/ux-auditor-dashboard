"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Database, FileJson, RefreshCw, Sparkles } from "lucide-react";

import { InsightsPanel } from "@/components/analysis/InsightsPanel";
import { SemanticSummary } from "@/components/analysis/SemanticSummary";
import VideoPlayer from "@/components/player/VideoPlayer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { extractRrwebEvents } from "@/lib/rrweb";
import {
  normalizeSessionJobStatus,
  normalizeSessionReprocessResponse,
} from "@/lib/normalization";
import type {
  InsightEvent,
  ProcessingStatus,
  RrwebSessionEvent,
  SessionJobStatusResponse,
  SessionRawResponse,
} from "@/types/dashboard";

const POLLING_INTERVAL_MS = 5000;

function statusLabel(status: ProcessingStatus): string {
  switch (status) {
    case "idle":
      return "Aguardando";
    case "uploading":
      return "Enviando";
    case "queued":
      return "Na fila";
    case "processing":
      return "Processando";
    case "completed":
      return "Concluida";
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
      return "bg-amber-500/15 text-amber-200 border-amber-500/30";
    case "queued":
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  }
}

function statusCopy(
  status: ProcessingStatus,
  processingError: string | null
): string {
  switch (status) {
    case "idle":
      return "Sessão sem status inicial.";
    case "uploading":
      return "Sessão em envio.";
    case "queued":
      return "Sessão recebida. Aguardando worker.";
    case "processing":
      return "Worker em execução. Processando sessão.";
    case "completed":
      return "Análise concluida.";
    case "failed":
      return processingError ?? "Falha no processamento.";
  }
}

export function SessionDetailClient({ uuid }: { uuid: string }) {
  const [uploadedEvents, setUploadedEvents] = useState<RrwebSessionEvent[]>([]);
  const [sessionData, setSessionData] = useState<SessionJobStatusResponse | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>("queued");
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [rawError, setRawError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const pollRef = useRef<number | null>(null);

  const activeOverlays = useMemo<InsightEvent[]>(() => {
    const insights = sessionData?.result?.insights ?? [];
    return insights.filter(
      (insight) => Math.abs(insight.timestamp - currentTime) < 1000 && Boolean(insight.boundingBox)
    );
  }, [currentTime, sessionData?.result?.insights]);

  const loadStatus = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const response = await fetch(`/api/sessions/${uuid}/status`, {
        headers: { "Content-Type": "application/json" },
      });
      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data && typeof data === "object" && "error" in data
            ? String((data as { error?: unknown }).error ?? "Erro ao consultar status")
            : `Erro HTTP ${response.status}`;
        throw new Error(message);
      }

      const normalized = normalizeSessionJobStatus(data);
      if (!normalized) {
        throw new Error("Resposta de status invalida.");
      }

      setSessionData(normalized);
      setProcessingStatus(normalized.status);
      setProcessingError(normalized.processing_error);
      setStatusError(null);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Nao foi possivel consultar o status da sessão.";
      setStatusError(message);
      setProcessingError(message);
    } finally {
      setIsRefreshing(false);
    }
  }, [uuid]);

  const reprocessSession = useCallback(async () => {
    setIsReprocessing(true);

    try {
      const response = await fetch(`/api/sessions/${uuid}/reprocess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data: unknown = await response.json().catch(() => ({}));

      if (response.status !== 202) {
        const message =
          data && typeof data === "object" && "error" in data
            ? String((data as { error?: unknown }).error ?? "Erro ao reenfileirar sessão")
            : `Erro HTTP ${response.status}`;
        throw new Error(message);
      }

      const normalized = normalizeSessionReprocessResponse(data);
      if (!normalized) {
        throw new Error("Resposta de reprocessamento invalida.");
      }

      setSessionData((previous) => ({
        session_uuid: normalized.session_uuid || previous?.session_uuid || uuid,
        user_id: normalized.user_id || previous?.user_id || "",
        status: normalized.status,
        raw_status: normalized.status,
        processing_error: null,
        result: null,
      }));
      setProcessingStatus(normalized.status);
      setProcessingError(null);
      setStatusError(null);

      void loadStatus();
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Nao foi possivel reenfileirar a sessão.";
      setStatusError(message);
      setProcessingError(message);
    } finally {
      setIsReprocessing(false);
    }
  }, [loadStatus, uuid]);

  useEffect(() => {
    let active = true;

    async function loadRawEvents() {
      try {
        const response = await fetch(`/api/sessions/${uuid}/raw`, {
          headers: { "Content-Type": "application/json" },
        });
        const data: unknown = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message =
            data && typeof data === "object" && "error" in data
              ? String((data as { error?: unknown }).error ?? "Erro ao carregar replay")
              : `Erro HTTP ${response.status}`;
          throw new Error(message);
        }

        const rawPayload = data as SessionRawResponse;
        const events = extractRrwebEvents(rawPayload);
        if (!events) {
          throw new Error("Payload bruto sem events na raiz.");
        }

        if (active) {
          setUploadedEvents(events);
          setRawError(null);
        }
      } catch (fetchError) {
        if (active) {
          setRawError(
            fetchError instanceof Error
              ? fetchError.message
              : "Nao foi possivel carregar os eventos rrweb."
          );
        }
      }
    }

    void loadRawEvents();
    void loadStatus();

    return () => {
      active = false;
    };
  }, [loadStatus, uuid]);

  useEffect(() => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (processingStatus !== "queued" && processingStatus !== "processing") {
      return;
    }

    pollRef.current = window.setInterval(() => {
      void loadStatus();
    }, POLLING_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [loadStatus, processingStatus]);

  const analysisReady =
    processingStatus === "completed" && sessionData?.result !== null;

  return (
    <section className="px-4 py-4 md:px-6 md:py-6">
      <div className="flex flex-col gap-4">
        <header className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 shadow-2xl shadow-slate-950/30">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <FileJson className="h-4 w-4 text-sky-300" />
                <h2 className="truncate text-sm font-semibold text-white">
                  Sessão {uuid}
                </h2>
                <Badge
                  variant="outline"
                  className={`h-6 px-2 text-[10px] ${statusClassName(processingStatus)}`}
                >
                  {statusLabel(processingStatus)}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>{statusCopy(processingStatus, processingError)}</span>
                {sessionData?.user_id ? (
                  <span className="rounded-full border border-white/10 px-2 py-0.5">
                    user {sessionData.user_id}
                  </span>
                ) : null}
                {analysisReady ? (
                  <span className="rounded-full border border-cyan-400/30 px-2 py-0.5 text-cyan-300">
                    resultado pronto
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => void reprocessSession()}
                disabled={isRefreshing || isReprocessing}
                className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing || isReprocessing ? "animate-spin" : ""}`}
                />
                Reprocessar sessão
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white"
              >
                <Link href={`/sessions/${uuid}/raw`}>
                  <Database className="mr-2 h-4 w-4" />
                  JSON bruto
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {(processingStatus === "failed" || statusError || rawError) && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-50">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-200" />
              <div className="min-w-0">
                <p className="font-medium">Falha no carregamento da sessão</p>
                <p className="mt-1 text-red-50/80">
                  {processingStatus === "failed"
                    ? processingError
                    : statusError ?? rawError}
                </p>
              </div>
            </div>
          </div>
        )}

        <main className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] xl:grid-cols-[minmax(0,2.2fr)_minmax(360px,1fr)]">
          <section className="flex min-h-0 min-w-0 flex-col gap-4">
            <Card className="flex min-h-0 flex-col overflow-hidden border-white/10 bg-white/[0.03] py-0 shadow-2xl shadow-slate-950/30">
              <CardHeader className="border-b border-white/10 !py-6">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
                  <Sparkles className="h-4 w-4 text-sky-300" />
                  Replay da sessão
                </CardTitle>
              </CardHeader>

              <CardContent className="flex min-h-[460px] min-w-0 flex-1 p-0">
                {uploadedEvents.length > 0 ? (
                  <div className="flex min-h-0 min-w-0 flex-1 pt-6">
                    <VideoPlayer
                      key={uuid}
                      events={uploadedEvents}
                      currentTime={currentTime}
                      overlays={activeOverlays}
                      onTimeUpdate={setCurrentTime}
                    />
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-400">
                    {rawError ?? "Carregando eventos rrweb para o replay..."}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="flex min-h-0 min-w-0 flex-col">
            <SemanticSummary
              result={analysisReady ? sessionData?.result : null}
              status={processingStatus}
              processingError={processingError}
              onReprocess={() => void reprocessSession()}
            />
          </section>

          <section className="flex min-h-0 min-w-0 flex-col lg:col-span-2">
            <InsightsPanel
              result={analysisReady ? sessionData?.result : null}
              currentTime={currentTime}
              processingStatus={processingStatus}
              processingError={processingError}
              onReprocess={() => void reprocessSession()}
            />
          </section>
        </main>
      </div>
    </section>
  );
}
