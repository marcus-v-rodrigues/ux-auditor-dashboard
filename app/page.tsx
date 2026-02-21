'use client';

import { useState } from 'react';
import { TelemetryPanel } from '@/components/player/TelemetryPanel';
import { InsightsPanel } from '@/components/player/InsightsPanel';
import VideoPlayer from '@/components/player/VideoPlayer';
import { FileUploader } from '@/components/FileUploader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileJson } from 'lucide-react';
import { InsightEvent, TelemetryLog } from '@/types/dashboard';

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(0);
  const [events, setEvents] = useState<any[]>([]); // Estado dos eventos rrweb
  const [fileName, setFileName] = useState<string>("");
  const [sessionUuid, setSessionUuid] = useState<string>("");

  // Dados auxiliares (telemetria/insights)
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [insights, setInsights] = useState<InsightEvent[]>([]);

  const handleFileLoaded = (uploadedEvents: any[], uuid: string) => {
    setEvents(uploadedEvents);
    setSessionUuid(uuid);
    setFileName(`Session: ${uuid.slice(0, 8)}...`);
    setLogs([]);
    setInsights([]);
  };

  const resetSession = () => {
    setEvents([]);
    setFileName("");
    setSessionUuid("");
    setCurrentTime(0);
  };

  // Filtra overlays ativos
  const activeOverlays = insights.filter(
    (i) => Math.abs(i.timestamp - currentTime) < 1000 && i.boundingBox
  );

  // SE NÃO TIVER ARQUIVO CARREGADO -> MOSTRA UPLOAD
  if (events.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-card">
           <h1 className="font-semibold text-lg text-foreground">UX Auditor</h1>
        </header>
        <FileUploader onFileLoaded={handleFileLoaded} />
      </div>
    );
  }

  // SE TIVER ARQUIVO -> MOSTRA PLAYER
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      
      {/* Lado Esquerdo */}
      <aside className="w-[280px] hidden md:block z-20 shadow-xl border-r border-border">
        <TelemetryPanel logs={logs} currentTime={currentTime} />
      </aside>

      {/* Centro (Palco) */}
      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="h-14 border-b border-border flex items-center px-4 bg-card justify-between shrink-0">
           <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={resetSession} className="text-muted-foreground hover:text-foreground">
               <ArrowLeft className="h-5 w-5" />
             </Button>
             <div>
               <h1 className="text-sm font-semibold text-foreground flex items-center gap-2">
                 <FileJson className="h-4 w-4 text-primary"/>
                 {fileName}
               </h1>
             </div>
           </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden min-h-0">  
          {/* Wrapper do Player: Força o player a ficar contido neste espaço */}
          <div className="flex-1 w-full h-full relative flex items-center justify-center min-h-0">
              <VideoPlayer 
                events={events}
                currentTime={currentTime}
                overlays={activeOverlays}
                onTimeUpdate={setCurrentTime}
              />
          </div>
          {/* Timeline Visual (Só aparece se tiver insights gerados) */}
          {insights.length > 0 && (
            <div className="w-full max-w-5xl mt-8 px-1">
               <div className="h-12 w-full bg-card border border-border rounded relative overflow-hidden">
                  <div 
                    className="absolute top-0 bottom-0 border-r border-primary bg-primary/5 transition-all duration-100 ease-linear"
                    style={{ width: `${(currentTime / (events[events.length-1]?.timestamp - events[0]?.timestamp)) * 100}%` }} 
                  />
                  {insights.map(i => (
                    <div 
                      key={i.id}
                      className={`absolute bottom-0 h-2 w-2 rounded-full mb-2 ml-[-4px] ${
                        i.severity === 'critical' ? 'bg-destructive' : 'bg-yellow-500'
                      }`}
                      style={{ left: `${(i.timestamp / 5000) * 100}%` }} // Nota: Cálculo de tempo precisa ser normalizado com o total do vídeo real
                    />
                  ))}
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Lado Direito */}
      <aside className="w-[300px] hidden lg:block z-20 shadow-xl border-l border-border">
        <InsightsPanel insights={insights} currentTime={currentTime} />
      </aside>

    </div>
  );
}