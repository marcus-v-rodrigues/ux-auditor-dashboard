'use client';

import React, { useCallback } from 'react';
import { UploadCloud, FileJson, AlertCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

/**
 * Interface de props para o componente FileUploader
 * @property onFileLoaded - Callback executado quando o arquivo é carregado e validado com sucesso.
 * Recebe um array de eventos rrweb.
 */
interface Props {
  onFileLoaded: (events: any[]) => void;
}

/**
 * Componente responsável pelo upload de arquivos JSON contendo sessões gravadas pelo rrweb.
 *
 * Funcionalidades:
 * - Upload via clique no botão de seleção
 * - Upload via drag & drop (arrastar e soltar)
 * - Validação de formato JSON
 * - Validação de estrutura (deve ser um array de eventos)
 * - Feedback visual de erro/sucesso
 *
 * @param onFileLoaded - Função callback para processar os eventos carregados
 */
export function FileUploader({ onFileLoaded }: Props) {
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
  };

  /**
   * Manipula o evento de drop (arrastar e soltar) de arquivos.
   * Previne o comportamento padrão do navegador e processa o arquivo.
   *
   * @param event - Evento de drag & drop do React
   */
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    
    processFile(file);
  };

  /**
   * Processa o arquivo JSON carregado.
   *
   * Etapas:
   * 1. Valida se o arquivo é do tipo JSON
   * 2. Lê o conteúdo do arquivo usando FileReader
   * 3. Faz o parse do JSON
   * 4. Valida se a estrutura é um array (formato esperado do rrweb)
   * 5. Invoca o callback com os eventos validados
   *
   * @param file - Arquivo a ser processado
   */
  const processFile = (file: File) => {
    // Validação do tipo MIME e extensão do arquivo
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      alert('Por favor, envie apenas arquivos .json');
      return;
    }

    // Leitura assíncrona do arquivo
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Parse do conteúdo JSON
        const json = JSON.parse(e.target?.result as string);
        
        // Validação da estrutura: deve ser um array de eventos rrweb
        if (Array.isArray(json)) {
          onFileLoaded(json);
        } else {
          alert('Estrutura de JSON inválida. Esperado um array de eventos rrweb.');
        }
      } catch (err) {
        console.error("Erro ao ler JSON", err);
        alert('Erro ao processar o arquivo. Verifique se é um JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-full w-full items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg border-border bg-card/50">
        <CardContent className="">
          <div 
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border px-6 py-10 text-center hover:bg-secondary/50 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="mb-4 rounded-full bg-secondary p-4">
              <UploadCloud className="h-8 w-8 text-primary" />
            </div>
            
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Session Upload (JSON)
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Drag your <code className="bg-secondary px-1 py-0.5 rounded">.json</code> file here or click to select.
            </p>

            <label htmlFor="file-upload" className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors">
              Select File
            </label>
            <input 
              id="file-upload" 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}