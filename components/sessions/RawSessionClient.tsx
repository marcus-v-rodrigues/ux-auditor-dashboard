"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { JsonTree } from "@/components/sessions/JsonTree";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSessionRawResponse } from "@/lib/rrweb";
import type { SessionRawResponse } from "@/types/dashboard";

export function RawSessionClient({ uuid }: { uuid: string }) {
  const [payload, setPayload] = useState<SessionRawResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadRawData() {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/sessions/${uuid}/raw`, {
          headers: { "Content-Type": "application/json" },
        });
        const data: unknown = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message =
            data && typeof data === "object" && "error" in data
              ? String((data as { error?: unknown }).error ?? "Erro ao carregar JSON bruto")
              : `Erro HTTP ${response.status}`;
          throw new Error(message);
        }

        if (!isSessionRawResponse(data)) {
          throw new Error("Payload bruto fora do contrato esperado.");
        }

        if (active) {
          setPayload(data);
          setError(null);
        }
      } catch (fetchError) {
        if (active) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Nao foi possivel carregar os dados brutos."
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadRawData();
    return () => {
      active = false;
    };
  }, [uuid]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <Card className="border-white/10 bg-white/[0.03] shadow-2xl shadow-slate-950/30">
        <CardHeader className="border-b border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold uppercase tracking-[0.28em] text-white">
                JSON bruto da sessão
              </CardTitle>
              <p className="mt-2 text-sm text-slate-400">
                Eventos rrweb e metadados pré-processados da sessão {uuid}.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white"
            >
              <Link href={`/sessions/${uuid}`}>Voltar ao detalhe</Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <p className="text-sm text-slate-300">Carregando dados brutos...</p>
          ) : error ? (
            <p className="text-sm text-red-200">{error}</p>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-3 text-xs text-slate-300 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                    Sessão
                  </p>
                  <p className="mt-2 font-mono text-slate-100">{payload?.session_uuid}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                    Usuario
                  </p>
                  <p className="mt-2 font-mono text-slate-100">{payload?.user_id}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                    Timestamp
                  </p>
                  <p className="mt-2 font-mono text-slate-100">{payload?.timestamp}</p>
                </div>
              </div>

              <div className="overflow-auto rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
                  Events
                </h3>
                <JsonTree value={payload?.events ?? []} />
              </div>

              <div className="overflow-auto rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
                  Metadata
                </h3>
                <JsonTree value={payload?.metadata ?? {}} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
