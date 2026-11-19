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
  ArrowRight,
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
      <div className="flex flex-col items-center justify-center min-h-[500px] px-6 text-center text-[#222222] font-aspekta">
        <div className="w-16 h-16 rounded-[24px] bg-[#f4f4f5] border border-[#e4e4e7] flex items-center justify-center mb-4 text-[#292929]">
          <PackageIcon className="w-8 h-8 stroke-[1.5]" />
        </div>
        <p className="font-fasthand text-2xl text-[#696969] mb-1">semua beres,</p>
        <h2 className="text-3xl font-normal text-[#080808] tracking-[-0.03em]">
          Tidak Ada Paket Tersisa
        </h2>
        <p className="text-sm text-[#696969] mt-2 max-w-xs mx-auto">
          Semua antaran hari ini telah diselesaikan atau diarsipkan.
        </p>
        <button
          onClick={onOpenScan}
          className="mt-6 bg-[#292929] hover:bg-[#080808] active:scale-95 text-[#fafafa] font-medium text-xs px-6 py-3 rounded-full transition shadow-sm cursor-pointer"
        >
          + Tambah Resi Baru
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
      className="flex flex-col justify-between min-h-[calc(100vh-140px)] w-full max-w-xl mx-auto px-5 py-6 select-none font-aspekta bg-[#fafafa]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. Fasthand Handwritten Kicker (Emotional Signature) */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-fasthand text-2xl text-[#696969] leading-none">
          Antaran ke-{safeIndex + 1} dari {packages.length}
        </span>

        {/* Minimal Pill Badge */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            isDelivered
              ? 'bg-[#292929] text-[#fafafa]'
              : isProblem
              ? 'bg-[#f4f4f5] text-[#080808] border border-[#b2b2b2]'
              : 'bg-[#f4f4f5] text-[#222222]'
          }`}
        >
          {isDelivered ? 'Terkirim' : isProblem ? 'Ada Kendala' : 'Belum Diantar'}
        </span>
      </div>

      {/* 2. Display Headline: Aspekta with Negative Tracking */}
      <div className="my-2">
        <h1 className="text-4xl sm:text-5xl font-normal text-[#080808] tracking-[-0.035em] leading-[1.14]">
          Stop #{String(currentPkg.orderIndex).padStart(2, '0')}.
        </h1>
        <p className="text-xs text-[#696969] tracking-[-0.010em] mt-1 font-mono">
          {currentPkg.trackingNumber} • {currentPkg.areaOrStreet}
        </p>
      </div>

      {/* 3. Floating Content Card (Layered Hairline Shadow, 32px Radius) */}
      <div className="bg-[#fafafa] rounded-[32px] p-6 sm:p-7 shadow-subtle border border-[#e4e4e7]/70 my-3 space-y-4">
        {/* Recipient Row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs text-[#696969] tracking-[-0.010em] block">
              Penerima Paket:
            </span>
            <h2 className="text-xl sm:text-2xl font-medium text-[#080808] tracking-[-0.020em] mt-0.5">
              {currentPkg.recipientName}
            </h2>
            <p className="text-xs font-mono text-[#696969] mt-0.5">
              📞 {currentPkg.recipientPhone}
            </p>
          </div>

          {currentPkg.isCod ? (
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[#292929] text-[#fafafa]">
                COD: {formatRupiah(currentPkg.codAmount)}
              </span>
            </div>
          ) : (
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[#f4f4f5] text-[#696969] border border-[#e4e4e7]">
                Non-COD (Lunas)
              </span>
            </div>
          )}
        </div>

        {/* Hairline Divider */}
        <div className="h-[1px] bg-[#e4e4e7] w-full" />

        {/* Address Row */}
        <div>
          <span className="text-xs text-[#696969] tracking-[-0.010em] block mb-1">
            Alamat Pengantaran:
          </span>
          <p className="text-sm text-[#222222] tracking-[-0.010em] leading-relaxed max-w-[55ch]">
            {currentPkg.fullAddress}
          </p>

          {currentPkg.benchmark && (
            <div className="mt-3 text-xs bg-[#f4f4f5] p-3 rounded-[16px] text-[#222222] border border-[#e4e4e7]/60">
              <span className="text-[#696969] font-medium">Patokan: </span>
              <span>{currentPkg.benchmark}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Minimal Dash Pagination */}
      <div className="flex items-center justify-center gap-1.5 my-2">
        {packages.map((_, idx) => {
          const isActive = idx === safeIndex;
          return (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                isActive ? 'w-8 bg-[#292929]' : 'w-3 bg-[#e4e4e7] hover:bg-[#b2b2b2]'
              }`}
              title={`Pindah ke Stop #${idx + 1}`}
            />
          );
        })}
      </div>

      {/* 5. Pill Action Controls: Dark Pill (Primary) & Light Pill (Secondary) */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => handleOpenWhatsApp(currentPkg)}
          className="w-full bg-[#f4f4f5] hover:bg-[#e4e4e7] active:scale-95 text-[#292929] font-medium text-xs py-3.5 px-4 rounded-full transition flex items-center justify-center gap-2 cursor-pointer border border-[#e4e4e7]"
        >
          <MessageCircle className="w-3.5 h-3.5 text-[#292929]" />
          <span>Chat WhatsApp</span>
        </button>

        <a
          href={getSingleNavigationUrl(currentPkg.lat, currentPkg.lng, currentPkg.fullAddress)}
          target="_blank"
          rel="noreferrer"
          className="w-full bg-[#292929] hover:bg-[#080808] active:scale-95 text-[#fafafa] font-medium text-xs py-3.5 px-4 rounded-full transition flex items-center justify-center gap-2 cursor-pointer text-center"
        >
          <Navigation className="w-3.5 h-3.5 text-[#fafafa]" />
          <span>Buka Google Maps</span>
        </a>
      </div>

      {/* 6. Tertiary Links: Ghosted Inline Gestures */}
      <div className="flex items-center justify-between text-xs font-normal text-[#696969] pt-4 border-t border-[#e4e4e7]/60 mt-4">
        <button
          onClick={() =>
            onUpdateStatus(
              currentPkg.id,
              currentPkg.status === 'delivered' ? 'pending' : 'delivered'
            )
          }
          className="flex items-center gap-1.5 text-[#292929] hover:text-[#080808] transition cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{isDelivered ? 'Batal Terkirim' : 'Tandai Paket Terkirim'}</span>
        </button>

        <button
          onClick={onOpenMapTab}
          className="flex items-center gap-1 text-[#292929] hover:text-[#080808] transition cursor-pointer"
        >
          <span>Buka Peta Interaktif</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
