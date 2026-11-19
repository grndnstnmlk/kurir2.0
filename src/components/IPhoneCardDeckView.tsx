import React, { useState } from 'react';
import {
  Navigation,
  MessageCircle,
  Phone,
  CheckCircle2,
  Clock,
  MapPin,
  DollarSign,
  Package as PackageIcon,
  Check,
  Zap,
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
      <div className="flex flex-col items-center justify-center min-h-[500px] px-6 text-center text-[#00522d]">
        <div className="w-20 h-20 rounded-full bg-[#fce5df] flex items-center justify-center mb-5 text-[#db3c8a]">
          <PackageIcon className="w-10 h-10" />
        </div>
        <h2 className="text-4xl font-black font-beni text-[#db3c8a] uppercase leading-none">
          SEMUA SELESAI
        </h2>
        <p className="text-sm font-clash text-[#00522d] mt-2 max-w-xs mx-auto">
          Tidak ada paket aktif untuk diantar saat ini.
        </p>
        <button
          onClick={onOpenScan}
          className="mt-6 bg-[#db3c8a] hover:bg-[#c22e77] active:scale-95 text-white font-bold text-xs px-6 py-3.5 rounded-full transition cursor-pointer"
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
      className="flex flex-col justify-between min-h-[calc(100vh-140px)] w-full max-w-xl mx-auto px-5 py-6 select-none bg-[#fff8f6]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. Category / Section Label (Clash Grotesk 12-14px in #00522d) */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#db3c8a]"></span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#00522d] font-clash">
            URUTAN JALAN {safeIndex + 1} DARI {packages.length}
          </span>
        </div>

        {/* Status Pill Badge */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold font-clash ${
            isDelivered
              ? 'bg-[#00522d] text-[#fff8f6]'
              : isProblem
              ? 'bg-[#db3c8a] text-white'
              : 'bg-[#fce5df] text-[#00522d]'
          }`}
        >
          {isDelivered ? 'Terkirim' : isProblem ? 'Ada Kendala' : 'Belum Diantar'}
        </span>
      </div>

      {/* 2. Faded Echo Headline + Massive Display Headline Block (Beni 900, Line Height 0.70) */}
      <div className="relative my-3">
        {/* Faded Echo Headline in #fce5df */}
        <div className="font-beni font-black text-6xl sm:text-7xl uppercase text-[#fce5df] tracking-tight leading-none pointer-events-none select-none -mb-5 sm:-mb-7">
          DELIVERY DISPATCH
        </div>

        {/* Primary Display Headline in #db3c8a (Lipstick Magenta) */}
        <h1 className="font-beni font-black text-7xl sm:text-8xl md:text-9xl uppercase text-[#db3c8a] tracking-tight leading-[0.72] z-10 relative">
          STOP #{String(currentPkg.orderIndex).padStart(2, '0')}
        </h1>
      </div>

      {/* 3. Editorial Badges & Subtitle */}
      <div className="flex flex-wrap items-center gap-2 my-2">
        <span className="px-3.5 py-1 rounded-full text-xs font-bold font-clash bg-[#fce5df] text-[#00522d]">
          {currentPkg.trackingNumber}
        </span>

        {currentPkg.isCod ? (
          <span className="px-3.5 py-1 rounded-full text-xs font-bold font-clash bg-[#db3c8a] text-white flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            COD: {formatRupiah(currentPkg.codAmount)}
          </span>
        ) : (
          <span className="px-3.5 py-1 rounded-full text-xs font-bold font-clash bg-[#fce5df] text-[#00522d]">
            Non-COD (Lunas)
          </span>
        )}
      </div>

      {/* 4. Recipient & Full Editorial Address (Clash Grotesk 400-500 in #00522d, max 60ch) */}
      <div className="bg-[#fce5df]/60 border border-[#fce5df] rounded-[20px] p-5 my-3 space-y-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#db3c8a] font-clash">
            Penerima Paket:
          </p>
          <h2 className="text-2xl font-bold font-clash text-[#00522d] leading-snug">
            {currentPkg.recipientName}
          </h2>
          <p className="text-xs font-mono text-[#00522d]/80 mt-0.5">
            📞 {currentPkg.recipientPhone}
          </p>
        </div>

        <div className="pt-2 border-t border-[#fce5df]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#00522d] font-clash flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#db3c8a]" />
            Alamat Pengantaran:
          </p>
          <p className="text-sm text-[#00522d] font-clash leading-relaxed mt-1 max-w-[60ch]">
            {currentPkg.fullAddress}
          </p>
          {currentPkg.benchmark && (
            <div className="mt-2 text-xs bg-[#fff8f6] p-2.5 rounded-[10px] text-[#00522d] border border-[#fce5df]">
              <strong className="text-[#db3c8a]">Patokan:</strong> {currentPkg.benchmark}
            </div>
          )}
        </div>
      </div>

      {/* 5. Horizontal Dotted / Dashes Pagination (Agence Foudre style) */}
      <div className="flex items-center justify-center gap-2 my-2">
        {packages.map((_, idx) => {
          const isActive = idx === safeIndex;
          return (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'w-10 bg-[#db3c8a]'
                  : 'w-4 bg-[#fce5df] hover:bg-[#f29ebd]'
              }`}
              title={`Buka Stop #${idx + 1}`}
            />
          );
        })}
      </div>

      {/* 6. Action Buttons: Lipstick Magenta (#db3c8a) & Blush Cream (#fce5df) */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => handleOpenWhatsApp(currentPkg)}
          className="w-full bg-[#fce5df] hover:bg-[#f29ebd]/50 active:scale-95 text-[#00522d] font-clash font-bold text-sm py-3.5 px-4 rounded-[10px] transition flex items-center justify-center gap-2 cursor-pointer border border-[#fce5df]"
        >
          <MessageCircle className="w-4 h-4 text-[#00522d]" />
          <span>Chat WhatsApp</span>
        </button>

        <a
          href={getSingleNavigationUrl(currentPkg.lat, currentPkg.lng, currentPkg.fullAddress)}
          target="_blank"
          rel="noreferrer"
          className="w-full bg-[#db3c8a] hover:bg-[#c22e77] active:scale-95 text-white font-clash font-bold text-sm py-3.5 px-4 rounded-[10px] transition flex items-center justify-center gap-2 cursor-pointer text-center"
        >
          <Navigation className="w-4 h-4 text-white" />
          <span>Navigasi Maps</span>
        </a>
      </div>

      {/* 7. Tertiary Actions (Editorial Links) */}
      <div className="flex items-center justify-between text-xs font-clash font-semibold text-[#00522d] pt-4 border-t border-[#fce5df] mt-4">
        <button
          onClick={() =>
            onUpdateStatus(
              currentPkg.id,
              currentPkg.status === 'delivered' ? 'pending' : 'delivered'
            )
          }
          className="flex items-center gap-1.5 hover:text-[#db3c8a] transition cursor-pointer"
        >
          <Check className="w-4 h-4 text-[#db3c8a]" />
          <span>{isDelivered ? 'Batal Terkirim' : 'Tandai Paket Terkirim'}</span>
        </button>

        <button
          onClick={onOpenMapTab}
          className="hover:text-[#db3c8a] transition cursor-pointer underline decoration-[#db3c8a] underline-offset-4"
        >
          Lihat di Peta Rute →
        </button>
      </div>
    </div>
  );
};
