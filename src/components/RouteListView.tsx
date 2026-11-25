import React, { useState } from 'react';
import {
  Navigation,
  MessageCircle,
  Phone,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronUp,
  ChevronDown,
  MapPin,
  Home,
  RefreshCw,
  Check,
  Camera,
  Edit3,
  Layers,
  ListOrdered,
  CheckCheck,
  RotateCcw,
  Boxes,
} from 'lucide-react';
import type { DeliveryPackage, PackageStatus, SavedHousePoint } from '../types';
import {
  getSingleNavigationUrl,
  getStopLegInfo,
  groupPackagesByArea,
  formatRupiah,
  calculateCodWithCourierFee,
  formatCodWhatsAppInfo,
  generateJntDeliveryMessage,
  getSiblingPackages,
  calculateCombinedCodTotal,
} from '../utils/routeOptimizer';
import { findMatchingHouse, isSameCustomer } from '../utils/houseManager';
import { RecipientPackagesModal } from './RecipientPackagesModal';

interface RouteListViewProps {
  packages: DeliveryPackage[];
  onUpdateStatus: (id: string, status: PackageStatus, notes?: string) => void;
  onMovePackage: (index: number, direction: 'up' | 'down') => void;
  whatsAppTemplate: string;
  dropPointLat?: number;
  dropPointLng?: number;
  savedHouses?: SavedHousePoint[];
  onSaveHousePoint?: (pkg: DeliveryPackage) => void;
  onQuickPinGps?: (pkg: DeliveryPackage) => Promise<{ success: boolean; accuracy?: number; error?: string }>;
  onDeliverWithPhoto?: (pkg: DeliveryPackage, file: File) => Promise<{ success: boolean; error?: string }>;
  onEditPackage?: (pkg: DeliveryPackage) => void;
  onQuickEditPhone?: (pkg: DeliveryPackage) => void;
}

