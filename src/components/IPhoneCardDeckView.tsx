import React, { useState, useEffect } from 'react';
import {
  Navigation,
  MessageCircle,
  CheckCircle2,
  Package as PackageIcon,
  Check,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  QrCode,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Sun,
  Moon,
  Home,
  Camera,
  RefreshCw,
  AlertCircle,
  Edit3,
  Phone,
} from 'lucide-react';
import type { DeliveryPackage, PackageStatus, SavedHousePoint } from '../types';
import { getSingleNavigationUrl, getStopLegInfo } from '../utils/routeOptimizer';
import { findMatchingHouse } from '../utils/houseManager';

interface IPhoneCardDeckViewProps {
  packages: DeliveryPackage[];
  onUpdateStatus: (id: string, status: PackageStatus, notes?: string) => void;
  whatsAppTemplate: string;
  onOpenScan: () => void;
  onOpenMapTab: () => void;
  dropPointLat?: number;
  dropPointLng?: number;
  savedHouses?: SavedHousePoint[];
  onSaveHousePoint?: (pkg: DeliveryPackage) => void;
  onQuickPinGps?: (pkg: DeliveryPackage) => Promise<{ success: boolean; accuracy?: number; error?: string }>;
  onEditPackage?: (pkg: DeliveryPackage) => void;
  onQuickEditPhone?: (pkg: DeliveryPackage) => void;
}

