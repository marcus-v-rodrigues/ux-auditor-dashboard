"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Clock3, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { normalizeSessionHistoryList } from "@/lib/normalization";
import type { SessionHistoryItem } from "@/types/dashboard";

function statusClassName(status: SessionHistoryItem["status"]): string {
  switch (status) {
    case "completed":
      return "app-status-success";
    case "failed":
      return "app-status-error";
    case "processing":
      return "app-status-processing";
    default:
      return "app-status-queued";
  }
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Data indisponivel";
  }

  return parsed.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function SessionsHistoryClient() {
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSessions(refresh = false) {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetch("/api/sessions", {
        headers: { "Content-Type": "application/json" },
      });
      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data && typeof data === "object" && "error" in data
            ? String((data as { error?: unknown }).error ?? "Erro ao carregar sessoes")
            : `Erro HTTP ${response.status}`;
        throw new Error(message);
      }

      setSessions(normalizeSessionHistoryList(data));
      setError(null);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Nao foi possivel carregar o historico."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <Card className="app-panel-muted gap-2">
        <CardHeader className="app-divider border-b">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="app-heading text-sm font-semibold uppercase tracking-[0.28em]">
                Histórico de Sessões
              </CardTitle>
              <p className="app-text-soft mt-2 text-sm">
                Consulte as análise de sessões anteriores.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadSessions(true)}
              disabled={isRefreshing}
              className="app-outline-action hover:app-outline-action-hover"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="app-text-soft p-6 text-sm">Carregando sessoes...</div>
          ) : error ? (
            <div className="app-callout-error m-6 rounded-xl px-4 py-3 text-sm">{error}</div>
          ) : sessions.length === 0 ? (
            <div className="app-text-soft p-6 text-sm">
              Nenhuma sessão encontrada.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {sessions.map((session) => (
                <Link
                  key={session.session_uuid}
                  href={`/sessions/${session.session_uuid}`}
                  className="block transition-colors hover:app-hover-surface"
                >
                  <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="app-heading font-mono text-sm">
                          {session.session_uuid}
                        </span>
                        <Badge
                          variant="outline"
                          className={`h-6 px-2 text-[10px] ${statusClassName(session.status)}`}
                        >
                          {session.status}
                        </Badge>
                      </div>
                      <p className="app-text-soft line-clamp-2 text-sm">
                        {session.narrative_preview ?? "Sem narrativa resumida disponivel."}
                      </p>
                    </div>

                    <div className="app-text-soft flex shrink-0 items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4" />
                        <span>{formatDate(session.created_at)}</span>
                      </div>
                      <ArrowRight className="app-icon-accent h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
