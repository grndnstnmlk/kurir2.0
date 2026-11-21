import React from 'react';
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
  DollarSign,
  Home,
} from 'lucide-react';
import type { DeliveryPackage, PackageStatus, SavedHousePoint } from '../types';
import { getSingleNavigationUrl, getStopLegInfo } from '../utils/routeOptimizer';
import { findMatchingHouse } from '../utils/houseManager';

interface RouteListViewProps {
  packages: DeliveryPackage[];
  onUpdateStatus: (id: string, status: PackageStatus, notes?: string) => void;
  onMovePackage: (index: number, direction: 'up' | 'down') => void;
  whatsAppTemplate: string;
  dropPointLat?: number;
  dropPointLng?: number;
  savedHouses?: SavedHousePoint[];
  onSaveHousePoint?: (pkg: DeliveryPackage) => void;
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
}) => {
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'delivered' | 'problem'>('pending');

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

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const filteredPackages = packages.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return p.status === 'pending';
    if (filter === 'delivered') return p.status === 'delivered';
    if (filter === 'problem') return p.status === 'rescheduled' || p.status === 'failed';
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4 font-aspekta bg-[#fafafa]">
      {/* Pill Filter Strip: Fully Rounded Pills in Cream & Mid Ink */}
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

      {/* Floating Cards with 32px Radius & Layered Hairline Shadows */}
      <div className="space-y-3.5">
        {filteredPackages.map((pkg) => {
          const originalIndex = packages.findIndex((p) => p.id === pkg.id);
          const isDelivered = pkg.status === 'delivered';
          const isProblem = pkg.status === 'rescheduled' || pkg.status === 'failed';
          const prevPkg = originalIndex > 0 ? packages[originalIndex - 1] : null;
          const legInfo = getStopLegInfo(pkg, prevPkg, dropPointLat, dropPointLng);
          const matchingHouse = savedHouses ? findMatchingHouse(savedHouses, pkg) : undefined;

          return (
            <div
              key={pkg.id}
              className={`rounded-[32px] p-5 sm:p-6 transition-all shadow-subtle border border-[#e4e4e7]/70 ${
                isDelivered
                  ? 'bg-[#fafafa] opacity-60'
                  : isProblem
                  ? 'bg-[#fafafa] border-[#b2b2b2]'
                  : 'bg-[#fafafa]'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e4e4e7]">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#f4f4f5] text-[#080808] flex items-center justify-center font-normal text-sm tracking-tight border border-[#e4e4e7] shrink-0">
                    #{pkg.orderIndex}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-[#696969]">
                        {pkg.trackingNumber}
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        📍 {prevPkg ? `+${legInfo.text} dari Stop #${originalIndex}` : `+${legInfo.text} dari Gudang`}
                      </span>
                      {pkg.isCod ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#292929] text-[#fafafa]">
                          COD: {formatRupiah(pkg.codAmount)}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f4f4f5] text-[#696969] border border-[#e4e4e7]">
                          Lunas
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <h3 className="text-lg font-medium text-[#080808] tracking-[-0.015em]">
                        {pkg.recipientName}
                      </h3>
                      {matchingHouse && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          🏡 {matchingHouse.photoUrl ? 'Ada Foto' : 'Titik GPS'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Move order up/down */}
                <div className="flex items-center gap-1 self-end sm:self-center">
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
              <div className="pt-3 space-y-3">
                <div>
                  <p className="text-xs text-[#696969] font-medium">{pkg.areaOrStreet}</p>
                  <p className="text-sm text-[#222222] leading-relaxed mt-0.5 max-w-[55ch]">
                    {pkg.fullAddress}
                  </p>
                </div>

                {pkg.benchmark && (
                  <div className="text-xs bg-[#f4f4f5] p-3 rounded-[16px] text-[#222222] border border-[#e4e4e7]/60">
                    <span className="text-[#696969] font-medium">Patokan: </span>
                    <span>{pkg.benchmark}</span>
                  </div>
                )}

                {/* Actions: Dark Pill & Light Pill Buttons */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <a
                    href={getSingleNavigationUrl(pkg.lat, pkg.lng, pkg.fullAddress)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 bg-[#292929] hover:bg-[#080808] active:scale-95 text-[#fafafa] font-medium text-xs py-2.5 px-3 rounded-full transition text-center"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Maps</span>
                  </a>

                  <button
                    onClick={() => handleOpenWhatsApp(pkg)}
                    className="flex items-center justify-center gap-1.5 bg-[#f4f4f5] hover:bg-[#e4e4e7] active:scale-95 text-[#222222] font-medium text-xs py-2.5 px-3 rounded-full transition cursor-pointer border border-[#e4e4e7]"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#222222]" />
                    <span>Chat WA</span>
                  </button>

                  <a
                    href={`tel:${pkg.recipientPhone}`}
                    className="flex items-center justify-center gap-1.5 bg-[#f4f4f5] hover:bg-[#e4e4e7] active:scale-95 text-[#222222] font-medium text-xs py-2.5 px-3 rounded-full transition text-center border border-[#e4e4e7]"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#222222]" />
                    <span>Telp</span>
                  </a>

                  {onSaveHousePoint && (
                    <button
                      onClick={() => onSaveHousePoint(pkg)}
                      title="Catat titik GPS & foto rumah pelanggan ini"
                      className={`flex items-center justify-center gap-1.5 font-medium text-xs py-2.5 px-3 rounded-full transition cursor-pointer border ${
                        matchingHouse
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 font-bold'
                          : 'bg-[#f4f4f5] hover:bg-[#e4e4e7] text-[#222222] border-[#e4e4e7]'
                      }`}
                    >
                      <Home className="w-3.5 h-3.5 text-amber-600" />
                      <span>{matchingHouse ? '🏡 Titik Rumah' : '📍 Catat Rumah'}</span>
                    </button>
                  )}
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
                      const reason = prompt('Alasan gagal / retur (RTS):', 'Customer menolak paket COD');
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
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
