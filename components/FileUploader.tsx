'use client';

import React, { useState, useCallback } from 'react';
import { UploadCloud, FileJson, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

/**
 * Interface de props para o componente FileUploader
 * @property onFileLoaded - Callback executado quando o arquivo é carregado e validado com sucesso.
 * Recebe um array de eventos rrweb e o session_uuid retornado pela API.
 */
interface Props {
  onFileLoaded: (events: any[], sessionUuid: string) => void;
}

/**
 * Interface para resposta da API /ingest
 */
interface IngestResponse {
  session_uuid: string;
  message?: string;
}

/**
 * Interface para erro da API
 */
interface ApiError {
  error: string;
}

/**
 * Estados possíveis do upload
 */
type UploadState = 'idle' | 'validating' | 'uploading' | 'success' | 'error';

/**
 * Componente responsável pelo upload de arquivos JSON contendo sessões gravadas pelo rrweb.
 *
 * Funcionalidades:
 * - Upload via clique no botão de seleção
 * - Upload via drag & drop (arrastar e soltar)
 * - Validação de formato JSON
 * - Validação de estrutura (deve ser um array de eventos)
 * - Integração com API /ingest para persistência
 * - Feedback visual de loading/erro/sucesso
 *
 * @param onFileLoaded - Função callback para processar os eventos carregados e o UUID da sessão
 */
export function FileUploader({ onFileLoaded }: Props) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Limpa o estado de erro e reseta para o estado inicial
   */
  const clearError = useCallback(() => {
    setErrorMessage('');
    setUploadState('idle');
  }, []);

  /**
   * Exibe uma mensagem de erro
   */
  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    setUploadState('error');
  }, []);

  /**
   * Manipula a seleção de arquivo através do input de arquivo.
   * Extrai o primeiro arquivo selecionado e inicia o processamento.
   *
   * @param event - Evento de mudança do input HTML
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processFile(file);
    // Reset input para permitir selecionar o mesmo arquivo novamente
    event.target.value = '';
  };

  /**
   * Manipula o evento de drag over
   */
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  /**
   * Manipula o evento de drag leave
   */
  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  /**
   * Manipula o evento de drop (arrastar e soltar) de arquivos.
   * Previne o comportamento padrão do navegador e processa o arquivo.
   *
   * @param event - Evento de drag & drop do React
   */
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    
    processFile(file);
  };

  /**
   * Processa o arquivo JSON carregado e envia para a API.
   *
   * Etapas:
   * 1. Valida se o arquivo é do tipo JSON
   * 2. Lê o conteúdo do arquivo usando FileReader
   * 3. Faz o parse do JSON
   * 4. Valida se a estrutura é um array (formato esperado do rrweb)
   * 5. Envia para a API /ingest
   * 6. Invoca o callback com os eventos e o session_uuid
   *
   * @param file - Arquivo a ser processado
   */
  const processFile = async (file: File) => {
    // Validação do tipo MIME e extensão do arquivo
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      showError('Por favor, envie apenas arquivos .json');
      return;
    }

    setUploadState('validating');
    setErrorMessage('');

    // Leitura assíncrona do arquivo
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        // Parse do conteúdo JSON
        const text = e.target?.result as string;
        let json: unknown;
        
        try {
          json = JSON.parse(text);
        } catch {
          showError('Erro ao processar o arquivo. Verifique se é um JSON válido.');
          return;
        }
        
        // Validação da estrutura: deve ser um array de eventos rrweb
        if (!Array.isArray(json)) {
          showError('Estrutura de JSON inválida. Esperado um array de eventos rrweb.');
          return;
        }

        if (json.length === 0) {
          showError('O arquivo JSON está vazio. Por favor, forneça um array de eventos.');
          return;
        }

        // Enviar para a API
        setUploadState('uploading');
        
        try {
          const response = await fetch('/api/ingest', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: text,
          });

          const data: IngestResponse | ApiError = await response.json();

          if (!response.ok) {
            // Trata diferentes tipos de erro
            if (response.status === 401) {
              showError('Sessão expirada. Por favor, faça login novamente.');
            } else if (response.status === 502 || response.status === 503) {
              showError('A API está indisponível. Tente novamente mais tarde.');
            } else {
              const errorData = data as ApiError;
              showError(errorData.error || `Erro ao enviar arquivo: ${response.status}`);
            }
            return;
          }

          const successData = data as IngestResponse;
          
          // Sucesso!
          setUploadState('success');
          
          // Invoca o callback com os eventos e o UUID da sessão
          onFileLoaded(json, successData.session_uuid);
          
        } catch (fetchError) {
          console.error("Erro ao enviar para API", fetchError);
          
          // Verifica se é um erro de rede
          if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
            showError('Não foi possível conectar à API. Verifique sua conexão.');
          } else {
            showError('Erro inesperado ao enviar arquivo. Tente novamente.');
          }
        }
        
      } catch (err) {
        console.error("Erro ao processar JSON", err);
        showError('Erro inesperado ao processar o arquivo.');
      }
    };

    reader.onerror = () => {
      showError('Erro ao ler o arquivo. Tente novamente.');
    };

    reader.readAsText(file);
  };

  /**
   * Renderiza o ícone apropriado baseado no estado
   */
  const renderIcon = () => {
    switch (uploadState) {
      case 'validating':
      case 'uploading':
        return <Loader2 className="h-8 w-8 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-destructive" />;
      default:
        return <UploadCloud className="h-8 w-8 text-primary" />;
    }
  };

  /**
   * Renderiza a mensagem de status apropriada
   */
  const renderStatusMessage = () => {
    switch (uploadState) {
      case 'validating':
        return (
          <p className="text-sm text-muted-foreground">
            Validando arquivo...
          </p>
        );
      case 'uploading':
        return (
          <p className="text-sm text-muted-foreground">
            Enviando para o servidor...
          </p>
        );
      case 'success':
        return (
          <p className="text-sm text-green-600 dark:text-green-400">
            Arquivo enviado com sucesso!
          </p>
        );
      case 'error':
        return (
          <div className="text-center">
            <p className="text-sm text-destructive mb-2">
              {errorMessage}
            </p>
            <button
              onClick={clearError}
              className="text-sm text-primary hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        );
      default:
        return (
          <p className="mb-6 text-sm text-muted-foreground">
            Arraste seu arquivo <code className="bg-secondary px-1 py-0.5 rounded">.json</code> aqui ou clique para selecionar.
          </p>
        );
    }
  };

  const isProcessing = uploadState === 'validating' || uploadState === 'uploading';

  return (
    <div className="flex h-full w-full items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg border-border bg-card/50">
        <CardContent className="">
          <div 
            className={`
              flex flex-col items-center justify-center rounded-lg border-2 border-dashed 
              px-6 py-10 text-center transition-colors
              ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
              ${isProcessing ? 'cursor-not-allowed' : 'hover:bg-secondary/50 cursor-pointer'}
              ${uploadState === 'error' ? 'border-destructive/50 bg-destructive/5' : ''}
            `}
            onDragOver={isProcessing ? undefined : handleDragOver}
            onDragLeave={isProcessing ? undefined : handleDragLeave}
            onDrop={isProcessing ? undefined : handleDrop}
          >
            <div className="mb-4 rounded-full bg-secondary p-4">
              {renderIcon()}
            </div>
            
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Upload de Sessão (JSON)
            </h3>
            
            {renderStatusMessage()}

            {uploadState === 'idle' && (
              <>
                <label 
                  htmlFor="file-upload" 
                  className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors"
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
              <div className="mt-2">
                <div className="h-1 w-48 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse w-full" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
