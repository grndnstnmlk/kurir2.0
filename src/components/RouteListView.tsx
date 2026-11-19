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
} from 'lucide-react';
import type { DeliveryPackage, PackageStatus } from '../types';
import { getSingleNavigationUrl } from '../utils/routeOptimizer';

interface RouteListViewProps {
  packages: DeliveryPackage[];
  onUpdateStatus: (id: string, status: PackageStatus, notes?: string) => void;
  onMovePackage: (index: number, direction: 'up' | 'down') => void;
  whatsAppTemplate: string;
}

export const RouteListView: React.FC<RouteListViewProps> = ({
  packages,
  onUpdateStatus,
  onMovePackage,
  whatsAppTemplate,
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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4 font-clash bg-[#fff8f6]">
      {/* Editorial Pill Filter Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
            filter === 'pending'
              ? 'bg-[#db3c8a] text-white'
              : 'bg-[#fce5df] text-[#00522d] hover:bg-[#f29ebd]/50'
          }`}
        >
          Belum Diantar ({packages.filter((p) => p.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
            filter === 'all'
              ? 'bg-[#db3c8a] text-white'
              : 'bg-[#fce5df] text-[#00522d] hover:bg-[#f29ebd]/50'
          }`}
        >
          Semua ({packages.length})
        </button>
        <button
          onClick={() => setFilter('delivered')}
          className={`px-4 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
            filter === 'delivered'
              ? 'bg-[#db3c8a] text-white'
              : 'bg-[#fce5df] text-[#00522d] hover:bg-[#f29ebd]/50'
          }`}
        >
          Terkirim ({packages.filter((p) => p.status === 'delivered').length})
        </button>
        <button
          onClick={() => setFilter('problem')}
          className={`px-4 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
            filter === 'problem'
              ? 'bg-[#db3c8a] text-white'
              : 'bg-[#fce5df] text-[#00522d] hover:bg-[#f29ebd]/50'
          }`}
        >
          Kendala ({packages.filter((p) => p.status === 'rescheduled' || p.status === 'failed').length})
        </button>
      </div>

      {filteredPackages.length === 0 && (
        <div className="text-center py-14 px-4 bg-[#fce5df]/40 rounded-[20px] border border-[#fce5df]">
          <CheckCircle2 className="w-12 h-12 text-[#00522d] mx-auto mb-3 opacity-80" />
          <h3 className="text-xl font-black font-beni text-[#db3c8a] uppercase">
            Semua Paket Sudah Selesai!
          </h3>
          <p className="text-sm text-[#00522d] mt-1">
            Buka tab Rekap COD untuk mencocokkan uang setoran ke kasir Drop Point.
          </p>
        </div>
      )}

      {/* Package Stop Cards */}
      <div className="space-y-3">
        {filteredPackages.map((pkg) => {
          const originalIndex = packages.findIndex((p) => p.id === pkg.id);
          const isDelivered = pkg.status === 'delivered';
          const isProblem = pkg.status === 'rescheduled' || pkg.status === 'failed';

          return (
            <div
              key={pkg.id}
              className={`rounded-[20px] border transition-all ${
                isDelivered
                  ? 'bg-[#fce5df]/30 border-[#fce5df] opacity-75'
                  : isProblem
                  ? 'bg-[#fce5df]/70 border-[#db3c8a]'
                  : 'bg-[#fff8f6] border-[#fce5df] hover:border-[#db3c8a]'
              }`}
            >
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#fce5df]">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-[12px] bg-[#db3c8a] text-white flex items-center justify-center font-beni font-black text-2xl shrink-0">
                    #{pkg.orderIndex}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#00522d]">
                        {pkg.trackingNumber}
                      </span>
                      {pkg.isCod ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#db3c8a] text-white flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          COD: {formatRupiah(pkg.codAmount)}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#fce5df] text-[#00522d]">
                          Lunas
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-[#00522d] mt-1">
                      {pkg.recipientName}
                    </h3>
                    <p className="text-xs text-[#00522d]/80 font-mono">
                      {pkg.recipientPhone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    disabled={originalIndex === 0}
                    onClick={() => onMovePackage(originalIndex, 'up')}
                    className="p-2 rounded-[8px] bg-[#fce5df] hover:bg-[#f29ebd]/50 text-[#00522d] disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    disabled={originalIndex === packages.length - 1}
                    onClick={() => onMovePackage(originalIndex, 'down')}
                    className="p-2 rounded-[8px] bg-[#fce5df] hover:bg-[#f29ebd]/50 text-[#00522d] disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#db3c8a] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-[#00522d]">
                      {pkg.areaOrStreet}
                    </p>
                    <p className="text-xs text-[#00522d]/90 leading-relaxed mt-0.5 max-w-[60ch]">
                      {pkg.fullAddress}
                    </p>
                  </div>
                </div>

                {pkg.benchmark && (
                  <div className="text-xs bg-[#fce5df] p-2.5 rounded-[10px] text-[#00522d]">
                    <strong className="text-[#db3c8a]">Patokan:</strong> {pkg.benchmark}
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <a
                    href={getSingleNavigationUrl(pkg.lat, pkg.lng, pkg.fullAddress)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 bg-[#db3c8a] hover:bg-[#c22e77] active:scale-95 text-white font-bold text-xs py-2.5 px-3 rounded-[10px] transition text-center"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Maps</span>
                  </a>

                  <button
                    onClick={() => handleOpenWhatsApp(pkg)}
                    className="flex items-center justify-center gap-1.5 bg-[#fce5df] hover:bg-[#f29ebd]/50 active:scale-95 text-[#00522d] font-bold text-xs py-2.5 px-3 rounded-[10px] transition cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-[#00522d]" />
                    <span>Chat WA</span>
                  </button>

                  <a
                    href={`tel:${pkg.recipientPhone}`}
                    className="flex items-center justify-center gap-1.5 bg-[#fce5df] hover:bg-[#f29ebd]/50 active:scale-95 text-[#00522d] font-bold text-xs py-2.5 px-3 rounded-[10px] transition text-center"
                  >
                    <Phone className="w-4 h-4 text-[#00522d]" />
                    <span>Telp</span>
                  </a>
                </div>

                {/* Status Toggle */}
                <div className="pt-2 border-t border-[#fce5df] flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() =>
                      onUpdateStatus(
                        pkg.id,
                        pkg.status === 'delivered' ? 'pending' : 'delivered'
                      )
                    }
                    className={`flex-1 py-2 px-3 rounded-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      pkg.status === 'delivered'
                        ? 'bg-[#00522d] text-white'
                        : 'bg-[#fce5df] text-[#00522d] hover:bg-[#f29ebd]/50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{pkg.status === 'delivered' ? 'Sudah Terkirim' : 'Tandai Terkirim'}</span>
                  </button>

                  <button
                    onClick={() => {
                      const note = prompt('Alasan tunda / rumah kosong:', 'Rumah kosong / pagar terkunci');
                      if (note !== null) {
                        onUpdateStatus(pkg.id, 'rescheduled', note);
                      }
                    }}
                    className={`py-2 px-3 rounded-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                      pkg.status === 'rescheduled'
                        ? 'bg-[#db3c8a] text-white'
                        : 'bg-[#fce5df] text-[#00522d] hover:bg-[#f29ebd]/50'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Kosong</span>
                  </button>

                  <button
                    onClick={() => {
                      const reason = prompt('Alasan gagal / retur (RTS):', 'Customer menolak paket COD');
                      if (reason !== null) {
                        onUpdateStatus(pkg.id, 'failed', reason);
                      }
                    }}
                    className={`py-2 px-3 rounded-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                      pkg.status === 'failed'
                        ? 'bg-[#db3c8a] text-white'
                        : 'bg-[#fce5df] text-[#00522d] hover:bg-[#f29ebd]/50'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
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
