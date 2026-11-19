import React, { useState } from 'react';
import {
  Calendar,
  Archive,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  DollarSign,
  Share2,
  Trash2,
  RotateCcw,
  Search,
  Check,
  Package,
} from 'lucide-react';
import type { DailyHistoryEntry, DeliveryPackage, CourierSettings } from '../types';

interface HistoryViewProps {
  history: DailyHistoryEntry[];
  currentPackages: DeliveryPackage[];
  settings: CourierSettings;
  onArchiveToday: (notes?: string) => void;
  onDeleteHistory: (id: string) => void;
  onRestoreHistory: (entry: DailyHistoryEntry) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  currentPackages,
  settings,
  onArchiveToday,
  onDeleteHistory,
  onRestoreHistory,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Hitung total sepanjang masa
  const allTimePackages = history.reduce((sum, h) => sum + h.totalPackages, 0);
  const allTimeDelivered = history.reduce((sum, h) => sum + h.deliveredCount, 0);
  const allTimeCod = history.reduce((sum, h) => sum + h.codCollected, 0);

  const handleCopyDayReport = (entry: DailyHistoryEntry) => {
    const reportText = `📋 *ARSIP LAPORAN PENGANTARAN J&T*
👤 Kurir: ${settings.courierName}
🏢 Drop Point: ${settings.dropPointName}
📅 Tanggal: ${entry.displayDate}

📦 *RINGKASAN:*
• Total Paket: ${entry.totalPackages}
• Terkirim: ${entry.deliveredCount} (${entry.totalPackages > 0 ? Math.round((entry.deliveredCount / entry.totalPackages) * 100) : 0}%)
• Pending/Kosong: ${entry.rescheduledCount}
• Gagal/Retur: ${entry.failedCount}

💰 *TOTAL COD DISETOR:* *${formatRupiah(entry.codCollected)}*
${entry.notes ? `📝 Catatan: ${entry.notes}` : ''}

(Diarsipkan via Kurir 2.0)`;

    navigator.clipboard.writeText(reportText);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePromptArchive = () => {
    if (currentPackages.length === 0) {
      alert('Tidak ada paket aktif untuk diarsipkan hari ini.');
      return;
    }

    const notes = prompt(
      'Masukkan catatan pengantaran hari ini (opsional):',
      'Pengantaran hari ini lancar, setoran COD sudah diserahkan ke kasir.'
    );

    if (notes !== null) {
      onArchiveToday(notes);
      alert('Berhasil! Paket hari ini telah diarsipkan ke Riwayat dan daftar hari ini siap untuk besok.');
    }
  };

  const filteredHistory = history.filter((h) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchDate = h.displayDate.toLowerCase().includes(query) || h.date.includes(query);
    const matchNotes = h.notes?.toLowerCase().includes(query);
    const matchPackages = h.packages.some(
      (p) =>
        p.trackingNumber.toLowerCase().includes(query) ||
        p.recipientName.toLowerCase().includes(query) ||
        p.fullAddress.toLowerCase().includes(query)
    );
    return matchDate || matchNotes || matchPackages;
  });

