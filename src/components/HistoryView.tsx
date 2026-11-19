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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5 font-aspekta bg-[#fafafa]">
      {/* Top Banner Card with Layered Shadow */}
      <div className="bg-[#fafafa] rounded-[32px] p-6 sm:p-7 shadow-subtle border border-[#e4e4e7]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="font-fasthand text-2xl text-[#696969] leading-none mb-1">
            arsip harian,
          </p>
          <h2 className="text-3xl font-normal text-[#080808] tracking-[-0.030em]">
            {history.length} Hari Pengantaran
          </h2>
          <p className="text-xs text-[#696969] mt-1">
            Paket aktif hari ini: <strong>{currentPackages.length} paket</strong>.
          </p>
        </div>

        <button
          onClick={handlePromptArchive}
          className="flex items-center justify-center gap-2 bg-[#292929] hover:bg-[#080808] active:scale-95 text-[#fafafa] font-medium text-xs py-3 px-6 rounded-full transition shadow-sm cursor-pointer"
        >
          <Archive className="w-4 h-4" />
          <span>Arsipkan Hari Ini</span>
        </button>
      </div>

      {/* Minimal Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#696969] absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari tanggal, nomor resi, atau nama customer..."
          className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full pl-11 pr-4 py-2.5 text-xs text-[#080808] placeholder-[#696969] focus:outline-none focus:border-[#292929]"
        />
      </div>

      {/* History Cards with 32px Radius */}
      <div className="space-y-3.5">
        {filteredHistory.map((entry) => {
          const isExpanded = expandedId === entry.id;

          return (
            <div
              key={entry.id}
              className="bg-[#fafafa] rounded-[32px] shadow-subtle border border-[#e4e4e7]/70 overflow-hidden"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="p-5 sm:p-6 flex items-center justify-between cursor-pointer hover:bg-[#f4f4f5]/60 transition"
              >
                <div>
                  <h3 className="font-medium text-base text-[#080808] tracking-[-0.015em]">
                    {entry.displayDate}
                  </h3>
                  <p className="text-xs text-[#696969] mt-0.5">
                    {entry.totalPackages} Paket • {entry.deliveredCount} Terkirim • Setoran COD:{' '}
                    <strong className="text-[#080808]">{formatRupiah(entry.codCollected)}</strong>
                  </p>
                </div>

                <div className="p-2 rounded-full bg-[#f4f4f5] text-[#222222]">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-5 sm:p-6 border-t border-[#e4e4e7] bg-[#f4f4f5]/40 space-y-3.5 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyDayReport(entry)}
                      className="px-3.5 py-1.5 rounded-full bg-[#292929] text-[#fafafa] font-medium transition cursor-pointer"
                    >
                      {copiedId === entry.id ? 'Tersalin!' : 'Salin Laporan WA'}
                    </button>
                    <button
                      onClick={() => onRestoreHistory(entry)}
                      className="px-3.5 py-1.5 rounded-full bg-[#fafafa] text-[#222222] font-medium border border-[#e4e4e7] transition cursor-pointer"
                    >
                      Buka ke Hari Aktif
                    </button>
                    <button
                      onClick={() => onDeleteHistory(entry.id)}
                      className="px-3.5 py-1.5 rounded-full text-[#696969] hover:text-[#080808] font-medium transition cursor-pointer ml-auto"
                    >
                      Hapus
                    </button>
                  </div>

                  <div className="divide-y divide-[#e4e4e7] pt-2">
                    {entry.packages.map((pkg, idx) => (
                      <div key={pkg.id || idx} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[#080808]">{pkg.recipientName}</p>
                          <p className="text-[11px] text-[#696969]">
                            {pkg.trackingNumber} • {pkg.areaOrStreet}
                          </p>
                        </div>
                        <span className="font-medium text-[#080808]">
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
