'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface VslOverlayProps {
  open: boolean;
  onClose: () => void;
}

const VSL_SRC = '/videos/vsl.mp4';
const FALLBACK_SRC = '/videos/demo.mp4';

export function VslOverlay({ open, onClose }: VslOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState(VSL_SRC);
  const [mounted, setMounted] = useState(false);

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

    const timer = window.setTimeout(() => {
      videoRef.current?.play().catch(() => {});
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
  }, [open, onClose]);

  if (!open || !mounted) return null;

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

        <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_30px_90px_-30px_rgba(255,107,26,0.5)]">
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
        </div>

        <p className="mt-3 text-center text-[11px] text-white/50">
          Use o som para ouvir a apresentação completa.
        </p>
      </div>
    </div>,
    document.body,
  );
}
