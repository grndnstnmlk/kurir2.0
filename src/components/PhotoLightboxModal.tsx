// src/components/PhotoLightboxModal.tsx
import React, { useEffect } from 'react';
import { X, Navigation, Edit3, Home, MapPin } from 'lucide-react';
import { getSingleNavigationUrl } from '../utils/routeOptimizer';

export interface PhotoLightboxData {
  url: string;
  title: string;
  address?: string;
  benchmark?: string;
  lat?: number;
  lng?: number;
}

interface PhotoLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PhotoLightboxData | null;
  onEditPoint?: () => void;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  isOpen,
  onClose,
  data,
  onEditPoint,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const hasCoords = typeof data.lat === 'number' && typeof data.lng === 'number' && (data.lat !== 0 || data.lng !== 0);
  const mapsUrl = hasCoords
    ? getSingleNavigationUrl(data.lat!, data.lng!, data.address || '')
    : undefined;

  return (
    <div
      className="fixed inset-0 z-60 bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-xl w-full bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Home className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                Foto Rumah Pelanggan
              </div>
              <h3 className="font-bold text-sm sm:text-base text-white truncate">
                {data.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer shrink-0"
            aria-label="Tutup foto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gambar Foto Penuh */}
        <div className="flex-1 overflow-hidden bg-black flex items-center justify-center p-2 min-h-[260px]">
          <img
            src={data.url}
            alt={data.title}
            className="w-full max-h-[62vh] sm:max-h-[70vh] object-contain rounded-2xl select-none"
          />
        </div>

        {/* Info Alamat & Patokan */}
        {(data.address || data.benchmark) && (
          <div className="px-4 py-2.5 bg-neutral-900/90 border-t border-neutral-800 text-xs text-neutral-300 space-y-1 shrink-0">
            {data.address && (
              <div className="flex items-start gap-1.5 text-neutral-300">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                <span className="line-clamp-2 leading-tight">{data.address}</span>
              </div>
            )}
            {data.benchmark && (
              <div className="text-[11px] text-amber-300/90 font-medium pl-5">
                Patokan: {data.benchmark}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition border border-neutral-700"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-400" />
                <span>Maps 🧭</span>
              </a>
            )}

            {onEditPoint && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditPoint();
                }}
                className="px-3.5 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-amber-300 font-semibold text-xs inline-flex items-center gap-1.5 transition border border-neutral-700 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Ubah Titik</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-white hover:bg-neutral-200 active:scale-95 text-neutral-950 font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
