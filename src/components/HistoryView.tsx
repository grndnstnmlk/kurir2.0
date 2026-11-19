import React, { useState } from 'react';
import {
  Calendar,
  Archive,
  ChevronDown,
  ChevronUp,
  Check,
  Share2,
  Trash2,
  RotateCcw,
  Search,
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

  const handleCopyDayReport = (entry: DailyHistoryEntry) => {
    const reportText = `📋 *ARSIP LAPORAN PENGANTARAN J&T*
👤 Kurir: ${settings.courierName}
🏢 Drop Point: ${settings.dropPointName}
📅 Tanggal: ${entry.displayDate}

📦 *RINGKASAN:*
• Total Paket: ${entry.totalPackages}
• Terkirim: ${entry.deliveredCount}
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
      alert('Berhasil! Paket hari ini telah diarsipkan ke Riwayat.');
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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5 font-clash bg-[#fff8f6]">
      {/* Top Banner */}
      <div className="bg-[#fce5df]/60 border border-[#fce5df] rounded-[20px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#00522d]">
            ARSIP BUKU HARIAN
          </p>
          <h2 className="text-4xl font-black font-beni text-[#db3c8a] mt-1 leading-none uppercase">
            {history.length} HARI TERCATAT
          </h2>
          <p className="text-xs text-[#00522d] mt-1">
            Paket aktif hari ini: <strong>{currentPackages.length} paket</strong>.
          </p>
        </div>

        <button
          onClick={handlePromptArchive}
          className="flex items-center justify-center gap-2 bg-[#db3c8a] hover:bg-[#c22e77] active:scale-95 text-white font-bold text-xs py-3 px-6 rounded-[10px] transition cursor-pointer"
        >
          <Archive className="w-4 h-4" />
          <span>Arsipkan Hari Ini</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#00522d]/60 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari tanggal, nomor resi, atau nama customer..."
          className="w-full bg-[#fce5df]/40 border border-[#fce5df] rounded-[10px] pl-11 pr-4 py-2.5 text-xs text-[#00522d] placeholder-[#00522d]/60 focus:outline-none focus:border-[#db3c8a]"
        />
      </div>

      {/* History Cards */}
      <div className="space-y-3">
        {filteredHistory.map((entry) => {
          const isExpanded = expandedId === entry.id;

          return (
            <div
              key={entry.id}
              className="bg-[#fff8f6] border border-[#fce5df] rounded-[20px] overflow-hidden"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-[#fce5df]/40 transition"
              >
                <div>
                  <h3 className="font-bold text-base text-[#00522d]">{entry.displayDate}</h3>
                  <p className="text-xs text-[#00522d]/80 mt-0.5">
                    {entry.totalPackages} Paket • {entry.deliveredCount} Terkirim • Setoran COD:{' '}
                    <strong className="text-[#db3c8a]">{formatRupiah(entry.codCollected)}</strong>
                  </p>
                </div>

                <div className="p-2 rounded-full bg-[#fce5df] text-[#00522d]">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-5 border-t border-[#fce5df] bg-[#fce5df]/20 space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyDayReport(entry)}
                      className="px-3 py-1.5 rounded-[8px] bg-[#db3c8a] text-white font-bold transition cursor-pointer"
                    >
                      {copiedId === entry.id ? 'Tersalin!' : 'Salin Laporan WA'}
                    </button>
                    <button
                      onClick={() => onRestoreHistory(entry)}
                      className="px-3 py-1.5 rounded-[8px] bg-[#fce5df] text-[#00522d] font-bold border border-[#fce5df] transition cursor-pointer"
                    >
                      Buka ke Hari Aktif
                    </button>
                    <button
                      onClick={() => onDeleteHistory(entry.id)}
                      className="px-3 py-1.5 rounded-[8px] text-[#db3c8a] font-bold hover:bg-[#fce5df] transition cursor-pointer ml-auto"
                    >
                      Hapus
                    </button>
                  </div>

                  <div className="divide-y divide-[#fce5df] pt-2">
                    {entry.packages.map((pkg, idx) => (
                      <div key={pkg.id || idx} className="py-2 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-[#00522d]">{pkg.recipientName}</p>
                          <p className="text-[11px] text-[#00522d]/70">{pkg.trackingNumber} • {pkg.areaOrStreet}</p>
                        </div>
                        <span className="font-bold text-[#db3c8a]">
                          {pkg.isCod ? formatRupiah(pkg.codAmount) : 'Lunas'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
