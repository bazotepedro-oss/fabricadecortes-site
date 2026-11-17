'use client';

import { useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';

interface YouTubeEmbedProps {
  videoId: string;
  title: string;
  /**
   * Exibe o botão "Ativar som". Use apenas em um vídeo por página:
   * os navegadores só liberam áudio depois de um clique do usuário.
   */
  sound?: boolean;
  className?: string;
}

export function YouTubeEmbed({ videoId, title, sound = false, className }: YouTubeEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [soundOn, setSoundOn] = useState(false);

  const src =
    `https://www.youtube-nocookie.com/embed/${videoId}` +
    `?autoplay=1&mute=1&loop=1&playlist=${videoId}` +
    `&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`;

  function enableSound() {
    if (!sound) return;

    const frame = iframeRef.current;
    if (!frame?.contentWindow) return;

    const send = (func: string, args: unknown[] = []) => {
      frame.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*',
      );
    };

    send('unMute');
    send('setVolume', [100]);
    send('playVideo');
    setSoundOn(true);
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border border-white/10 bg-black shadow-[0_30px_90px_-30px_rgba(255,107,26,0.45)] ${className ?? ''}`}
    >
      <div className="relative aspect-video w-full">
        <iframe
          ref={iframeRef}
          src={src}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />

        {sound && !soundOn && (
          <button
            type="button"
            onClick={enableSound}
            className="absolute right-3 top-3 z-10 inline-flex items-center gap-2 rounded-full bg-brand px-3.5 py-2 text-[11px] font-bold text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-transform hover:scale-[1.03]"
          >
            <Volume2 className="h-3.5 w-3.5" /> Ativar som
          </button>
        )}
      </div>
    </div>
  );
}
