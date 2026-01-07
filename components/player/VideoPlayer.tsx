// src/components/player/VideoPlayer.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';
import { InsightEvent } from '@/types/dashboard';
import { Play, Pause, FastForward, RotateCcw } from 'lucide-react';

/**
 * Interface de props para o componente VideoPlayer
 * @property events - Array de eventos rrweb gravados da sessão
 * @property onTimeUpdate - Callback executado quando o tempo de reprodução muda
 * @property overlays - Array de insights para exibir como overlays visuais
 * @property currentTime - Tempo atual da reprodução em milissegundos (controlado externamente)
 */
interface Props {
  events: any[];
  onTimeUpdate: (time: number) => void;
  overlays: InsightEvent[];
  currentTime: number;
}

/**
 * Componente principal de reprodução de sessões rrweb.
 *
 * Funcionalidades:
 * - Reprodução de sessões gravadas usando a biblioteca rrweb-player
 * - Controles customizados de playback (play/pause, seek, velocidade, restart)
 * - Sincronização de tempo com componentes externos (painéis de insights/telemetria)
 * - Exibição de overlays visuais para insights/anomalias detectadas
 * - Layout responsivo com escala automática (fit screen)
 * - Gerenciamento de estado de reprodução
 *
 * @param events - Eventos da sessão rrweb
 * @param onTimeUpdate - Callback para atualização de tempo
 * @param overlays - Insights para exibir como overlays
 * @param currentTime - Tempo atual controlado externamente
 */
