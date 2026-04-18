"use client";

import { useRouter } from "next/navigation";

import { FileUploader } from "@/components/FileUploader";
import type {
  RrwebSessionEvent,
  SessionJobSubmissionResponse,
} from "@/types/dashboard";

export function NewSessionClient() {
  const router = useRouter();

  function handleFileLoaded(
    _events: RrwebSessionEvent[],
    submission: SessionJobSubmissionResponse
  ) {
    router.push(`/sessions/${submission.session_uuid}`);
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center px-4 py-10 md:px-6">
      <div className="w-full space-y-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="app-chip app-eyebrow mb-4 inline-flex rounded-full px-3 py-1 text-[10px] font-medium tracking-[0.3em]">
            Coleta de JSON
          </div>
          <h2 className="app-heading text-3xl font-semibold tracking-tight md:text-4xl">
            Envie uma sessão JSON para iniciar a auditoria.
          </h2>
          <p className="app-text-soft mt-3 text-sm leading-relaxed md:text-base">
            Apos a ingestão, a aplicação redireciona imediatamente para a sessão e inicia o acompanhamento do processamento.
          </p>
        </div>

        <FileUploader onFileLoaded={handleFileLoaded} />
      </div>
    </section>
  );
}
