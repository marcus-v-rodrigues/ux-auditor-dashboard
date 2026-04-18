'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';
import { FastForward, Pause, Play, RotateCcw } from 'lucide-react';
import { InsightEvent, RrwebSessionEvent } from '@/types/dashboard';

type RrwebPlayerInstance = InstanceType<typeof rrwebPlayer>;
type RrwebPlayerWithDestroy = RrwebPlayerInstance & {
  destroy?: () => void;
};
type RrwebPlayerWithSizing = RrwebPlayerWithDestroy & {
  $set?: (props: { width?: number; height?: number }) => void;
  triggerResize?: () => void;
};
type PlayerStatePayload = {
  payload?: 'playing' | 'paused' | 'ended' | string;
};
type TimePayload = {
  payload?: number;
};

interface Props {
  events: RrwebSessionEvent[];
  onTimeUpdate: (time: number) => void;
  overlays: InsightEvent[];
  currentTime: number;
}

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;

function formatTime(ms: number): string {
  if (!ms || ms < 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getEventMetadata(events: RrwebSessionEvent[]): { width: number; height: number } {
  const metaEvent = events.find((event) => event.type === 4);

  return {
    width: metaEvent?.data?.width ?? DEFAULT_WIDTH,
    height: metaEvent?.data?.height ?? DEFAULT_HEIGHT,
  };
}

function fitStageSize(
  availableWidth: number,
  availableHeight: number,
  aspectRatio: number
): { width: number; height: number } {
  if (availableWidth <= 0 || availableHeight <= 0 || !Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return { width: 0, height: 0 };
  }

  const widthByHeight = availableHeight * aspectRatio;

  if (widthByHeight <= availableWidth) {
    return {
      width: Math.max(1, Math.floor(widthByHeight)),
      height: Math.max(1, Math.floor(availableHeight)),
    };
  }

  return {
    width: Math.max(1, Math.floor(availableWidth)),
    height: Math.max(1, Math.floor(availableWidth / aspectRatio)),
  };
}

export default function VideoPlayer({ events, onTimeUpdate, overlays, currentTime }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<RrwebPlayerWithSizing | null>(null);
  const layoutObserverRef = useRef<ResizeObserver | null>(null);
  const playerResizeObserverRef = useRef<ResizeObserver | null>(null);
  const stageSizeRef = useRef<{ width: number; height: number } | null>(null);
  const onTimeUpdateRef = useRef(onTimeUpdate);

  const [playerError, setPlayerError] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<'idle' | 'ready' | 'playing' | 'paused'>('idle');
  const [speed, setSpeed] = useState(1);
  const [stageSize, setStageSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  const hasPlayableEvents = events.length >= 2;
  const metadata = useMemo(() => getEventMetadata(events), [events]);
  const metadataAspectRatio = useMemo(() => {
    return metadata.width > 0 && metadata.height > 0 ? metadata.width / metadata.height : DEFAULT_WIDTH / DEFAULT_HEIGHT;
  }, [metadata.height, metadata.width]);
  const duration = useMemo(() => {
    if (events.length < 2) {
      return 0;
    }

    const firstTimestamp = events[0]?.timestamp ?? 0;
    const lastTimestamp = events[events.length - 1]?.timestamp ?? 0;
    return Math.max(0, lastTimestamp - firstTimestamp);
  }, [events]);

  const destroyPlayer = useCallback(() => {
    // A instância do rrweb precisa ser destruída explicitamente para não deixar iframe e listeners órfãos.
    playerResizeObserverRef.current?.disconnect();
    playerResizeObserverRef.current = null;

    if (playerRef.current) {
      try {
        playerRef.current.pause();
      } catch {
        // Cleanup defensivo: o destroy já cobre a liberação real.
      }

      try {
        playerRef.current.destroy?.();
      } catch {
        // Se a lib estiver em estado parcial, seguimos removendo o container manualmente.
      }
    }

    playerRef.current = null;

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
  }, []);

  useLayoutEffect(() => {
    if (!viewportRef.current || !hasPlayableEvents) {
      return;
    }

    const measureStage = () => {
      if (!viewportRef.current) {
        return;
      }

      const { width, height } = viewportRef.current.getBoundingClientRect();
      const nextSize = fitStageSize(width, height, metadataAspectRatio);

      stageSizeRef.current = nextSize;
      setStageSize((current) => {
        if (current?.width === nextSize.width && current?.height === nextSize.height) {
          return current;
        }

        return nextSize;
      });
    };

    measureStage();

    layoutObserverRef.current?.disconnect();
    layoutObserverRef.current = new ResizeObserver(measureStage);
    layoutObserverRef.current.observe(viewportRef.current);

    return () => {
      layoutObserverRef.current?.disconnect();
      layoutObserverRef.current = null;
    };
  }, [hasPlayableEvents, metadataAspectRatio]);

  useLayoutEffect(() => {
    let cancelled = false;
    destroyPlayer();

    if (!containerRef.current || !hasPlayableEvents) {
      return () => {
        cancelled = true;
      };
    }

    onTimeUpdateRef.current(0);

    try {
      const initialStageSize = stageSizeRef.current ?? metadata;
      const player = new rrwebPlayer({
        target: containerRef.current,
        props: {
          events,
          width: initialStageSize.width,
          height: initialStageSize.height,
          maxScale: 1,
          autoPlay: false,
          showController: false,
          speed: 1,
        },
      }) as RrwebPlayerWithDestroy;

      playerRef.current = player;

      // O player expõe eventos de estado e tempo; usamos isso para sincronizar a UI sem polling local.
      player.addEventListener('ui-update-player-state', (event: PlayerStatePayload) => {
        const nextState = event?.payload;
        setPlayerState(nextState === 'playing' ? 'playing' : nextState === 'paused' ? 'paused' : 'ready');
      });

      player.addEventListener('ui-update-current-time', (event: TimePayload) => {
        const time = typeof event?.payload === 'number' ? event.payload : 0;
        onTimeUpdateRef.current(time);
      });

      player.triggerResize();

      playerResizeObserverRef.current?.disconnect();
      playerResizeObserverRef.current = new ResizeObserver(() => {
        // O rrweb recalcula o frame interno quando o card muda de tamanho.
        player.triggerResize();
      });

      if (viewportRef.current) {
        playerResizeObserverRef.current.observe(viewportRef.current);
      }

      if (process.env.NODE_ENV !== 'production') {
        console.debug('[VideoPlayer] replay instanciado', {
          events: events.length,
          width: metadata.width,
          height: metadata.height,
        });
      }
    } catch (error) {
      queueMicrotask(() => {
        if (!cancelled) {
          setPlayerError(error instanceof Error ? error.message : 'Não foi possível inicializar o replay.');
        }
      });
    }

    return () => {
      cancelled = true;
      destroyPlayer();
    };
  }, [destroyPlayer, events, hasPlayableEvents, metadata]);

  useLayoutEffect(() => {
    if (!hasPlayableEvents || playerError || !stageSize || !playerRef.current) {
      return;
    }

    const player = playerRef.current;
    player.$set?.({ width: stageSize.width, height: stageSize.height });

    const frame = window.requestAnimationFrame(() => {
      player.triggerResize?.();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [hasPlayableEvents, playerError, stageSize]);

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player || playerError) {
      return;
    }

    if (playerState === 'playing') {
      player.pause();
      setPlayerState('paused');
      return;
    }

    player.play();
    setPlayerState('playing');
  }, [playerError, playerState]);

  const handleSeek = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const time = Number(event.target.value);
      onTimeUpdateRef.current(time);

      const player = playerRef.current;
      if (player) {
        // O goto recebe o time offset e, opcionalmente, continua tocando se o replay já estava em play.
        player.goto(time, playerState === 'playing');
      }
    },
    [playerState]
  );

  const cycleSpeed = useCallback(() => {
    const player = playerRef.current;
    if (!player || playerError) {
      return;
    }

    const nextSpeed = speed === 1 ? 2 : speed === 2 ? 4 : speed === 4 ? 0.5 : 1;
    player.setSpeed(nextSpeed);
    setSpeed(nextSpeed);
  }, [playerError, speed]);

  const restart = useCallback(() => {
    const player = playerRef.current;
    if (!player || playerError) {
      return;
    }

    player.goto(0, true);
    setPlayerState('playing');
    onTimeUpdateRef.current(0);
  }, [playerError]);

  const fallbackMessage = !hasPlayableEvents
    ? 'A sessão precisa de pelo menos dois eventos rrweb para renderizar um replay funcional.'
    : playerError;
  const isInteractive = hasPlayableEvents && !playerError;
  const showFallback = fallbackMessage !== null;
  const renderedStageSize = stageSize ?? metadata;

  return (
    <div className="app-elevated flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-xl shadow-[var(--app-shadow-soft)] backdrop-blur">
      <div
        ref={wrapperRef}
        className="app-stage relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden p-2"
      >
        <div ref={viewportRef} className="relative flex h-full min-h-0 min-w-0 w-full items-center justify-center overflow-hidden">
          {showFallback ? (
            <div className="flex min-h-[24rem] w-full items-center justify-center text-center">
              <div className="app-elevated max-w-md space-y-3 rounded-2xl px-6 py-7 shadow-[var(--app-shadow-soft)] backdrop-blur">
                <div className="app-chip app-eyebrow inline-flex rounded-full px-3 py-1 text-[10px] font-medium tracking-[0.3em]">
                  Replay indisponível
                </div>
                <h3 className="app-heading text-lg font-semibold">Não há replay suficiente para renderizar a sessão.</h3>
                <p className="app-text-soft text-sm leading-relaxed">
                  {fallbackMessage ?? 'O arquivo enviado precisa conter um snapshot e eventos suficientes para o rrweb-player montar o stage.'}
                </p>
              </div>
            </div>
          ) : (
            <div
              className="app-elevated relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-[var(--app-shadow-soft)]"
              style={{
                width: renderedStageSize.width,
                height: renderedStageSize.height,
              }}
            >
              <div ref={containerRef} className="h-full w-full" />
              <div className="app-elevated app-text-soft pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.28em] shadow-lg">
                <span className="bg-brand h-2 w-2 rounded-full" />
                {playerState === 'playing' ? 'Reproduzindo' : 'Reprise pronta'}
              </div>
              {overlays.length > 0 && (
                <div className="app-elevated app-text-soft pointer-events-none absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.28em] shadow-lg">
                  {overlays.length} overlay{overlays.length === 1 ? '' : 's'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="app-panel-muted app-divider flex flex-wrap items-center gap-3 border-t px-4 py-3">
        <button
          type="button"
          onClick={togglePlay}
          disabled={!isInteractive}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:app-disabled disabled:cursor-not-allowed"
          aria-label={playerState === 'playing' ? 'Pausar replay' : 'Reproduzir replay'}
        >
          {playerState === 'playing' ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={restart}
          disabled={!isInteractive}
          className="app-outline-action hover:app-outline-action-hover inline-flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Reiniciar replay"
        >
          <RotateCcw size={16} />
        </button>

        <div className="app-elevated app-heading min-w-[7rem] rounded-full px-3 py-2 font-mono text-xs">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={currentTime ?? 0}
            onChange={handleSeek}
            disabled={!isInteractive}
            className="app-divider app-progress-track h-1.5 w-full cursor-pointer appearance-none rounded-full border accent-primary disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="button"
          onClick={cycleSpeed}
          disabled={!isInteractive}
          className="app-outline-action hover:app-outline-action-hover inline-flex h-10 min-w-[4.75rem] items-center justify-center gap-1 rounded-full px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Alterar velocidade de reprodução"
        >
          <FastForward size={14} />
          {speed}x
        </button>
      </div>
    </div>
  );
}
