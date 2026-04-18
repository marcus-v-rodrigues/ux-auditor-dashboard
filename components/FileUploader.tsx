'use client';

import React, { useCallback, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, UploadCloud } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { RrwebSessionEvent, SessionJobSubmissionResponse } from '@/types/dashboard';
import { normalizeSessionJobSubmission } from '@/lib/normalization';
import { extractRrwebEvents } from '@/lib/rrweb';

interface Props {
  onFileLoaded: (events: RrwebSessionEvent[], submission: SessionJobSubmissionResponse) => void;
}

type UploadState = 'idle' | 'validating' | 'uploading' | 'success' | 'error';

export function FileUploader({ onFileLoaded }: Props) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const clearError = useCallback(() => {
    setErrorMessage('');
    setUploadState('idle');
  }, []);

  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    setUploadState('error');
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    void processFile(file);
    event.target.value = '';
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }

    void processFile(file);
  };

  const processFile = async (file: File) => {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      showError('Por favor, envie apenas arquivos .json');
      return;
    }

    setUploadState('validating');
    setErrorMessage('');

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = String(event.target?.result ?? '');

        let parsed: unknown;
        try {
          // Validamos o JSON localmente antes de bater na API para falhar rápido e com mensagem clara.
          parsed = JSON.parse(text);
        } catch {
          showError('Erro ao processar o arquivo. Verifique se é um JSON válido.');
          return;
        }

        const rrwebEvents = extractRrwebEvents(parsed);
        if (!rrwebEvents) {
          showError('Estrutura de JSON inválida. Esperado um objeto com rrweb.events não vazio.');
          return;
        }

        setUploadState('uploading');

        try {
          // O upload envia o envelope bruto para preservar os metadados da sessão.
          const response = await fetch('/api/ingest', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: text,
          });

          const data: unknown = await response.json().catch(() => ({}));
          const submission = normalizeSessionJobSubmission(data);

          if (!response.ok || !submission) {
            const message =
              data && typeof data === 'object' && 'error' in data && typeof (data as { error?: unknown }).error === 'string'
                ? (data as { error: string }).error
                : `Erro ao enviar arquivo: ${response.status}`;

            if (response.status === 502 || response.status === 503) {
              showError('A API está indisponível. Tente novamente mais tarde.');
            } else if (response.status === 401 || response.status === 403) {
              showError(message || 'Acesso negado. Verifique sua autenticação e permissões.');
            } else {
              showError(message);
            }
            return;
          }

          setUploadState('success');
          onFileLoaded(rrwebEvents as RrwebSessionEvent[], submission);
        } catch (fetchError) {
          console.error('Erro ao enviar para API', fetchError);

          if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
            showError('Não foi possível conectar à API. Verifique sua conexão.');
          } else {
            showError('Erro inesperado ao enviar arquivo. Tente novamente.');
          }
        }
      } catch (error) {
        console.error('Erro ao processar JSON', error);
        showError('Erro inesperado ao processar o arquivo.');
      }
    };

    reader.onerror = () => {
      showError('Erro ao ler o arquivo. Tente novamente.');
    };

    reader.readAsText(file);
  };

  const renderIcon = () => {
    switch (uploadState) {
      case 'validating':
      case 'uploading':
        return <Loader2 className="app-icon-accent h-8 w-8 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-[var(--status-success-text)]" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-[var(--status-error-text)]" />;
      default:
        return <UploadCloud className="app-icon-accent h-8 w-8" />;
    }
  };

  const renderStatusMessage = () => {
    switch (uploadState) {
      case 'validating':
        return <p className="app-text-soft text-sm">Validando arquivo...</p>;
      case 'uploading':
        return <p className="app-text-soft text-sm">Enviando sessão para ingestão assíncrona...</p>;
      case 'success':
        return <p className="text-sm text-[var(--status-success-text)]">Sessão enviada. O worker irá processar em segundo plano.</p>;
      case 'error':
        return (
          <div className="text-center">
            <p className="mb-2 text-sm text-[var(--status-error-text)]">{errorMessage}</p>
            <button onClick={clearError} className="app-icon-accent text-sm hover:underline">
              Tentar novamente
            </button>
          </div>
        );
      default:
        return (
          <p className="app-text-soft mb-6 text-sm">
            Arraste seu arquivo <code className="app-code rounded px-1 py-0.5">.json</code> aqui ou clique para selecionar.
          </p>
        );
    }
  };

  const isProcessing = uploadState === 'validating' || uploadState === 'uploading';

  return (
    <div className="w-full flex justify-center">
      <Card className="app-panel w-full max-w-2xl py-0">
        <CardContent className="p-6 md:p-8">
          <div
            className={[
              'flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center transition-colors',
              isDragging ? 'app-status-queued' : 'app-panel-muted',
              isProcessing ? 'cursor-not-allowed' : 'cursor-pointer hover:border-[var(--status-queued-border)] hover:app-hover-surface',
              uploadState === 'error' ? 'app-status-error' : '',
            ].join(' ')}
            onDragOver={isProcessing ? undefined : handleDragOver}
            onDragLeave={isProcessing ? undefined : handleDragLeave}
            onDrop={isProcessing ? undefined : handleDrop}
          >
            <div className="app-elevated mb-4 rounded-full p-4 shadow-lg">{renderIcon()}</div>

            <h3 className="app-heading mb-2 text-lg font-semibold">Upload de sessão</h3>

            {renderStatusMessage()}

            {uploadState === 'idle' && (
              <>
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Selecionar Arquivo
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
              </>
            )}

            {isProcessing && (
              <div className="mt-2 w-full max-w-xs">
                <div className="app-progress-track h-1.5 overflow-hidden rounded-full">
                  <div className="h-full w-full animate-pulse bg-gradient-to-r from-[var(--status-queued-border)] to-[var(--status-success-border)]" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