export const IPhoneCardDeckView: React.FC<IPhoneCardDeckViewProps> = ({
  packages,
  onUpdateStatus,
  whatsAppTemplate,
  onOpenScan,
  onOpenMapTab,
  dropPointLat = -7.2107,
  dropPointLng = 113.4493,
  savedHouses = [],
  onSaveHousePoint,
  onQuickPinGps,
  onEditPackage,
  onQuickEditPhone,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default dark AMOLED matching Refero screenshot
  const [isPinningGps, setIsPinningGps] = useState(false);
  const [pinToast, setPinToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleQuickPin = async (pkg: DeliveryPackage) => {
    if (!onQuickPinGps || isPinningGps) return;
    setIsPinningGps(true);
    setPinToast(null);

    const res = await onQuickPinGps(pkg);
    setIsPinningGps(false);

    if (res.success) {
      setPinToast({
        type: 'success',
        text: `📍 Titik Lokasi Berhasil Dikunci! (Akurasi: ±${Math.round(res.accuracy || 4)}m)`,
      });
      setTimeout(() => setPinToast(null), 4000);
    } else {
      setPinToast({
        type: 'error',
        text: res.error || 'Gagal mengunci GPS. Pastikan izin lokasi HP aktif.',
      });
      setTimeout(() => setPinToast(null), 4000);
    }
  };

  // Keyboard navigation for desktop testing (Left/Right arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentIndex < packages.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, packages.length]);

  if (packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[520px] px-6 text-center text-neutral-200 font-aspekta bg-[#050505] rounded-3xl m-4 border border-neutral-800">
        <div className="w-20 h-20 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 text-amber-400">
          <PackageIcon className="w-10 h-10 stroke-[1.5]" />
        </div>
        <p className="font-fasthand text-2xl text-neutral-400 mb-1">semua beres,</p>
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Tidak Ada Paket Tersisa
        </h2>
        <p className="text-sm text-neutral-400 mt-2 max-w-xs mx-auto">
          Semua antaran area Branta Pamekasan telah selesai atau diarsipkan.
        </p>
        <button
          onClick={onOpenScan}
          className="mt-6 bg-white hover:bg-neutral-200 active:scale-95 text-black font-bold text-sm px-7 py-3.5 rounded-full transition shadow-lg cursor-pointer"
        >
          + Tambah Resi Baru
        </button>
      </div>
    );
  }

  const safeIndex = Math.min(currentIndex, packages.length - 1);
  const currentPkg = packages[safeIndex];
  const prevPkg = safeIndex > 0 ? packages[safeIndex - 1] : null;
  const legInfo = getStopLegInfo(currentPkg, prevPkg, dropPointLat, dropPointLng);
  const matchingHouse = currentPkg ? findMatchingHouse(savedHouses, currentPkg) : undefined;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleOpenWhatsApp = (pkg: DeliveryPackage) => {
    // Jika nomor disensor oleh J&T Sprinter (mengandung bintang *) atau kurang dari 10 digit, buka modal pengisian nomor
    if (pkg.recipientPhone?.includes('*') || (pkg.recipientPhone?.length || 0) < 10) {
      if (onQuickEditPhone) {
        onQuickEditPhone(pkg);
        return;
      }
    }

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
      className={`min-h-[calc(100vh-130px)] w-full flex flex-col justify-between transition-colors duration-300 font-aspekta select-none ${
        isDarkMode ? 'bg-[#000000] text-white' : 'bg-[#fafafa] text-[#222222]'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Container calibrated for iPhone 16 Pro Max viewport (max-w-[440px]) */}
      <div className="w-full max-w-[440px] mx-auto px-5 py-3 flex flex-col justify-between flex-1 relative">
        
        {/* Subtle decorative confetti flecks (recreating Refero screenshot atmosphere) */}
        {isDarkMode && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
            <span className="absolute top-10 left-6 w-1.5 h-1.5 bg-white/40 rounded-full rotate-45" />
            <span className="absolute top-20 right-8 w-2 h-1 bg-white/30 rounded rotate-12" />
            <span className="absolute top-44 left-10 w-1.5 h-3 bg-white/20 rounded rotate-[30deg]" />
            <span className="absolute top-72 right-12 w-2 h-2 bg-white/30 rounded-full" />
            <span className="absolute bottom-28 left-8 w-2 h-1 bg-white/40 rounded -rotate-45" />
            <span className="absolute bottom-16 right-10 w-1.5 h-1.5 bg-white/30 rounded-full" />
          </div>
        )}

        {/* Refero Navigation Bar: "Paket Antaran" & "Done" (Selesai) */}
        <div className="flex items-center justify-between py-2 z-10">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            title="Ganti Mode Tampilan (Dark AMOLED / Light Paper)"
            className={`p-2 rounded-full transition cursor-pointer text-xs flex items-center gap-1.5 ${
              isDarkMode
                ? 'text-neutral-400 hover:text-white bg-neutral-900/60'
                : 'text-neutral-600 hover:text-black bg-neutral-200/60'
            }`}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-medium hidden sm:inline">
              {isDarkMode ? 'Terang' : 'Gelap'}
            </span>
          </button>

          <div className="text-center">
            <h2 className={`text-base font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
              Paket Antaran
            </h2>
            <span className="text-[11px] text-neutral-400 block -mt-0.5">
              Stop {safeIndex + 1} dari {packages.length}
            </span>
          </div>

          <button
            onClick={() =>
              onUpdateStatus(
                currentPkg.id,
                currentPkg.status === 'delivered' ? 'pending' : 'delivered'
              )
            }
            className={`text-sm font-semibold transition cursor-pointer px-2 py-1 rounded-full ${
              isDelivered
                ? 'text-emerald-400 hover:text-emerald-300'
                : isDarkMode
                ? 'text-white hover:text-neutral-300'
                : 'text-neutral-900 hover:text-neutral-600'
            }`}
          >
            {isDelivered ? 'Terkirim ✓' : 'Selesai'}
          </button>
        </div>

        {/* 3. The Prominent Hero Card (Exact Refero Design with Amber Package Badge) */}
        <div className="my-2 relative z-10 group">
          <div
            className={`w-full rounded-[34px] p-6 transition-all duration-300 relative shadow-2xl overflow-hidden flex flex-col justify-between min-h-[280px] sm:min-h-[300px] ${
              isDarkMode
                ? 'bg-white text-neutral-900'
                : 'bg-white text-neutral-900 border border-neutral-200 shadow-xl'
            }`}
          >
            {/* Top Row inside Card: Tracking Number & Yellow Parcel Badge */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-500 font-semibold block">
                  J&T EXPRESS • PAMEKASAN
                </span>
                <span className="text-xs font-mono font-bold text-neutral-800 tracking-tight block mt-0.5">
                  {currentPkg.trackingNumber}
                </span>
                <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  📍 {prevPkg ? `+${legInfo.text} dari Stop #${safeIndex}` : `+${legInfo.text} dari Gudang`}
                </span>
              </div>

              {/* Actions & Parcel Badge (Top-Right) */}
              <div className="flex items-center gap-1.5">
                {onEditPackage && (
                  <button
                    onClick={() => onEditPackage(currentPkg)}
                    title="Edit Alamat & Detail Paket (Ketik di PC)"
                    className="p-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 flex items-center justify-center transition cursor-pointer border border-neutral-200 active:scale-95"
                  >
                    <Edit3 className="w-4 h-4 text-blue-600" />
                  </button>
                )}
                <div
                  className="w-11 h-11 rounded-2xl bg-[#f59e0b] text-neutral-950 flex items-center justify-center shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                  title="Paket Siap Kirim"
                >
                  <PackageIcon className="w-6 h-6 stroke-[2.2]" />
                </div>
              </div>
            </div>

            {/* Middle inside Card: Delivery Recipient & Destination Preview Graphic */}
            <div className="my-3 py-2 flex flex-col items-center text-center justify-center relative">
              {/* Illustrated Delivery Parcel Box Representation / Real House Photo */}
              <div className="relative mb-2">
                {matchingHouse?.photoUrl ? (
                  <div
                    onClick={() => onSaveHousePoint && onSaveHousePoint(currentPkg)}
                    className="w-24 h-24 rounded-3xl border-2 border-amber-400 flex flex-col items-center justify-center shadow-md relative overflow-hidden group cursor-pointer"
                    title="Titik rumah tersimpan! Klik untuk lihat foto & patokan"
                  >
                    <img
                      src={matchingHouse.photoUrl}
                      alt="Foto Rumah"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute bottom-1 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>🏡 Rumah</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-neutral-100 rounded-3xl border border-neutral-200/80 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-red-600" />
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-1 text-neutral-800 border border-neutral-200">
                      <MapPin className="w-5 h-5 text-red-600 stroke-[2.2]" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-neutral-700 tracking-tighter">
                      {currentPkg.areaOrStreet.slice(0, 14)}
                    </span>
                  </div>
                )}

                {/* Status Dot */}
                <span
                  className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    isDelivered
                      ? 'bg-emerald-500'
                      : isProblem
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                  title={currentPkg.status}
                />
              </div>

              {/* Recipient Name Highlight */}
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 line-clamp-1">
                {currentPkg.recipientName}
              </h3>
              
              {/* Phone display with high-affordance Quick Edit pill */}
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onQuickEditPhone
                      ? onQuickEditPhone(currentPkg)
                      : onEditPackage && onEditPackage(currentPkg)
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition active:scale-95 cursor-pointer border ${
                    currentPkg.recipientPhone?.includes('*')
                      ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-bold'
                      : 'bg-neutral-100 text-neutral-800 border-neutral-300 hover:bg-neutral-200'
                  }`}
                  title="Klik untuk mengisi / mengedit nomor telepon pelanggan"
                >
                  <Phone className="w-3.5 h-3.5 text-neutral-700" />
                  <span>{currentPkg.recipientPhone || 'Belum ada nomor'}</span>
                  {currentPkg.recipientPhone?.includes('*') ? (
                    <span className="bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-full font-sans font-bold shadow-2xs">
                      ✏️ Isi No. HP
                    </span>
                  ) : (
                    <Edit3 className="w-3 h-3 text-neutral-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Bottom inside Card: COD Tag / Non-COD Tag & Destination Area */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-200/70">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-neutral-500 font-medium">Area:</span>
                <span className="text-xs font-semibold text-neutral-800">
                  {currentPkg.areaOrStreet}
                </span>
              </div>

              {currentPkg.isCod ? (
                <div className="bg-neutral-950 text-white px-3 py-1 rounded-full text-xs font-bold tracking-tight shadow-sm">
                  COD: {formatRupiah(currentPkg.codAmount)}
                </div>
              ) : (
                <div className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-xs font-bold tracking-tight">
                  Lunas (Non-COD)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Dash Pagination (Exact Refero Indicator: --- - ---) */}
        <div className="flex items-center justify-center gap-1.5 my-3 z-10">
          {packages.map((_, idx) => {
            const isActive = idx === safeIndex;
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive
                    ? isDarkMode
                      ? 'w-10 bg-white'
                      : 'w-10 bg-neutral-900'
                    : isDarkMode
                    ? 'w-3.5 bg-white/25 hover:bg-white/50'
                    : 'w-3.5 bg-neutral-300 hover:bg-neutral-500'
                }`}
                title={`Pindah ke Stop #${idx + 1}`}
              />
            );
          })}
        </div>

        {/* 5. Giant Bold Display Headline: "MODEL 001" -> "STOP #01" */}
        <div className="text-center sm:text-left my-2 z-10">
          <h1
            className={`text-4xl sm:text-5xl font-black uppercase tracking-tight leading-none ${
              isDarkMode ? 'text-white' : 'text-neutral-950'
            }`}
          >
            STOP #{String(currentPkg.orderIndex).padStart(2, '0')}
          </h1>

          {/* Subtitle: "by Atoms x Any Distance" -> "by J&T Express × Branta Pamekasan" */}
          <p
            className={`text-xs sm:text-sm font-medium tracking-wide uppercase mt-1.5 flex flex-wrap items-center gap-1.5 ${
              isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
            }`}
          >
            <span>by J&T Express × {currentPkg.areaOrStreet || 'Branta Pamekasan'}</span>
            <span className="text-emerald-500 font-mono font-semibold">({legInfo.text})</span>
          </p>

          {/* Body Paragraph: Exact paragraph placement from Refero design */}
          <p
            className={`text-xs sm:text-sm leading-relaxed max-w-md mx-auto sm:mx-0 mt-2.5 ${
              isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
            }`}
          >
            {currentPkg.fullAddress}
            {currentPkg.benchmark && (
              <span className="block mt-1 font-medium text-amber-400">
                Patokan: {currentPkg.benchmark}
              </span>
            )}
          </p>
        </div>

        {/* 6. Dual Action Buttons: Side-by-side White Rounded Rectangles ("Share" & "Get $15 Off") */}
        <div className="grid grid-cols-2 gap-3 pt-3 z-10">
          <button
            onClick={() => handleOpenWhatsApp(currentPkg)}
            className="w-full bg-white hover:bg-neutral-100 active:scale-95 text-black font-bold text-sm py-4 px-4 rounded-2xl transition shadow-xl flex items-center justify-center gap-2 cursor-pointer border border-neutral-200/20"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600/20 stroke-[2.2]" />
            <span>Chat WA</span>
          </button>

          <a
            href={getSingleNavigationUrl(currentPkg.lat, currentPkg.lng, currentPkg.fullAddress)}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-white hover:bg-neutral-100 active:scale-95 text-black font-bold text-sm py-4 px-4 rounded-2xl transition shadow-xl flex items-center justify-center gap-2 cursor-pointer text-center border border-neutral-200/20"
          >
            <Navigation className="w-4 h-4 text-blue-600 fill-blue-600/20 stroke-[2.2]" />
            <span>Buka Maps</span>
          </a>
        </div>

        {/* 6b. 1-Tap Kunci Titik Lokasi & Tambah Foto Action */}
        <div className="pt-2.5 z-10 space-y-2">
          {/* Toast Notification */}
          {pinToast && (
            <div
              className={`p-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
                pinToast.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'bg-red-500/20 text-red-300 border border-red-500/50'
              }`}
            >
              {pinToast.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{pinToast.text}</span>
            </div>
          )}

          {/* Primary Action: 1-Tap Instant GPS Point Recorder */}
          {onQuickPinGps && (
            <button
              onClick={() => handleQuickPin(currentPkg)}
              disabled={isPinningGps}
              className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 border ${
                matchingHouse
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-950/40'
              }`}
            >
              {isPinningGps ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Sedang Mengunci Titik GPS Anda...</span>
                </>
              ) : matchingHouse ? (
                <>
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>📍 Perbarui Titik GPS ke Posisi Saya Sekarang</span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 text-white" />
                  <span>📍 Kunci Titik Lokasi Saya (1-Tap)</span>
                </>
              )}
            </button>
          )}

          {/* Secondary Action: Optional Photo / Edit Benchmark */}
          {onSaveHousePoint && (
            <div className="flex items-center justify-between px-2 text-[11px]">
              <span className="text-neutral-400">
                {matchingHouse
                  ? `✅ Titik tersimpan (Akurasi: ±${Math.round(matchingHouse.accuracyMeters || 4)}m)`
                  : 'Cukup 1-klik tanpa ketik atau foto'}
              </span>
              <button
                onClick={() => onSaveHousePoint(currentPkg)}
                className="font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{matchingHouse?.photoUrl ? 'Lihat/Ganti Foto' : '+ Tambah Foto/Ciri'}</span>
              </button>
            </div>
          )}
        </div>

        {/* 7. Bottom Action Link: "View in AR" Position -> "Tandai Paket Terkirim" */}
        <div className="flex flex-col items-center justify-center pt-3 pb-2 z-10 gap-2">
          <button
            onClick={() =>
              onUpdateStatus(
                currentPkg.id,
                currentPkg.status === 'delivered' ? 'pending' : 'delivered'
              )
            }
            className={`flex items-center gap-2 text-xs sm:text-sm font-semibold py-1.5 px-3 rounded-full transition cursor-pointer active:scale-95 ${
              isDelivered
                ? 'text-emerald-400 hover:text-emerald-300'
                : isDarkMode
                ? 'text-neutral-300 hover:text-white'
                : 'text-neutral-700 hover:text-black'
            }`}
          >
            {isDelivered ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Batal Terkirim (Ubah ke Pending)</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Tandai Paket Terkirim</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenMapTab}
            className={`text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
              isDarkMode ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <span>Buka Peta Keseluruhan Rute Branta</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* 8. iOS Home Indicator Bar (Bottom Bar) */}
        <div className="pt-1 pb-1 flex justify-center">
          <div
            className={`w-32 h-1 rounded-full ${
              isDarkMode ? 'bg-white/40' : 'bg-neutral-900/30'
            }`}
          />
        </div>

      </div>
    </div>
  );
};
