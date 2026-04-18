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
      <Card className="app-panel-muted">
        <CardHeader className="app-divider border-b">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="app-heading text-sm font-semibold uppercase tracking-[0.28em]">
                JSON bruto da sessão
              </CardTitle>
              <p className="app-text-soft mt-2 text-sm">
                Eventos rrweb e metadados pré-processados da sessão {uuid}.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="app-outline-action hover:app-outline-action-hover"
            >
              <Link href={`/sessions/${uuid}`}>Voltar ao detalhe</Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <p className="app-text-soft text-sm">Carregando dados brutos...</p>
          ) : error ? (
            <div className="app-callout-error rounded-xl px-4 py-3 text-sm">{error}</div>
          ) : (
            <div className="grid gap-4">
              <div className="app-text-soft grid gap-3 text-xs md:grid-cols-3">
                <div className="app-elevated rounded-xl p-3">
                  <p className="app-text-muted text-[10px] uppercase tracking-[0.24em]">
                    Sessão
                  </p>
                  <p className="app-heading mt-2 font-mono">{payload?.session_uuid}</p>
                </div>
                <div className="app-elevated rounded-xl p-3">
                  <p className="app-text-muted text-[10px] uppercase tracking-[0.24em]">
                    Usuario
                  </p>
                  <p className="app-heading mt-2 font-mono">{payload?.user_id}</p>
                </div>
                <div className="app-elevated rounded-xl p-3">
                  <p className="app-text-muted text-[10px] uppercase tracking-[0.24em]">
                    Timestamp
                  </p>
                  <p className="app-heading mt-2 font-mono">{payload?.timestamp}</p>
                </div>
              </div>

              <div className="app-elevated overflow-auto rounded-xl p-4">
                <h3 className="app-eyebrow mb-4 text-xs font-semibold tracking-[0.24em]">
                  Events
                </h3>
                <JsonTree value={payload?.events ?? []} />
              </div>

              <div className="app-elevated overflow-auto rounded-xl p-4">
                <h3 className="app-eyebrow mb-4 text-xs font-semibold tracking-[0.24em]">
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
