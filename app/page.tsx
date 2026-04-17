'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, FileJson, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VideoPlayer from '@/components/player/VideoPlayer';
import { FileUploader } from '@/components/FileUploader';
import { InsightsPanel } from '@/components/player/InsightsPanel';
import type {
  InsightEvent,
  ProcessingStatus,
  RrwebSessionEvent,
  SessionJobSubmissionResponse,
  SessionProcessResponse,
} from '@/types/dashboard';
import { normalizeSessionJobStatus, safeNumber } from '@/lib/normalization';

const POLLING_INTERVAL_MS = 2000;
const POLLING_TIMEOUT_MS = 5 * 60 * 1000;

type StatusDiagnostics = {
  attempts: number;
  pollingActive: boolean;
  lastPollAt: number | null;
  lastStatus: ProcessingStatus | null;
  lastRawStatus: string | null;
  lastHttpStatus: number | null;
  lastError: string | null;
};

function statusLabel(status: ProcessingStatus, timedOut: boolean): string {
  if (timedOut) {
    return 'Timeout';
  }

  switch (status) {
    case 'idle':
      return 'Aguardando upload';
    case 'uploading':
      return 'Enviando';
    case 'queued':
      return 'Na fila';
    case 'processing':
      return 'Processando';
    case 'completed':
      return 'Concluída';
    case 'failed':
      return 'Falhou';
  }
}

function statusClassName(status: ProcessingStatus, timedOut: boolean): string {
  if (timedOut) {
    return 'bg-amber-500/15 text-amber-200 border-amber-500/30';
  }

  switch (status) {
    case 'completed':
      return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    case 'failed':
      return 'bg-red-500/15 text-red-200 border-red-500/30';
    case 'processing':
    case 'uploading':
      return 'bg-amber-500/15 text-amber-200 border-amber-500/30';
    case 'queued':
      return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    default:
      return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  }
}

function statusCopy(status: ProcessingStatus, timedOut: boolean, processingError: string | null): string {
  if (timedOut) {
    return 'Sessão ainda não saiu da fila no tempo esperado.';
  }

  switch (status) {
    case 'idle':
      return 'Aguardando upload.';
    case 'uploading':
      return 'Sessão em envio.';
    case 'queued':
      return 'Sessão recebida. Aguardando worker.';
    case 'processing':
      return 'Worker em execução. Processando sessão.';
    case 'completed':
      return 'Análise concluída.';
    case 'failed':
      return processingError ?? 'Falha no processamento.';
  }
}