export const RouteListView: React.FC<RouteListViewProps> = ({
  packages,
  onUpdateStatus,
  onMovePackage,
  whatsAppTemplate,
  dropPointLat = -7.2107,
  dropPointLng = 113.4493,
  savedHouses = [],
  onSaveHousePoint,
  onQuickPinGps,
  onDeliverWithPhoto,
  onEditPackage,
  onQuickEditPhone,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered' | 'problem' | 'returned'>('pending');
  const [groupMode, setGroupMode] = useState<'area' | 'sequence'>('area');
  const [pinningPkgId, setPinningPkgId] = useState<string | null>(null);
  const [pinnedPkgId, setPinnedPkgId] = useState<string | null>(null);
  const [deliveringPkgId, setDeliveringPkgId] = useState<string | null>(null);
  const [targetPhotoPkg, setTargetPhotoPkg] = useState<DeliveryPackage | null>(null);
  const [siblingTargetPkg, setSiblingTargetPkg] = useState<DeliveryPackage | null>(null);
  const targetPhotoPkgRef = React.useRef<DeliveryPackage | null>(null);
  const routeCameraInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleTriggerPhotoDelivery = (pkg: DeliveryPackage) => {
    targetPhotoPkgRef.current = pkg;
    setTargetPhotoPkg(pkg);
    if (routeCameraInputRef.current) {
      routeCameraInputRef.current.value = '';
      routeCameraInputRef.current.click();
    }
  };

  const handleRouteCameraFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const pkg = targetPhotoPkgRef.current || targetPhotoPkg;
    if (!file || !pkg || !onDeliverWithPhoto) return;

    setDeliveringPkgId(pkg.id);
    const res = await onDeliverWithPhoto(pkg, file);
    setDeliveringPkgId(null);

    if (!res.success) {
      alert(res.error || 'Gagal memproses foto rumah');
    }
  };

  const handleQuickPin = async (pkg: DeliveryPackage) => {
    if (!onQuickPinGps || pinningPkgId) return;
    setPinningPkgId(pkg.id);
    const res = await onQuickPinGps(pkg);
    setPinningPkgId(null);
    if (res.success) {
      setPinnedPkgId(pkg.id);
      setTimeout(() => setPinnedPkgId(null), 3500);
    } else {
      alert(res.error || 'Gagal mengunci GPS. Pastikan izin lokasi HP aktif.');
    }
  };

  const handleOpenWhatsApp = (pkg: DeliveryPackage) => {
    // Jika nomor disensor oleh J&T Sprinter (mengandung bintang *) atau kurang dari 10 digit, buka modal pengisian nomor
    if (pkg.recipientPhone?.includes('*') || (pkg.recipientPhone?.length || 0) < 10) {
      if (onQuickEditPhone) {
        onQuickEditPhone(pkg);
        return;
      }
    }

    const text = generateJntDeliveryMessage(pkg, whatsAppTemplate);

    let phone = pkg.recipientPhone.replace(/\D/g, '');
    if (phone.startsWith('08')) {
      phone = '628' + phone.slice(2);
    }

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleOpenSms = (pkg: DeliveryPackage) => {
    if (pkg.recipientPhone?.includes('*') || (pkg.recipientPhone?.length || 0) < 10) {
      if (onQuickEditPhone) {
        onQuickEditPhone(pkg);
        return;
      }
    }

    const text = generateJntDeliveryMessage(pkg, whatsAppTemplate);
    let phone = pkg.recipientPhone.replace(/\D/g, '');
    if (phone.startsWith('08')) {
      phone = '0' + phone.slice(2);
    }

    window.open(`sms:${phone}?body=${encodeURIComponent(text)}`, '_blank');
  };

  const handleTelp = (pkg: DeliveryPackage) => {
    if (pkg.recipientPhone?.includes('*') || (pkg.recipientPhone?.length || 0) < 10) {
      if (onQuickEditPhone) {
        onQuickEditPhone(pkg);
        return;
      }
    }
    window.location.href = `tel:${pkg.recipientPhone}`;
  };

  const filteredPackages = packages.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return p.status === 'pending';
    if (filter === 'delivered') return p.status === 'delivered';
    if (filter === 'problem') return p.status === 'rescheduled' || p.status === 'failed';
    if (filter === 'returned') return p.status === 'returned';
    return true;
  });

  const renderPackageCard = (pkg: DeliveryPackage) => {
    const originalIndex = packages.findIndex((p) => p.id === pkg.id);
    const isDelivered = pkg.status === 'delivered';
    const isReturned = pkg.status === 'returned';
    const isProblem = pkg.status === 'rescheduled' || pkg.status === 'failed';
    const prevPkg = originalIndex > 0 ? packages[originalIndex - 1] : null;
    const legInfo = getStopLegInfo(pkg, prevPkg, dropPointLat, dropPointLng);
    const matchingHouse = savedHouses ? findMatchingHouse(savedHouses, pkg) : undefined;
    const isCustomerMatch = matchingHouse ? isSameCustomer(matchingHouse, pkg) : false;
    const pkgPhotoUrl =
      pkg.proofPhotoUrl ||
      (matchingHouse?.photoUrl && isCustomerMatch
        ? matchingHouse.photoUrl
        : undefined);

    return (
      <div
        key={pkg.id}
        className={`rounded-[28px] p-4 sm:p-5 transition-all shadow-subtle border ${
          isDelivered
            ? 'bg-[#fafafa] opacity-60 border-[#e4e4e7]'
            : isReturned
            ? 'bg-red-50/40 border-red-200'
            : isProblem
            ? 'bg-[#fafafa] border-[#b2b2b2]'
            : 'bg-[#fafafa] border-[#e4e4e7]/80'
        }`}
      >
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e4e4e7]">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs tracking-tight shrink-0 border ${
              isReturned
                ? 'bg-red-600 text-white border-red-700'
                : 'bg-[#f4f4f5] text-[#080808] border-[#e4e4e7]'
            }`}>
              #{pkg.orderIndex}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-mono text-xs text-[#696969]">
                  {pkg.trackingNumber}
                </span>
                <span className="font-mono text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  📍 {prevPkg ? `+${legInfo.text} dari Stop #${originalIndex}` : `+${legInfo.text} dari Gudang`}
                </span>
                {/* Badge Percobaan Pengantaran (1..3) */}
                {(pkg.deliveryAttempts || 1) > 1 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    (pkg.deliveryAttempts || 1) >= 3
                      ? 'bg-red-100 text-red-800 border-red-300 animate-pulse'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {(pkg.deliveryAttempts || 1) >= 3
                      ? `⚠️ Percobaan ${(pkg.deliveryAttempts || 1)}/3 (Siap Retur)`
                      : `🔄 Percobaan ke-${pkg.deliveryAttempts}/3`}
                  </span>
                )}
                {/* Badge Retur */}
                {isReturned && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-2xs">
                    ↩ DIRETUR KE GUDANG {pkg.returnReason ? `(${pkg.returnReason})` : ''}
                  </span>
                )}
                {pkg.isCod ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#292929] text-[#fafafa]">
                    COD: {calculateCodWithCourierFee(pkg.codAmount).formattedTotal}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f4f4f5] text-[#696969] border border-[#e4e4e7]">
                    Lunas
                  </span>
                )}

                {(() => {
                  const siblings = getSiblingPackages(pkg, packages);
                  if (siblings.length <= 1) return null;
                  const combined = calculateCombinedCodTotal(siblings);
                  return (
                    <button
                      type="button"
                      onClick={() => setSiblingTargetPkg(pkg)}
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                      title="Klik untuk melihat rincian & total semua paket milik penerima ini"
                    >
                      <Boxes className="w-3.5 h-3.5 text-amber-600" />
                      <span>Total {siblings.length} Paket: {combined.formattedTotal}</span>
                    </button>
                  );
                })()}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <h3 className="text-base sm:text-lg font-bold text-[#080808] tracking-[-0.015em]">
                  {pkg.recipientName}
                </h3>
                {matchingHouse && isCustomerMatch && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    🏡 {pkgPhotoUrl ? 'Ada Foto' : 'Titik GPS'}
                  </span>
                )}
              </div>
              {/* Nomor HP dengan Tombol Isi / Edit Nomor Sensor */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() =>
                    onQuickEditPhone
                      ? onQuickEditPhone(pkg)
                      : onEditPackage && onEditPackage(pkg)
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono transition active:scale-95 cursor-pointer border ${
                    pkg.recipientPhone?.includes('*')
                      ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-bold'
                      : 'bg-[#f4f4f5] text-[#222222] border-[#e4e4e7] hover:bg-[#e4e4e7]'
                  }`}
                  title="Klik untuk mengisi / mengedit nomor telepon pelanggan"
                >
                  <Phone className="w-3 h-3 text-neutral-600" />
                  <span>{pkg.recipientPhone || 'Belum ada nomor'}</span>
                  {pkg.recipientPhone?.includes('*') ? (
                    <span className="bg-amber-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-sans font-semibold">
                      ✏️ Isi Nomor
                    </span>
                  ) : (
                    <Edit3 className="w-2.5 h-2.5 text-neutral-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Move order & Edit Package Action */}
          <div className="flex items-center gap-1.5 self-end sm:self-center">
            {onEditPackage && (
              <button
                onClick={() => onEditPackage(pkg)}
                title="Edit Alamat & Data Paket (Koreksi Hasil Scan)"
                className="px-2.5 py-1.5 rounded-full bg-white hover:bg-[#e4e4e7] text-[#080808] border border-[#e4e4e7] flex items-center gap-1 text-[11px] font-bold cursor-pointer shadow-2xs active:scale-95 transition"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Edit</span>
              </button>
            )}

            <button
              disabled={originalIndex === 0}
              onClick={() => onMovePackage(originalIndex, 'up')}
              className="p-1.5 rounded-full bg-[#f4f4f5] hover:bg-[#e4e4e7] text-[#222222] disabled:opacity-30 cursor-pointer"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              disabled={originalIndex === packages.length - 1}
              onClick={() => onMovePackage(originalIndex, 'down')}
              className="p-1.5 rounded-full bg-[#f4f4f5] hover:bg-[#e4e4e7] text-[#222222] disabled:opacity-30 cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="pt-3 space-y-2.5">
          <div>
            <p className="text-xs text-[#696969] font-medium">{pkg.areaOrStreet}</p>
            <p className="text-xs sm:text-sm text-[#222222] leading-relaxed mt-0.5 max-w-[55ch]">
              {pkg.fullAddress}
            </p>
          </div>

          {pkg.benchmark && (
            <div className="text-xs bg-[#f4f4f5] p-2.5 rounded-xl text-[#222222] border border-[#e4e4e7]/60">
              <span className="text-[#696969] font-medium">Patokan: </span>
              <span>{pkg.benchmark}</span>
            </div>
          )}

          {/* Row 1 Actions: Maps, Chat WA, Telp */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <a
              href={getSingleNavigationUrl(pkg.lat, pkg.lng, pkg.fullAddress)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1 bg-[#292929] hover:bg-[#080808] active:scale-95 text-[#fafafa] font-medium text-xs py-2 px-2 rounded-full transition text-center"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Maps</span>
            </a>

            <button
              onClick={() => handleOpenWhatsApp(pkg)}
              className="flex items-center justify-center gap-1 bg-[#f4f4f5] hover:bg-[#e4e4e7] active:scale-95 text-[#222222] font-medium text-xs py-2 px-2 rounded-full transition cursor-pointer border border-[#e4e4e7]"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WA</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenSms(pkg)}
              className="flex items-center justify-center gap-1 bg-[#f4f4f5] hover:bg-[#e4e4e7] active:scale-95 text-[#222222] font-medium text-xs py-2 px-2 rounded-full transition text-center border border-[#e4e4e7] cursor-pointer"
              title="Kirim SMS jika tidak terdaftar di WhatsApp"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>SMS</span>
            </button>

            <button
              type="button"
              onClick={() => handleTelp(pkg)}
              className="flex items-center justify-center gap-1 bg-[#f4f4f5] hover:bg-[#e4e4e7] active:scale-95 text-[#222222] font-medium text-xs py-2 px-2 rounded-full transition text-center border border-[#e4e4e7] cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-[#222222]" />
              <span>Telp</span>
            </button>
          </div>

          {/* Row 2: 📸 Foto Rumah & Paket Selesai Kirim */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
            {onDeliverWithPhoto && (
              <button
                type="button"
                onClick={() => handleTriggerPhotoDelivery(pkg)}
                disabled={deliveringPkgId === pkg.id}
                className={`flex-1 flex items-center justify-center gap-1.5 font-bold text-xs py-2.5 px-4 rounded-2xl transition cursor-pointer active:scale-95 border shadow-sm ${
                  pkg.status === 'delivered'
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-950/20'
                }`}
              >
                {deliveringPkgId === pkg.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan Foto & Menyelesaikan...</span>
                  </>
                ) : pkg.status === 'delivered' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Terkirim (Ketuk untuk Foto Ulang)</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-white" />
                    <span>📸 Foto Rumah & Selesai Kirim</span>
                  </>
                )}
              </button>
            )}

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              {onQuickPinGps && (
                <button
                  type="button"
                  onClick={() => handleQuickPin(pkg)}
                  disabled={pinningPkgId === pkg.id}
                  title="Kunci GPS titik rumah ini saja tanpa foto"
                  className="p-2 rounded-full hover:bg-[#f4f4f5] text-[#222222] border border-[#e4e4e7] transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">GPS Saja</span>
                </button>
              )}

              {pkgPhotoUrl ? (
                <button
                  type="button"
                  onClick={() => onSaveHousePoint && onSaveHousePoint(pkg)}
                  title="Lihat foto rumah yang tersimpan"
                  className="py-1.5 px-3 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  <Home className="w-3.5 h-3.5 text-amber-600" />
                  <span>Lihat Foto</span>
                </button>
              ) : onSaveHousePoint ? (
                <button
                  type="button"
                  onClick={() => onSaveHousePoint(pkg)}
                  title="Catat ciri-ciri / patokan rumah manual"
                  className="py-1.5 px-3 rounded-full bg-[#f4f4f5] hover:bg-[#e4e4e7] text-[#696969] border border-[#e4e4e7] text-[11px] font-medium flex items-center gap-1 cursor-pointer transition"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Ciri Rumah</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Status Toggle Bar */}
          <div className="pt-2 border-t border-[#e4e4e7]/60 flex items-center justify-between gap-2 text-xs">
            <button
              onClick={() =>
                onUpdateStatus(
                  pkg.id,
                  pkg.status === 'delivered' ? 'pending' : 'delivered'
                )
              }
              className={`flex-1 py-1.5 px-3 rounded-full font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                pkg.status === 'delivered'
                  ? 'bg-[#292929] text-[#fafafa]'
                  : 'bg-[#f4f4f5] text-[#222222] hover:bg-[#e4e4e7]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{pkg.status === 'delivered' ? 'Sudah Terkirim' : 'Tandai Terkirim'}</span>
            </button>

            <button
              onClick={() => {
                const note = prompt('Alasan tunda / rumah kosong:', 'Rumah kosong / pagar terkunci');
                if (note !== null) {
                  onUpdateStatus(pkg.id, 'rescheduled', note);
                }
              }}
              className={`py-1.5 px-3 rounded-full font-medium flex items-center justify-center gap-1 transition cursor-pointer ${
                pkg.status === 'rescheduled'
                  ? 'bg-[#292929] text-[#fafafa]'
                  : 'bg-[#f4f4f5] text-[#696969] hover:bg-[#e4e4e7]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Kosong</span>
            </button>

            <button
              onClick={() => {
                const reason = prompt('Alasan gagal / kendala lapangan:', 'Customer menolak paket COD');
                if (reason !== null) {
                  onUpdateStatus(pkg.id, 'failed', reason);
                }
              }}
              className={`py-1.5 px-3 rounded-full font-medium flex items-center justify-center gap-1 transition cursor-pointer ${
                pkg.status === 'failed'
                  ? 'bg-[#292929] text-[#fafafa]'
                  : 'bg-[#f4f4f5] text-[#696969] hover:bg-[#e4e4e7]'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Gagal</span>
            </button>

            <button
              onClick={() => {
                const defaultReason = 'Permintaan Penerima (Retur Saja)';
                const reason = prompt(
                  'Konfirmasi RETUR PAKET ke Drop Point / Gudang.\nMasukkan alasan retur:',
                  defaultReason
                );
                if (reason !== null) {
                  onUpdateStatus(pkg.id, 'returned', reason.trim() || defaultReason);
                }
              }}
              className={`py-1.5 px-3 rounded-full font-medium flex items-center justify-center gap-1 transition cursor-pointer ${
                pkg.status === 'returned'
                  ? 'bg-red-600 text-white font-bold'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
              title="Retur paket ini kembali ke Drop Point"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retur</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const groupedAreas = groupPackagesByArea(filteredPackages);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4 font-aspekta bg-[#fafafa]">
      {/* Input kamera tersembunyi untuk foto rumah */}
      <input
        ref={routeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleRouteCameraFileChange}
      />

      {/* View Switcher: Bawa Sekaligus per Area / Dusun VS Urutan Stop 1..36 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-[#e4e4e7] shadow-2xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setGroupMode('area')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
              groupMode === 'area'
                ? 'bg-[#080808] text-white border-black shadow-xs'
                : 'bg-[#f4f4f5] text-[#52525b] border-transparent hover:bg-[#e4e4e7]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>🏘️ Kelompok per Area (Bawa Sekaligus)</span>
          </button>

          <button
            onClick={() => setGroupMode('sequence')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
              groupMode === 'sequence'
                ? 'bg-[#080808] text-white border-black shadow-xs'
                : 'bg-[#f4f4f5] text-[#52525b] border-transparent hover:bg-[#e4e4e7]'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>📋 Urutan Stop 1..{packages.length}</span>
          </button>
        </div>

        <div className="text-[11px] text-[#71717a] font-medium flex items-center gap-1">
          <span>💡 Hemat waktu: Ambil semua paket 1 area dari motor sekali jalan</span>
        </div>
      </div>

      {/* Pill Filter Strip: Belum Diantar, Semua, Terkirim, Kendala, Retur */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-medium">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
            filter === 'pending'
              ? 'bg-[#292929] text-[#fafafa]'
              : 'bg-[#f4f4f5] text-[#222222] hover:bg-[#e4e4e7]'
          }`}
        >
          Belum Diantar ({packages.filter((p) => p.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
            filter === 'all'
              ? 'bg-[#292929] text-[#fafafa]'
              : 'bg-[#f4f4f5] text-[#222222] hover:bg-[#e4e4e7]'
          }`}
        >
          Semua ({packages.length})
        </button>
        <button
          onClick={() => setFilter('delivered')}
          className={`px-4 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
            filter === 'delivered'
              ? 'bg-[#292929] text-[#fafafa]'
              : 'bg-[#f4f4f5] text-[#222222] hover:bg-[#e4e4e7]'
          }`}
        >
          Terkirim ({packages.filter((p) => p.status === 'delivered').length})
        </button>
        <button
          onClick={() => setFilter('problem')}
          className={`px-4 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
            filter === 'problem'
              ? 'bg-[#292929] text-[#fafafa]'
              : 'bg-[#f4f4f5] text-[#222222] hover:bg-[#e4e4e7]'
          }`}
        >
          Kendala ({packages.filter((p) => p.status === 'rescheduled' || p.status === 'failed').length})
        </button>
        <button
          onClick={() => setFilter('returned')}
          className={`px-4 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
            filter === 'returned'
              ? 'bg-red-600 text-white font-bold'
              : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
          }`}
        >
          Retur ({packages.filter((p) => p.status === 'returned').length})
        </button>
      </div>

      {filteredPackages.length === 0 && (
        <div className="text-center py-14 px-4 bg-[#fafafa] rounded-[32px] shadow-subtle border border-[#e4e4e7]/70">
          <CheckCircle2 className="w-10 h-10 text-[#696969] mx-auto mb-2 stroke-[1.5]" />
          <p className="font-fasthand text-2xl text-[#696969]">selesai,</p>
          <h3 className="text-2xl font-normal text-[#080808] tracking-[-0.025em]">
            Tidak Ada Paket Dalam Kategori Ini
          </h3>
        </div>
      )}

      {/* Mode 1: Kelompok per Area / Dusun (Bawa Sekaligus dari Motor) */}
      {groupMode === 'area' && (
        <div className="space-y-6">
          {groupedAreas.map((group) => (
            <div key={group.areaName} className="space-y-3">
              {/* Area Batch Header Card */}
              <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-[24px] p-4 sm:p-5 shadow-md border border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base sm:text-lg font-bold tracking-tight">
                      🏘️ {group.areaName}
                    </span>
                    <span className="bg-white/20 text-white text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                      {group.totalPackages} Paket
                    </span>
                    {group.deliveredCount === group.totalPackages ? (
                      <span className="bg-emerald-500/30 text-emerald-300 text-[11px] px-2 py-0.5 rounded-full font-bold border border-emerald-400/40">
                        ✅ Selesai
                      </span>
                    ) : (
                      <span className="bg-amber-500/30 text-amber-300 text-[11px] px-2 py-0.5 rounded-full font-bold border border-amber-400/40">
                        {group.deliveredCount}/{group.totalPackages} Terantar
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-300">
                    🎒 <strong>Bawa Sekaligus:</strong> Parkir motor di area ini, ambil {group.totalPackages} paket di bawah ini ke tas kurir agar hemat waktu tanpa bolak-balik.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {group.totalCodAmount > 0 && (
                    <span className="text-xs font-mono bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-amber-300 font-bold">
                      COD: {formatRupiah(group.totalCodAmount)}
                    </span>
                  )}
                  {group.pendingCount > 0 && (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Tandai semua (${group.pendingCount}) paket pending di area "${group.areaName}" sebagai terkirim?`
                          )
                        ) {
                          group.packages.forEach((p) => {
                            if (p.status === 'pending') {
                              onUpdateStatus(p.id, 'delivered');
                            }
                          });
                        }
                      }}
                      className="px-3.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Selesaikan Area ({group.pendingCount})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Paket-Paket di Dalam Area Ini */}
              <div className="space-y-3 sm:pl-3 border-l-0 sm:border-l-2 sm:border-neutral-200">
                {group.packages.map((pkg) => renderPackageCard(pkg))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mode 2: Urutan Stop Linear 1..36 */}
      {groupMode === 'sequence' && (
        <div className="space-y-3.5">
          {filteredPackages.map((pkg) => renderPackageCard(pkg))}
        </div>
      )}

      {/* Modal Totalan & Rincian Multi-Paket Milik 1 Orang */}
      <RecipientPackagesModal
        isOpen={Boolean(siblingTargetPkg)}
        onClose={() => setSiblingTargetPkg(null)}
        targetPackage={siblingTargetPkg}
        allPackages={packages}
        onUpdateStatus={onUpdateStatus}
        onEditPackage={onEditPackage}
        onQuickEditPhone={onQuickEditPhone}
      />
    </div>
  );
};