export default function VideoPlayer({ events, onTimeUpdate, overlays, currentTime }: Props) {
  // Refs para elementos DOM
  const containerRef = useRef<HTMLDivElement>(null); // Container onde o rrweb-player é renderizado
  const wrapperRef = useRef<HTMLDivElement>(null);  // Wrapper responsável pelo layout e escala
  
  // Instância do Player rrweb
  const [playerInstance, setPlayerInstance] = useState<any>(null);
  
  // Estados de Controle de Reprodução
  const [isPlaying, setIsPlaying] = useState(false); // Estado de play/pause
  const [speed, setSpeed] = useState(1);             // Velocidade de reprodução (0.5x, 1x, 2x, 4x)
  const [duration, setDuration] = useState(0);       // Duração total da sessão em ms

  // Estados de Layout para "Fit Screen" (escala responsiva)
  const [playerState, setPlayerState] = useState({
    width: 0,      // Largura original do vídeo
    height: 0,     // Altura original do vídeo
    scale: 1,      // Fator de escala aplicado
    marginLeft: 0, // Margem esquerda para centralização
    marginTop: 0   // Margem superior para centralização
  });

  /**
   * 1. INICIALIZAÇÃO E CONFIGURAÇÃO DO PLAYER
   *
   * Este useEffect é executado quando os eventos mudam e configura o player rrweb:
   * - Extrai metadados da sessão (dimensões, duração)
   * - Instancia o player rrweb com configurações customizadas
   * - Configura listeners de estado
   * - Implementa lógica de "fit screen" responsiva
   * - Inicia autoplay seguro (com delay para evitar bloqueios)
   */
  useEffect(() => {
    // Validação: só inicializa se houver container e eventos
    if (!containerRef.current || !events || events.length === 0) return;
    
    // Limpeza do container antes de criar nova instância
    containerRef.current.innerHTML = '';

    // Extração de metadados da sessão
    // Tipo 4 = Meta event (contém dimensões da tela)
    const metaEvent = events.find((e: any) => e.type === 4);
    const videoW = metaEvent?.data?.width || 1024;  // Largura padrão se não encontrado
    const videoH = metaEvent?.data?.height || 576;   // Altura padrão se não encontrado

    // Cálculo da duração total da sessão
    const lastEvent = events[events.length - 1];
    const firstEvent = events[0];
    const totalTime = (lastEvent?.timestamp || 0) - (firstEvent?.timestamp || 0);
    setDuration(totalTime);

    // Instanciação do player rrweb usando a API oficial
    const player = new rrwebPlayer({
      target: containerRef.current,
      props: {
        events: events,
        width: videoW,
        height: videoH,
        autoPlay: false,           // Não inicia automaticamente (controlamos manualmente)
        showController: false,     // Desativa a UI nativa do rrweb (usamos nossa UI customizada)
      },
    });

    // Listener de estado oficial da documentação rrweb
    // Atualiza o estado de play/pause quando o player muda internamente
    player.addEventListener('ui-update-player-state', (event: any) => {
        const state = event.payload; // 'playing', 'paused', ou 'ended'
        setIsPlaying(state === 'playing');
    });

    // Armazena a instância do player para uso nos controles
    setPlayerInstance(player);

    // Autoplay seguro com delay de 500ms
    // Navegadores podem bloquear autoplay imediato, então usamos um try-catch
    setTimeout(() => {
        try {
            player.play(); // API oficial do rrweb-player
            setIsPlaying(true);
        } catch (e) {
            console.warn("Autoplay bloqueado pelo navegador", e);
        }
    }, 500);

    /**
     * Lógica de "Fit Screen" (Escalamento Responsivo)
     *
     * Calcula a escala necessária para que o vídeo se ajuste ao container
     * mantendo a proporção original (aspect ratio) e centralizando-o.
     */
    const updateDimensions = () => {
        if (!wrapperRef.current) return;
        
        // Dimensões disponíveis no container
        const availableW = wrapperRef.current.clientWidth;
        const availableH = wrapperRef.current.clientHeight;
        
        // Calcula a escala mínima para caber no container (maintain aspect ratio)
        const scale = Math.min(availableW / videoW, availableH / videoH);

        // Atualiza o estado de layout
        setPlayerState({
            width: videoW,
            height: videoH,
            scale,
            marginLeft: (availableW - (videoW * scale)) / 2,  // Centraliza horizontalmente
            marginTop: (availableH - (videoH * scale)) / 2    // Centraliza verticalmente
        });
    };

    // Observa mudanças de tamanho do container para recalcular a escala
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (wrapperRef.current) resizeObserver.observe(wrapperRef.current);
    
    // Atualização inicial após pequeno delay para garantir que o DOM está pronto
    setTimeout(updateDimensions, 100);

    // Cleanup: desconecta o observer quando o componente desmonta ou eventos mudam
    return () => resizeObserver.disconnect();
  }, [events]);

  /**
   * 2. LOOP DE SINCRONIZAÇÃO DE TEMPO
   *
   * Este useEffect sincroniza o tempo de reprodução do rrweb-player
   * com componentes externos (painéis de insights e telemetria).
   *
   * IMPORTANTE: Removemos 'currentTime' e 'onTimeUpdate' das dependências
   * para evitar que o loop reinicie a cada milissegundo, o que causaria
   * problemas de performance e re-renders desnecessários.
   */
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // Só executa o loop se o player estiver tocando e instanciado
    if (isPlaying && playerInstance) {
      /**
       * Usamos setInterval em vez de requestAnimationFrame porque:
       * - 50ms (20fps) é suave o suficiente para atualização de UI
       * - Muito mais leve para o React (menos re-renders)
       * - requestAnimationFrame causaria atualizações excessivas (60fps)
       */
      intervalId = setInterval(() => {
        /**
         * Acessa o motor interno do rrweb (replayer)
         * Algumas versões usam .replayer, outras .getReplayer()
         * Verificamos ambos para compatibilidade
         */
        const internalReplayer = playerInstance.replayer || (playerInstance.getReplayer && playerInstance.getReplayer());

        if (internalReplayer) {
          // Obtém o tempo atual de reprodução do rrweb
          const time = internalReplayer.getCurrentTime();
          
          // Notifica o componente pai sobre a mudança de tempo
          // Isso atualiza painéis de insights e telemetria
          onTimeUpdate(time);

          // Verifica se a reprodução chegou ao fim
          if (duration > 0 && time >= duration) {
            setIsPlaying(false);
            playerInstance.pause();
          }
        }
      }, 50); // 50ms = 20 atualizações por segundo (balance ideal entre suavidez e performance)
    }

    // Cleanup: limpa o intervalo quando o componente desmonta ou estado muda
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, playerInstance, duration]); // Dependências limpas e otimizadas

  /**
   * 3. FUNÇÕES DE CONTROLE DE REPRODUÇÃO
   *
   * Todas as funções utilizam a API oficial do rrweb-player
   * conforme documentação da biblioteca.
   */
  
  /**
   * Alterna entre play e pause
   * Usa os métodos play() e pause() da API oficial do rrweb-player
   */
  const togglePlay = () => {
    if (!playerInstance) return;
    
    // Usa os métodos play() e pause() da API oficial
    if (isPlaying) {
      playerInstance.pause();
    } else {
      playerInstance.play();
    }
    
    // Atualiza o estado visual imediatamente para feedback instantâneo no botão
    // O listener 'ui-update-player-state' também atualizará, mas isso garante resposta rápida
    setIsPlaying(!isPlaying);
  };

  /**
   * Manipula a busca (seek) para um ponto específico da timeline
   * Usa o método goto(time) da API oficial do rrweb-player
   *
   * @param e - Evento do input range
   */
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    
    // Atualiza o tempo visualmente imediatamente para feedback responsivo
    onTimeUpdate(time);
    
    if (playerInstance) {
      // API oficial: vai para o timestamp especificado
      playerInstance.goto(time);
      
      // O método goto() às vezes pausa a reprodução, então forçamos play se estava tocando
      if (isPlaying) {
          playerInstance.play();
      }
    }
  };

  /**
   * Cicla entre velocidades de reprodução: 1x → 2x → 4x → 0.5x → 1x
   * Usa o método setSpeed(number) da API oficial do rrweb-player
   */
  const cycleSpeed = () => {
    if (!playerInstance) return;
    
    // Ciclo de velocidades: 1x → 2x → 4x → 0.5x → 1x (repete)
    const nextSpeed = speed === 1 ? 2 : speed === 2 ? 4 : speed === 4 ? 0.5 : 1;
    
    // API oficial: define a velocidade de reprodução
    playerInstance.setSpeed(nextSpeed);
    setSpeed(nextSpeed);
  };

  /**
   * Reinicia a reprodução do início
   * Usa os métodos goto(0) e play() da API oficial
   */
  const restart = () => {
    if(playerInstance) {
        // API oficial: vai para o início (timestamp 0)
        playerInstance.goto(0);
        // API oficial: inicia a reprodução
        playerInstance.play();
        setIsPlaying(true);
    }
  };

  /**
   * Formata milissegundos para o formato mm:ss
   * Exemplo: 125000 → "02:05"
   *
   * @param ms - Tempo em milissegundos
   * @returns String formatada no formato mm:ss
   */
  const formatTime = (ms: number) => {
    if (!ms || ms < 0) return "00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      
      {/*
        ÁREA DE VÍDEO (REPLAY)
        Container responsável pela exibição da sessão gravada.
        Usa refs para controle de escala e posicionamento.
      */}
      <div className="flex-1 relative overflow-hidden min-h-0 bg-black/50 mx-4 mt-4 border border-slate-800 rounded-t-lg" ref={wrapperRef}>
        {/*
          Div escalável que contém o player e os overlays
          Aplica transformações CSS para "fit screen" responsivo
        */}
        <div
          style={{
              width: playerState.width,
              height: playerState.height,
              transform: `scale(${playerState.scale})`,           // Escala calculada
              transformOrigin: 'top left',                        // Ponto de origem da escala
              position: 'absolute',
              left: playerState.marginLeft,                       // Centralização horizontal
              top: playerState.marginTop,                         // Centralização vertical
          }}
        >
            {/* Container onde o rrweb-player renderiza a sessão */}
            <div ref={containerRef} className="w-full h-full shadow-2xl bg-white" />
            
            {/*
              OVERLAYS DE INSIGHTS
              Camada sobreposta que exibe bounding boxes e indicadores
              visuais para anomalias detectadas pela IA.
              pointer-events-none permite interações passarem através
            */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              {overlays.map((insight) => (
                // Só renderiza se o insight tiver uma bounding box definida
                insight.boundingBox && (
                  <div
                    key={insight.id}
                    className={`absolute border-2 ${
                      // Cor baseada na severidade: crítico = vermelho, aviso = amarelo
                      insight.severity === 'critical' ? 'border-red-500 bg-red-500/20' : 'border-yellow-500 bg-yellow-500/20'
                    }`}
                    style={{
                      // Posicionamento baseado nas coordenadas da bounding box
                      top: insight.boundingBox.top,
                      left: insight.boundingBox.left,
                      width: insight.boundingBox.width,
                      height: insight.boundingBox.height,
                    }}
                  >
                     {/*
                       Label flutuante acima da bounding box
                       Mostra o tipo de anomalia detectada
                     */}
                     <div className="absolute -top-6 left-0 flex items-center gap-1 bg-black/80 px-2 py-0.5 rounded text-[10px] text-white font-bold uppercase tracking-wider whitespace-nowrap">
                        {insight.type}
                     </div>
                  </div>
                )
              ))}
            </div>
        </div>
      </div>

      {/*
        PAINEL DE CONTROLE CUSTOMIZADO
        UI customizada para controle de reprodução, substituindo
        a UI nativa do rrweb-player para melhor integração visual.
      */}
      <div className="h-16 bg-slate-900 border-t border-slate-800 px-6 flex items-center gap-4 shrink-0 z-20 mx-4 rounded-b-lg mb-4 shadow-lg">
        
        {/* Botão Play/Pause - Controle principal de reprodução */}
        <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-colors shadow-lg shrink-0"
        >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
        </button>

        {/* Botão Reiniciar - Volta ao início da sessão */}
        <button onClick={restart} className="text-slate-400 hover:text-white p-2 transition-colors shrink-0">
            <RotateCcw size={18} />
        </button>

        {/* Display de Tempo - Mostra tempo atual e duração total */}
        <div className="text-xs font-mono text-slate-300 w-28 text-center bg-slate-800 py-1 rounded border border-slate-700 shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Slider de Progresso - Permite navegação pela timeline */}
        <div className="flex-1 group relative flex items-center w-full">
            <input 
                type="range" 
                min={0} 
                max={duration || 100} 
                value={currentTime ?? 0} // Fix para erro de controlled/uncontrolled
                onChange={handleSeek}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:h-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
        </div>

        {/* Botão de Velocidade - Cicla entre velocidades de reprodução */}
        <button
            onClick={cycleSpeed}
            className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded border border-slate-700 w-16 justify-center transition-colors shrink-0"
        >
            <FastForward size={14} />
            {speed}x
        </button>

      </div>
    </div>
  );
}