function formatTimestamp(value: number | null): string {
  if (!value) {
    return 'nenhum';
  }

  return new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function normalizeStatusForDiagnostics(value: string | null): string {
  return value && value.length > 0 ? value : '—';
}

function DiagnosticsPanel({ data }: { data: StatusDiagnostics }) {
  return (
    <Card className="border-cyan-400/15 bg-cyan-400/5 shadow-lg shadow-slate-950/20">
      <CardHeader className="border-b border-white/10 pb-3">
        <CardTitle className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
          Diagnóstico de polling
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 pt-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Ativo</p>
          <p className="mt-1 text-sm text-white">{data.pollingActive ? 'sim' : 'não'}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Tentativas</p>
          <p className="mt-1 text-sm text-white">{data.attempts}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Último polling</p>
          <p className="mt-1 text-sm text-white">{formatTimestamp(data.lastPollAt)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">HTTP</p>
          <p className="mt-1 text-sm text-white">{data.lastHttpStatus ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Status</p>
          <p className="mt-1 text-sm text-white">{normalizeStatusForDiagnostics(data.lastStatus)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Raw</p>
          <p className="mt-1 text-sm text-white">{normalizeStatusForDiagnostics(data.lastRawStatus)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 sm:col-span-2 xl:col-span-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Erro</p>
          <p className="mt-1 text-sm text-white">{data.lastError ?? '—'}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [uploadedEvents, setUploadedEvents] = useState<RrwebSessionEvent[]>([]);
  const [sessionUuid, setSessionUuid] = useState('');
  const [sessionUserId, setSessionUserId] = useState('');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SessionProcessResponse | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pollingTimedOut, setPollingTimedOut] = useState(false);
  const [statusDiagnostics, setStatusDiagnostics] = useState<StatusDiagnostics>({
    attempts: 0,
    pollingActive: false,
    lastPollAt: null,
    lastStatus: null,
    lastRawStatus: null,
    lastHttpStatus: null,
    lastError: null,
  });

  const sessionGenerationRef = useRef(0);
  const isPollingRequestRef = useRef(false);

  const hasSession = sessionUuid.length > 0;
  const shouldPoll = hasSession && !pollingTimedOut && (processingStatus === 'queued' || processingStatus === 'processing');

  const sessionDuration = useMemo(() => {
    if (uploadedEvents.length === 0) {
      return 0;
    }

    const firstTimestamp = safeNumber(uploadedEvents[0]?.timestamp, 0);
    const lastTimestamp = safeNumber(uploadedEvents[uploadedEvents.length - 1]?.timestamp, 0);
    return Math.max(0, lastTimestamp - firstTimestamp);
  }, [uploadedEvents]);

  const activeOverlays = useMemo<InsightEvent[]>(() => {
    const insights = analysisResult?.insights ?? [];
    if (insights.length === 0) {
      return [];
    }

    return insights.filter((insight) => Math.abs(insight.timestamp - currentTime) < 1000 && Boolean(insight.boundingBox));
  }, [analysisResult, currentTime]);

  const handleFileLoaded = useCallback(
    (events: RrwebSessionEvent[], submission: SessionJobSubmissionResponse) => {
      sessionGenerationRef.current += 1;
      isPollingRequestRef.current = false;
      setUploadedEvents(events);
      setSessionUuid(submission.session_uuid);
      setSessionUserId(submission.user_id);
      setProcessingStatus(submission.status);
      setProcessingError(null);
      setAnalysisResult(null);
      setCurrentTime(0);
      setSubmissionMessage(submission.message);
      setPollingTimedOut(false);
      setStatusDiagnostics({
        attempts: 0,
        pollingActive: false,
        lastPollAt: null,
        lastStatus: submission.status,
        lastRawStatus: submission.status,
        lastHttpStatus: null,
        lastError: null,
      });
    },
    []
  );

  const resetSession = useCallback(() => {
    sessionGenerationRef.current += 1;
    isPollingRequestRef.current = false;
    setUploadedEvents([]);
    setSessionUuid('');
    setSessionUserId('');
    setProcessingStatus('idle');
    setProcessingError(null);
    setAnalysisResult(null);
    setCurrentTime(0);
    setSubmissionMessage('');
    setIsRefreshing(false);
    setPollingTimedOut(false);
    setStatusDiagnostics({
      attempts: 0,
      pollingActive: false,
      lastPollAt: null,
      lastStatus: null,
      lastRawStatus: null,
      lastHttpStatus: null,
      lastError: null,
    });
  }, []);

  const refreshSessionStatus = useCallback(
    async (source: 'manual' | 'poll' = 'manual') => {
      if (!sessionUuid || isPollingRequestRef.current) {
        return;
      }

      const requestGeneration = sessionGenerationRef.current;
      isPollingRequestRef.current = true;
      setIsRefreshing(true);
      setStatusDiagnostics((current) => ({
        ...current,
        attempts: current.attempts + 1,
        pollingActive: current.pollingActive || source === 'poll',
        lastPollAt: Date.now(),
        lastError: null,
      }));

      try {
        const response = await fetch(`/api/sessions/${sessionUuid}/status`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data: unknown = await response.json().catch(() => ({}));

        if (requestGeneration !== sessionGenerationRef.current) {
          return;
        }

        setStatusDiagnostics((current) => ({
          ...current,
          lastHttpStatus: response.status,
        }));

        if (!response.ok) {
          const fallbackMessage =
            data && typeof data === 'object' && 'error' in data && typeof (data as { error?: unknown }).error === 'string'
              ? (data as { error: string }).error
              : `Erro HTTP ${response.status}`;

          const diagnosticMessage = fallbackMessage;
          throw new Error(diagnosticMessage);
        }

        const statusPayload = normalizeSessionJobStatus(data);
        if (!statusPayload) {
          throw new Error('Resposta de status inválida.');
        }

        if (statusPayload.user_id) {
          setSessionUserId(statusPayload.user_id);
        }

        setPollingTimedOut(false);
        setProcessingStatus(statusPayload.status);
        setProcessingError(statusPayload.processing_error);
        setStatusDiagnostics((current) => ({
          ...current,
          lastHttpStatus: response.status,
          lastStatus: statusPayload.status,
          lastRawStatus: statusPayload.raw_status ?? statusPayload.status,
          lastError: null,
        }));

        if (statusPayload.status === 'completed') {
          if (!statusPayload.result) {
            setProcessingStatus('failed');
            setProcessingError('A API retornou completed sem payload de resultado.');
            setAnalysisResult(null);
            setStatusDiagnostics((current) => ({
              ...current,
              lastStatus: 'failed',
              lastError: 'A API retornou completed sem payload de resultado.',
            }));
            return;
          }

          setAnalysisResult(statusPayload.result);
          return;
        }

        if (statusPayload.status === 'failed') {
          setAnalysisResult(statusPayload.result);
          setProcessingError(statusPayload.processing_error ?? 'A sessão falhou no worker.');
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        if (requestGeneration !== sessionGenerationRef.current) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Não foi possível consultar o status da sessão.';
        setProcessingError(message);
        setStatusDiagnostics((current) => ({
          ...current,
          lastError: message,
        }));
      } finally {
        if (requestGeneration === sessionGenerationRef.current) {
          setIsRefreshing(false);
        }

        isPollingRequestRef.current = false;
      }
    },
    [sessionUuid]
  );

  useEffect(() => {
    if (!hasSession) {
      setStatusDiagnostics((current) => ({
        ...current,
        pollingActive: false,
      }));
      return undefined;
    }

    if (!shouldPoll) {
      setStatusDiagnostics((current) => ({
        ...current,
        pollingActive: false,
      }));
      return undefined;
    }

    let cancelled = false;
    setStatusDiagnostics((current) => ({
      ...current,
      pollingActive: true,
      lastError: null,
    }));

    // O timeout encerra o ciclo de polling explicitamente, em vez de deixar a UI presa no mesmo status.
    const timeoutId = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      setPollingTimedOut(true);
      setProcessingStatus('failed');
      setProcessingError('Sessão ainda não saiu da fila no tempo esperado.');
      setStatusDiagnostics((current) => ({
        ...current,
        pollingActive: false,
        lastError: 'Polling encerrado por timeout.',
      }));
    }, POLLING_TIMEOUT_MS);

    void refreshSessionStatus('poll');
    const intervalId = window.setInterval(() => {
      if (!cancelled) {
        void refreshSessionStatus('poll');
      }
    }, POLLING_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
      isPollingRequestRef.current = false;
    };
  }, [hasSession, refreshSessionStatus, shouldPoll]);

  const analysisReady = processingStatus === 'completed' && analysisResult !== null;
  const statusBanner = statusCopy(processingStatus, pollingTimedOut, processingError);
  const badgeLabel = statusLabel(processingStatus, pollingTimedOut);
  const badgeClass = statusClassName(processingStatus, pollingTimedOut);
  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (!hasSession) {
    return (
      <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.08),_transparent_22%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(15,23,42,0.98))] text-foreground">
        <header className="border-b border-white/10 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-sm font-semibold tracking-wide text-white">UX Auditor Dashboard</h1>
              <p className="text-xs text-slate-400">Upload rrweb e acompanhe a análise assíncrona em tempo real.</p>
            </div>
            <Badge variant="outline" className={`h-6 px-2 text-[10px] ${badgeClass}`}>
              {badgeLabel}
            </Badge>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-8 md:px-6">
          <div className="w-full max-w-5xl space-y-6">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.3em] text-sky-200">
                Upload seguro e replay
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Carregue um JSON rrweb para abrir o dashboard de análise.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-base">
                O fluxo abaixo ocupa a tela útil inteira e foi pensado como um estado vazio deliberado, não como sobra de layout.
              </p>
            </div>

            <div className="flex justify-center">
              <FileUploader onFileLoaded={handleFileLoaded} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.10),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.08),_transparent_22%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(15,23,42,0.98))] text-foreground">
      <header className="border-b border-white/10 px-4 py-3 backdrop-blur md:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={resetSession}
              className="shrink-0 text-slate-300 hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <FileJson className="h-4 w-4 text-sky-300" />
                <h1 className="truncate text-sm font-semibold text-white">
                  Sessão {sessionUuid.slice(0, 8) || 'ativa'}
                </h1>
                <Badge variant="outline" className={`h-6 px-2 text-[10px] ${badgeClass}`}>
                  {badgeLabel}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>{statusBanner}</span>
                {submissionMessage && processingStatus === 'uploading' && (
                  <span className="rounded-full border border-white/10 px-2 py-0.5">
                    {submissionMessage}
                  </span>
                )}
                {sessionUserId && <span className="rounded-full border border-white/10 px-2 py-0.5">user {sessionUserId}</span>}
                {analysisReady && (
                  <span className="rounded-full border border-cyan-400/30 px-2 py-0.5 text-cyan-300">resultado pronto</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => void refreshSessionStatus('manual')}
              disabled={isRefreshing || processingStatus === 'uploading'}
              className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Reconsultar status
            </Button>
            <Button onClick={resetSession} className="bg-sky-400 text-slate-950 hover:bg-sky-300">
              Nova sessão
            </Button>
          </div>
        </div>
      </header>

      {processingError && (
        <div className="mx-4 mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-50 md:mx-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-200" />
            <div className="min-w-0">
              <p className="font-medium">Falha no fluxo assíncrono</p>
              <p className="mt-1 text-red-50/80">{processingError}</p>
            </div>
          </div>
        </div>
      )}

      <main className="grid flex-1 min-h-0 gap-4 p-4 md:p-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] xl:grid-cols-[minmax(0,2.2fr)_minmax(360px,1fr)]">
        <section className="flex min-h-0 min-w-0 flex-col gap-4">
          <Card className="flex min-h-0 flex-col py-0 overflow-hidden border-white/10 bg-white/[0.03] shadow-2xl shadow-slate-950/30">
            <CardHeader className="border-b border-white/10 !py-6">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
                <Sparkles className="h-4 w-4 text-sky-300" />
                Replay da sessão
              </CardTitle>
            </CardHeader>

            <CardContent className="flex min-h-0 min-w-0 flex-1 w-full p-0 overflow-hidden">
              <div className="flex min-h-0 min-w-0 flex-1 w-full pt-6 overflow-hidden">
                <VideoPlayer
                  key={sessionUuid}
                  events={uploadedEvents}
                  currentTime={currentTime}
                  overlays={activeOverlays}
                  onTimeUpdate={setCurrentTime}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="flex min-h-0 min-w-0 flex-col lg:pt-0">
          <Card className="h-full min-h-0 border-white/10 bg-white/[0.03] shadow-lg shadow-slate-950/20">
            <CardHeader className="border-b border-white/10 pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-white">
                Estado da ingestão
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Status</p>
                <p className="mt-1 text-sm text-white">{badgeLabel}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Duração local</p>
                <p className="mt-1 text-sm text-white">{sessionDuration} ms</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Eventos</p>
                <p className="mt-1 text-sm text-white">{uploadedEvents.length}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Janela atual</p>
                <p className="mt-1 text-sm text-white">{currentTime} ms</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="flex min-h-0 min-w-0 flex-col lg:col-span-2">
          <InsightsPanel
            result={analysisReady ? analysisResult : null}
            currentTime={currentTime}
            processingStatus={processingStatus}
            processingError={processingError}
            onRetryStatus={() => void refreshSessionStatus('manual')}
          />
        </section>
      </main>

      {isDevelopment && (
        <div className="px-4 pb-4 md:px-6">
          <DiagnosticsPanel data={statusDiagnostics} />
        </div>
      )}
    </div>
  );
}
