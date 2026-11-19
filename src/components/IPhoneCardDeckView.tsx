import React, { useState } from 'react';
import {
  Navigation,
  MessageCircle,
  Phone,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  DollarSign,
  Package as PackageIcon,
  ChevronLeft,
  ChevronRight,
  Share2,
  ExternalLink,
  Check,
} from 'lucide-react';
import type { DeliveryPackage, PackageStatus } from '../types';
import { getSingleNavigationUrl } from '../utils/routeOptimizer';

interface IPhoneCardDeckViewProps {
  packages: DeliveryPackage[];
  onUpdateStatus: (id: string, status: PackageStatus, notes?: string) => void;
  whatsAppTemplate: string;
  onOpenScan: () => void;
  onOpenMapTab: () => void;
}

export const IPhoneCardDeckView: React.FC<IPhoneCardDeckViewProps> = ({
  packages,
  onUpdateStatus,
  whatsAppTemplate,
  onOpenScan,
  onOpenMapTab,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  if (packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] px-6 text-center text-white">
        <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-amber-400">
          <PackageIcon className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black tracking-tight">Tidak Ada Paket Hari Ini</h2>
        <p className="text-sm text-zinc-400 mt-2 max-w-xs">
          Semua paket telah diarsipkan atau belum ada paket yang discan.
        </p>
        <button
          onClick={onOpenScan}
          className="mt-6 bg-white text-black font-bold text-sm px-6 py-3.5 rounded-2xl shadow-xl active:scale-95 transition"
        >
          + Scan Resi Paket Baru
        </button>
      </div>
    );
  }

  const safeIndex = Math.min(currentIndex, packages.length - 1);
  const currentPkg = packages[safeIndex];

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleOpenWhatsApp = (pkg: DeliveryPackage) => {
    let codInfo = '';
    if (pkg.isCod && pkg.codAmount > 0) {
      codInfo = `🏷️ Paket COD (Bayar di Tempat): *${formatRupiah(pkg.codAmount)}* (Mohon siapkan uang pas ya Kak).`;
    } else {
      codInfo = '🏷️ Paket Non-COD (Sudah Lunas, tinggal serah terima).';
    }

    let text = whatsAppTemplate
      .replace(/{NAMA}/g, pkg.recipientName || 'Kak')
      .replace(/{RESI}/g, pkg.trackingNumber)
      .replace(/{INFO_COD}/g, codInfo)
      .replace(/{ALAMAT}/g, pkg.fullAddress);

    let phone = pkg.recipientPhone.replace(/\D/g, '');
    if (phone.startsWith('08')) {
      phone = '628' + phone.slice(2);
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Touch Swipe Handlers for iPhone Gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 45 && safeIndex < packages.length - 1) {
      setCurrentIndex(safeIndex + 1);
    } else if (diff < -45 && safeIndex > 0) {
      setCurrentIndex(safeIndex - 1);
    }
    setTouchStartX(null);
  };

  const isDelivered = currentPkg.status === 'delivered';
  const isProblem = currentPkg.status === 'rescheduled' || currentPkg.status === 'failed';

  return (
    <div
      className="flex flex-col items-center justify-between min-h-[calc(100vh-140px)] w-full max-w-md mx-auto px-5 py-2 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Floating Badge Bar */}
      <div className="w-full flex items-center justify-between py-2 text-xs text-zinc-400 font-semibold">
        <span className="tracking-wider uppercase text-[11px] font-bold text-zinc-300">
          Antaran {safeIndex + 1} dari {packages.length}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isDelivered ? 'bg-emerald-400' : isProblem ? 'bg-rose-500' : 'bg-amber-400 animate-pulse'
            }`}
          />
          <span className="text-zinc-200">
            {isDelivered ? 'Terkirim' : isProblem ? 'Kendala' : 'Sedang Menuju'}
          </span>
        </div>
      </div>

      {/* Main Hero Card (Refero Styled High-Radius White/Off-White Card) */}
      <div className="relative w-full aspect-[4/4.2] sm:aspect-[4/4] bg-[#f2f2f4] text-zinc-900 rounded-[32px] p-6 shadow-2xl flex flex-col justify-between overflow-hidden border border-white/20 transition-all duration-300">
        {/* Confetti or Status Dots */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Card Row: Badge / Resi & Squircle Action Icon */}
        <div className="flex items-start justify-between z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 text-white text-[11px] font-bold shadow-sm">
              <span>J&T EXPRESS</span>
              <span>•</span>
              <span className="font-mono text-amber-300">{currentPkg.trackingNumber}</span>
            </div>
            {currentPkg.isCod ? (
              <div className="block">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/90 text-zinc-950 text-xs font-black shadow">
                  <DollarSign className="w-3.5 h-3.5" />
                  COD: {formatRupiah(currentPkg.codAmount)}
                </span>
              </div>
            ) : (
              <div className="block">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[11px] font-bold">
                  Sudah Lunas (Non-COD)
                </span>
              </div>
            )}
          </div>

          {/* Refero Squircle Yellow/Amber Icon Button */}
          <div className="w-12 h-12 rounded-2xl bg-[#ffb703] text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-500/30 ring-4 ring-amber-400/20">
            <PackageIcon className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Center Visual Showcase: Big Destination Area Name */}
        <div className="my-auto py-3 text-center space-y-1.5 z-10">
          <div className="inline-block px-3 py-0.5 rounded-full bg-zinc-200/80 text-zinc-600 font-mono text-[11px] font-bold tracking-widest uppercase">
            {currentPkg.areaOrStreet.split(',')[0] || 'Alamat Tujuan'}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight leading-tight px-2">
            {currentPkg.recipientName}
          </h2>

          <p className="text-xs text-zinc-600 font-mono flex items-center justify-center gap-1">
            <Phone className="w-3 h-3 text-zinc-400" />
            <span>{currentPkg.recipientPhone}</span>
          </p>
        </div>

        {/* Bottom Card Info: Status & Location Pin */}
        <div className="pt-3 border-t border-zinc-200/80 flex items-center justify-between text-xs font-medium text-zinc-600 z-10">
          <div className="flex items-center gap-1.5 truncate max-w-[200px]">
            <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span className="truncate">{currentPkg.fullAddress}</span>
          </div>

          <button
            onClick={() =>
              onUpdateStatus(
                currentPkg.id,
                currentPkg.status === 'delivered' ? 'pending' : 'delivered'
              )
            }
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer ${
              isDelivered
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
          >
            {isDelivered ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Terkirim</span>
              </>
            ) : (
              <span>Tandai Selesai</span>
            )}
          </button>
        </div>
      </div>

      {/* Pagination Dashes (Refero Style Horizontal Dash Indicator) */}
      <div className="flex items-center justify-center gap-1.5 my-4">
        {packages.map((_, idx) => {
          const isActive = idx === safeIndex;
          return (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'w-9 bg-white shadow-sm'
                  : 'w-4 bg-zinc-800 hover:bg-zinc-700'
              }`}
              title={`Pindah ke Stop #${idx + 1}`}
            />
          );
        })}
      </div>

      {/* Big Display Title: STOP 001 (Refero MODEL 001 typography) */}
      <div className="text-center space-y-1 mb-2">
        <h1 className="text-4xl sm:text-5xl font-black tracking-widest text-white uppercase font-sans">
          STOP #{String(currentPkg.orderIndex).padStart(2, '0')}
        </h1>
        <p className="text-xs font-mono tracking-wider text-zinc-400">
          {currentPkg.areaOrStreet || 'Area Pengantaran'}
        </p>
      </div>

      {/* Address & Benchmark Description */}
      <div className="text-center max-w-sm mb-5 space-y-1.5">
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          {currentPkg.fullAddress}
        </p>
        {currentPkg.benchmark && (
          <div className="inline-block px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-medium">
            💡 <strong>Patokan:</strong> {currentPkg.benchmark}
          </div>
        )}
      </div>

      {/* Dual Pill Buttons (Refero Share & Get $15 Off layout) */}
      <div className="grid grid-cols-2 gap-3 w-full mb-3">
        <button
          onClick={() => handleOpenWhatsApp(currentPkg)}
          className="w-full bg-white hover:bg-zinc-200 active:scale-95 text-zinc-950 font-black text-sm py-3.5 px-4 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
          <span>Chat WA</span>
        </button>

        <a
          href={getSingleNavigationUrl(currentPkg.lat, currentPkg.lng, currentPkg.fullAddress)}
          target="_blank"
          rel="noreferrer"
          className="w-full bg-white hover:bg-zinc-200 active:scale-95 text-zinc-950 font-black text-sm py-3.5 px-4 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer text-center"
        >
          <Navigation className="w-4 h-4 text-blue-600 fill-blue-600" />
          <span>Buka Maps</span>
        </a>
      </div>

      {/* Bottom Tertiary Link (Refero "View in AR" style) */}
      <div className="flex items-center justify-center gap-4 text-xs font-semibold text-zinc-400 pb-1">
        <button
          onClick={onOpenMapTab}
          className="flex items-center gap-1.5 hover:text-white transition cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-red-500" />
          <span>Lihat di Peta Interaktif</span>
        </button>
        <span>•</span>
        <button
          onClick={() => {
            const note = prompt('Alasan rumah kosong / tunda:', 'Pagar terkunci / tidak ada orang');
            if (note !== null) {
              onUpdateStatus(currentPkg.id, 'rescheduled', note);
            }
          }}
          className="flex items-center gap-1 hover:text-amber-300 transition cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Rumah Kosong</span>
        </button>
      </div>

      {/* iOS Home Indicator Bar */}
      <div className="w-36 h-1 bg-white/40 rounded-full mx-auto mt-4 mb-1" />
    </div>
  );
};