  return (
    <div className="p-3 sm:p-5 max-w-4xl mx-auto space-y-5">
      {/* Top Banner: Statistik Total & Tombol Tutup Hari */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/40 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-400" />
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Buku Riwayat Harian Kurir
              </p>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {history.length} Hari Pengantaran Tercatat
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Total riwayat: <strong className="text-slate-200">{allTimePackages}</strong> paket (
              <strong className="text-emerald-400">{allTimeDelivered}</strong> terkirim) • COD:{' '}
              <strong className="text-amber-300">{formatRupiah(allTimeCod)}</strong>
            </p>
          </div>

          <button
            onClick={handlePromptArchive}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white font-bold text-xs py-3 px-5 rounded-xl shadow-lg shadow-red-600/30 transition cursor-pointer"
          >
            <Archive className="w-4 h-4" />
            <span>Arsipkan Hari Ini & Buka Hari Baru</span>
          </button>
        </div>

        {/* Status Paket Aktif Hari Ini */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Paket aktif hari ini:{' '}
            <strong className="text-slate-200">{currentPackages.length} paket</strong> (
            <strong className="text-emerald-400">
              {currentPackages.filter((p) => p.status === 'delivered').length} terkirim
            </strong>
            )
          </span>
          <span className="text-[11px] text-slate-500">
            Arsipkan sore hari setelah setoran ke kasir selesai
          </span>
        </div>
      </div>

      {/* Pencarian Riwayat */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari riwayat tanggal, nomor resi JX/JP, atau nama customer..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
        />
      </div>

      {/* Daftar Kartu Riwayat Harian */}
      <div className="space-y-3">
        {filteredHistory.map((entry) => {
          const isExpanded = expandedId === entry.id;
          const successRate =
            entry.totalPackages > 0
              ? Math.round((entry.deliveredCount / entry.totalPackages) * 100)
              : 0;

          return (
            <div
              key={entry.id}
              className="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg transition"
            >
              {/* Card Header: Tanggal & Ringkasan */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-700/30 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-red-400 leading-none">
                      {new Date(entry.date).toLocaleDateString('id-ID', { month: 'short' })}
                    </span>
                    <span className="text-sm font-black text-white leading-none mt-0.5">
                      {new Date(entry.date).getDate()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <span>{entry.displayDate}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {successRate}% Sukses
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {entry.totalPackages} Paket ({entry.deliveredCount} Terkirim •{' '}
                      {entry.failedCount + entry.rescheduledCount} Kendala)
                    </p>
                    {entry.notes && (
                      <p className="text-[11px] text-slate-400 italic mt-1 line-clamp-1">
                        "{entry.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Side: Total COD & Expand Chevron */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700/50">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Setoran COD:
                    </span>
                    <span className="text-sm font-black text-amber-300">
                      {formatRupiah(entry.codCollected)}
                    </span>
                  </div>

                  <div className="p-1.5 rounded-lg bg-slate-700/60 text-slate-300">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expandable Detail: Daftar Paket Hari Tersebut */}
              {isExpanded && (
                <div className="border-t border-slate-700/80 bg-slate-900/90 p-4 space-y-4">
                  {/* Action Bar Hari Tersebut */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyDayReport(entry);
                        }}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        {copiedId === entry.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Laporan Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Salin Laporan WA</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              'Muat kembali paket dari hari ini ke daftar aktif? (Paket hari ini saat ini akan digantikan).'
                            )
                          ) {
                            onRestoreHistory(entry);
                          }
                        }}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Buka ke Hari Aktif</span>
                      </button>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Hapus permanen riwayat tanggal ${entry.displayDate}?`)) {
                          onDeleteHistory(entry.id);
                        }
                      }}
                      className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Arsip Ini</span>
                    </button>
                  </div>

                  {/* List of packages from that day */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Rincian Paket ({entry.packages.length}):
                    </p>

                    <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
                      {entry.packages.map((pkg, idx) => (
                        <div
                          key={pkg.id || idx}
                          className="py-2.5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-300">
                                {pkg.trackingNumber}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  pkg.status === 'delivered'
                                    ? 'bg-emerald-950 text-emerald-400'
                                    : 'bg-rose-950 text-rose-400'
                                }`}
                              >
                                {pkg.status === 'delivered' ? 'Terkirim' : 'Kendala'}
                              </span>
                            </div>
                            <p className="font-semibold text-slate-100 mt-0.5">
                              {pkg.recipientName}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate max-w-sm">
                              {pkg.fullAddress}
                            </p>
                          </div>

                          <div className="text-right">
                            {pkg.isCod ? (
                              <span className="font-mono font-black text-amber-300 block">
                                {formatRupiah(pkg.codAmount)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-blue-300 font-semibold block">
                                Non-COD
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500">Stop #{pkg.orderIndex}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredHistory.length === 0 && (
          <div className="text-center py-12 px-4 bg-slate-900/60 rounded-2xl border border-slate-800">
            <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-slate-200">
              {searchQuery ? 'Tidak Ada Riwayat yang Cocok' : 'Belum Ada Arsip Riwayat Harian'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Setelah selesai mengantar paket hari ini dan setor COD ke kasir, klik tombol{' '}
              <strong className="text-red-400">"Arsipkan Hari Ini"</strong> di atas untuk menyimpan
              catatan hari ini secara permanen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
