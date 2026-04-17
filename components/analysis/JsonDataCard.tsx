"use client";

import { useMemo, useState } from "react";
import { Download, FileSearch, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface JsonDataCardProps {
  title: string;
  filename: string;
  value: unknown;
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value);
}

function downloadJsonFile(filename: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  const json = JSON.stringify(value, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function JsonDataCard({ title, filename, value }: JsonDataCardProps) {
  const [query, setQuery] = useState("");
  const json = useMemo(() => JSON.stringify(value, null, 2), [value]);
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");

  const filteredJson = useMemo(() => {
    if (!normalizedQuery) {
      return json;
    }

    return json
      .split("\n")
      .filter((line) => line.toLocaleLowerCase("pt-BR").includes(normalizedQuery))
      .join("\n");
  }, [json, normalizedQuery]);

  const lineCount = useMemo(() => json.split("\n").length, [json]);
  const visibleLineCount = useMemo(
    () => (filteredJson.length > 0 ? filteredJson.split("\n").length : 0),
    [filteredJson]
  );
  const charCount = json.length;
  const hasQuery = normalizedQuery.length > 0;
  const hasResults = filteredJson.length > 0;

  return (
    <Card className="w-full min-w-0 border-border/70 bg-card/80 shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
              <FileText className="h-4 w-4 text-sky-400" />
              {title}
            </CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-slate-400">
              <span className="rounded-full border border-white/10 px-2 py-1">{formatCompactNumber(lineCount)} linhas</span>
              <span className="rounded-full border border-white/10 px-2 py-1">{formatCompactNumber(charCount)} caracteres</span>
              <span className="rounded-full border border-white/10 px-2 py-1 font-mono normal-case text-slate-300">{filename}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-border/60 bg-background/60 text-[10px] uppercase tracking-wider text-slate-200 hover:bg-background/90 hover:text-white"
            onClick={() => downloadJsonFile(filename, value)}
          >
            <Download className="h-3.5 w-3.5" />
            Baixar JSON
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <FileSearch className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar texto no JSON"
              className="border-border/60 bg-background/60 pl-9 text-sm text-slate-100 placeholder:text-slate-500"
            />
          </div>
          {hasQuery ? (
            <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400">
              {formatCompactNumber(visibleLineCount)} linhas visiveis
            </span>
          ) : null}
        </div>

        <div className="rounded-xl border border-border/60 bg-background/70">
          <div className="flex items-center justify-between border-b border-border/60 px-3 py-2 text-[10px] uppercase tracking-wider text-slate-400">
            <span>{hasQuery ? "Resultado da busca" : "Visualizador"}</span>
            <span className="font-mono text-slate-500">JSON</span>
          </div>

          <ScrollArea className="h-[min(60vh,28rem)] min-h-0 min-w-0">
            {hasResults ? (
              <pre className="min-w-0 whitespace-pre-wrap break-all p-4 font-mono text-[11px] leading-relaxed text-slate-200 overflow-wrap-anywhere">
                {filteredJson}
              </pre>
            ) : (
              <div className="p-4 text-sm text-slate-400">
                Nenhuma linha corresponde a <span className="font-mono text-slate-200">{query}</span>.
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
