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
    <div className="p-3 sm:p-5 max-w-4xl mx-auto space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
            filter === 'pending'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Belum Diantar ({packages.filter((p) => p.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
            filter === 'all'
              ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/20'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Semua ({packages.length})
        </button>
        <button
          onClick={() => setFilter('delivered')}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
            filter === 'delivered'
              ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Terkirim ({packages.filter((p) => p.status === 'delivered').length})
        </button>
        <button
          onClick={() => setFilter('problem')}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
            filter === 'problem'
              ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-600/20'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Kendala ({packages.filter((p) => p.status === 'rescheduled' || p.status === 'failed').length})
        </button>
      </div>

      {/* Empty State */}
      {filteredPackages.length === 0 && (
        <div className="text-center py-12 px-4 bg-slate-900/60 rounded-2xl border border-slate-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-lg font-bold text-slate-200">
            {filter === 'pending'
              ? 'Luar Biasa! Semua Paket Sudah Selesai Diantar! 🎉'
              : 'Tidak Ada Paket Dalam Kategori Ini'}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {filter === 'pending'
              ? 'Periksa tab Rekap COD untuk mencocokkan uang setoran ke kasir Drop Point.'
              : 'Gunakan tombol + Scan Resi di atas untuk menambahkan paket baru.'}
          </p>
        </div>
      )}

      {/* List of Delivery Stop Cards */}
      <div className="space-y-3">
        {filteredPackages.map((pkg) => {
          const originalIndex = packages.findIndex((p) => p.id === pkg.id);
          const isDelivered = pkg.status === 'delivered';
          const isProblem = pkg.status === 'rescheduled' || pkg.status === 'failed';

          return (
            <div
              key={pkg.id}
              className={`rounded-2xl border transition-all duration-200 shadow-md ${
                isDelivered
                  ? 'bg-emerald-950/20 border-emerald-800/40 opacity-75'
                  : isProblem
                  ? 'bg-rose-950/20 border-rose-800/40'
                  : 'bg-slate-800/90 border-slate-700/80 hover:border-red-500/50'
              }`}
            >
              {/* Card Header: Stop Number, Status, COD badge */}
              <div className="px-4 py-3 border-b border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-md ${
                      isDelivered
                        ? 'bg-emerald-600 text-white'
                        : isProblem
                        ? 'bg-rose-600 text-white'
                        : 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-red-500/25'
                    }`}
                  >
                    #{pkg.orderIndex}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {pkg.trackingNumber}
                      </span>
                      {pkg.isCod ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          COD: {formatRupiah(pkg.codAmount)}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                          NON-COD (Lunas)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      Penerima: <strong className="text-slate-100">{pkg.recipientName}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    disabled={originalIndex === 0}
                    onClick={() => onMovePackage(originalIndex, 'up')}
                    title="Naikkan Urutan"
                    className="p-1 rounded bg-slate-700/70 hover:bg-slate-600 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    disabled={originalIndex === packages.length - 1}
                    onClick={() => onMovePackage(originalIndex, 'down')}
                    title="Turunkan Urutan"
                    className="p-1 rounded bg-slate-700/70 hover:bg-slate-600 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Body: Address, Benchmark */}
              <div className="p-4 space-y-2.5">
                <div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-100 leading-snug">
                        {pkg.areaOrStreet || pkg.fullAddress}
                      </p>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        {pkg.fullAddress}
                      </p>
                    </div>
                  </div>

                  {pkg.benchmark && (
                    <div className="mt-2 text-xs bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 text-amber-200 flex items-start gap-1.5">
                      <span className="font-bold shrink-0">💡 Patokan:</span>
                      <span>{pkg.benchmark}</span>
                    </div>
                  )}

                  {pkg.statusNotes && (
                    <div className="mt-2 text-xs bg-slate-900 rounded-lg p-2 text-slate-300 border border-slate-700 flex items-start gap-1.5">
                      <span className="font-semibold text-rose-400 shrink-0">Catatan:</span>
                      <span>{pkg.statusNotes}</span>
                    </div>
                  )}
                </div>

                {/* Fast Action Buttons: Google Maps, WhatsApp, Phone */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <a
                    href={getSingleNavigationUrl(pkg.lat, pkg.lng, pkg.fullAddress)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-md shadow-blue-600/30 transition text-center"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Maps</span>
                  </a>

                  <button
                    onClick={() => handleOpenWhatsApp(pkg)}
                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-md shadow-emerald-600/30 transition cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat WA</span>
                  </button>

                  <a
                    href={`tel:${pkg.recipientPhone}`}
                    className="flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-100 font-bold text-xs py-2.5 px-3 rounded-xl transition text-center"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Telp</span>
                  </a>
                </div>

                {/* Status Toggle Bar */}
                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-1.5 text-xs">
                  <button
                    onClick={() =>
                      onUpdateStatus(
                        pkg.id,
                        pkg.status === 'delivered' ? 'pending' : 'delivered'
                      )
                    }
                    className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                      pkg.status === 'delivered'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-700/60 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300'
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
                    className={`py-1.5 px-2.5 rounded-lg font-medium flex items-center justify-center gap-1 transition cursor-pointer ${
                      pkg.status === 'rescheduled'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-700/60 hover:bg-amber-950/60 text-slate-300 hover:text-amber-300'
                    }`}
                    title="Rumah Kosong / Tunda Pengantaran"
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
                    className={`py-1.5 px-2 rounded-lg font-medium flex items-center justify-center gap-1 transition cursor-pointer ${
                      pkg.status === 'failed'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-700/60 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300'
                    }`}
                    title="Gagal / Retur"
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
