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
      return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
    case "failed":
      return "bg-red-500/15 text-red-200 border-red-500/30";
    case "processing":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    default:
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
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
      <Card className="border-white/10 bg-white/[0.03] shadow-2xl shadow-slate-950/30 gap-2">
        <CardHeader className="border-b border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold uppercase tracking-[0.28em] text-white">
                Histórico de Sessões
              </CardTitle>
              <p className="mt-2 text-sm text-slate-400">
                Consulte as análise de sessões anteriores.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadSessions(true)}
              disabled={isRefreshing}
              className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-slate-300">Carregando sessoes...</div>
          ) : error ? (
            <div className="p-6 text-sm text-red-200">{error}</div>
          ) : sessions.length === 0 ? (
            <div className="p-6 text-sm text-slate-300">
              Nenhuma sessão encontrada.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {sessions.map((session) => (
                <Link
                  key={session.session_uuid}
                  href={`/sessions/${session.session_uuid}`}
                  className="block transition-colors hover:bg-white/[0.03]"
                >
                  <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm text-white">
                          {session.session_uuid}
                        </span>
                        <Badge
                          variant="outline"
                          className={`h-6 px-2 text-[10px] ${statusClassName(session.status)}`}
                        >
                          {session.status}
                        </Badge>
                      </div>
                      <p className="line-clamp-2 text-sm text-slate-300">
                        {session.narrative_preview ?? "Sem narrativa resumida disponivel."}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4" />
                        <span>{formatDate(session.created_at)}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-sky-300" />
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
