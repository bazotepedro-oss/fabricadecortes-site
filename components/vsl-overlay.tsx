'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, X } from 'lucide-react';

interface VslOverlayProps {
  open: boolean;
  onClose: () => void;
}

const VSL_SRC = '/videos/vsl.mp4';
const FALLBACK_SRC = '/videos/demo.mp4';
const YOUTUBE_URL = process.env.NEXT_PUBLIC_VSL_YOUTUBE_URL || '';

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([\w-]{11})/,
  );
  return match ? match[1] : null;
}

export function VslOverlay({ open, onClose }: VslOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [src, setSrc] = useState(VSL_SRC);
  const [soundOn, setSoundOn] = useState(false);
  const [mounted, setMounted] = useState(false);

  const youtubeId = extractYouTubeId(YOUTUBE_URL);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setSoundOn(false);

    const timer = window.setTimeout(() => {
      if (!youtubeId) {
        videoRef.current?.play().catch(() => {});
      }
    }, 150);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    };
  }, [open, onClose, youtubeId]);

  function enableSound() {
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

  if (!open || !mounted) return null;

  const youtubeSrc = youtubeId
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(
        window.location.origin,
      )}`
    : '';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Apresentação Fábrica dos Cortes"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-white">Fábrica dos Cortes</p>
            <p className="text-[11px] text-white/60">Menos edição. Mais conteúdo no ar.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar apresentação"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_30px_90px_-30px_rgba(255,107,26,0.5)]">
          {youtubeId ? (
            <>
              <iframe
                ref={iframeRef}
                src={youtubeSrc}
                title="Apresentação Fábrica dos Cortes"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="h-full w-full"
              />
              {!soundOn && (
                <button
                  type="button"
                  onClick={enableSound}
                  className="absolute bottom-4 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-transform hover:scale-[1.03]"
                >
                  <Volume2 className="h-4 w-4" /> Ativar som
                </button>
              )}
            </>
          ) : (
            <video
              ref={videoRef}
              src={src}
              controls
              playsInline
              preload="metadata"
              poster="/banner.jpg"
              className="h-full w-full"
              onError={() => setSrc(FALLBACK_SRC)}
            />
          )}
        </div>

        <p className="mt-3 text-center text-[11px] text-white/50">
          {youtubeId ? 'Ative o som para ouvir a apresentação completa.' : 'Use o som para ouvir a apresentação completa.'}
        </p>
      </div>
    </div>,
    document.body,
  );
}
