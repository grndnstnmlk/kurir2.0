import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Check,
  Share2,
  Save,
  RotateCcw,
  Clock,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import type { DeliveryPackage, CourierSettings } from '../types';
import { formatRupiah, calculateCodWithCourierFee } from '../utils/routeOptimizer';

interface CodSummaryViewProps {
  packages: DeliveryPackage[];
  settings: CourierSettings;
}

export interface SavedCashCountRecord {
  id: string;
  dateStr: string;
  savedAt: string;
  displayTime: string;
  counts: { [denom: number]: number };
  totalPhysical: number;
  totalCollectedCod: number;
  difference: number;
  notes?: string;
}

const STORAGE_KEY_CURRENT_COUNTS = 'kurir2_cod_cash_counts_v1';
const STORAGE_KEY_SAVED_RECORDS = 'kurir2_cod_saved_records_v1';

const DENOMINATIONS = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500];

export const CodSummaryView: React.FC<CodSummaryViewProps> = ({
  packages,
  settings,
}) => {
  const [copied, setCopied] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [countNotes, setCountNotes] = useState('');

  // 1. Baca hitungan uang fisik saat ini dari LocalStorage
  const [cashCounts, setCashCounts] = useState<{ [denom: number]: number }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_COUNTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object') return parsed;
      }
    } catch {
      // fallback
    }
    return {
      100000: 0,
      50000: 0,
      20000: 0,
      10000: 0,
      5000: 0,
      2000: 0,
      1000: 0,
      500: 0,
    };
  });

  // 2. Baca arsip riwayat hitungan tersimpan
  const [savedRecords, setSavedRecords] = useState<SavedCashCountRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_RECORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Otomatis simpan hitungan terkini ke LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_COUNTS, JSON.stringify(cashCounts));
    } catch (e) {
      console.error('Failed to save current cash counts:', e);
    }
  }, [cashCounts]);

  const codPackages = packages.filter((p) => p.isCod);
  const deliveredCod = codPackages.filter((p) => p.status === 'delivered');
  const pendingCod = codPackages.filter((p) => p.status === 'pending');
  const failedCod = codPackages.filter((p) => p.status === 'rescheduled' || p.status === 'failed' || p.status === 'returned');

  // 1. Setoran ke Kantor J&T (Harga Asli Paket Tanpa Biaya Tambahan Kurir)
  const totalCollected = deliveredCod.reduce((sum, p) => sum + p.codAmount, 0);
  const totalPending = pendingCod.reduce((sum, p) => sum + p.codAmount, 0);
  const totalTarget = codPackages.reduce((sum, p) => sum + p.codAmount, 0);

  // 2. Pendapatan Tambahan Biaya Pengantaran Kurir (10% Dibulatkan ke Ribuan)
  const totalDeliveredCourierFees = deliveredCod.reduce(
    (sum, p) => sum + calculateCodWithCourierFee(p.codAmount).courierFee,
    0
  );
  const totalTargetCourierFees = codPackages.reduce(
    (sum, p) => sum + calculateCodWithCourierFee(p.codAmount).courierFee,
    0
  );

  // 3. Total Fisik Tagihan yang Ditarik dari Pembeli (Setoran J&T + Ongkir Kurir)
  const totalBilledDelivered = totalCollected + totalDeliveredCourierFees;
  const totalBilledTarget = totalTarget + totalTargetCourierFees;

  const physicalCashTotal = Object.entries(cashCounts).reduce(
    (sum, [denom, count]) => sum + Number(denom) * (count || 0),
    0
  );

  const difference = physicalCashTotal - totalBilledDelivered;

  const handleCountChange = (denom: number, count: number) => {
    setCashCounts((prev) => ({
      ...prev,
      [denom]: Math.max(0, count || 0),
    }));
  };

  /**
   * Simpan Hasil Hitungan Uang Fisik Hari Ini
   */
  const handleSaveTodayCount = () => {
    if (physicalCashTotal === 0) {
      alert('Masukkan jumlah lembaran uang fisik terlebih dahulu sebelum menyimpan.');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const displayTime = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const displayDate = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const newRecord: SavedCashCountRecord = {
      id: `cash-count-${Date.now()}`,
      dateStr,
      savedAt: now.toISOString(),
      displayTime: `${displayDate}, ${displayTime} WIB`,
      counts: { ...cashCounts },
      totalPhysical: physicalCashTotal,
      totalCollectedCod: totalCollected,
      difference,
      notes: countNotes.trim() || undefined,
    };

    const updated = [newRecord, ...savedRecords.slice(0, 19)]; // Simpan hingga 20 arsip hitungan
    setSavedRecords(updated);
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_RECORDS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save cash records:', e);
    }

    setSaveSuccessMsg(
      `✅ Berhasil disimpan! Total fisik: ${formatRupiah(physicalCashTotal)} (${displayTime} WIB)`
    );
    setTimeout(() => setSaveSuccessMsg(null), 4500);
  };

  const handleResetCurrentCounts = () => {
    if (confirm('Reset hitungan uang fisik saat ini menjadi 0? Data yang sudah Anda klik "Simpan" tetap aman di riwayat.')) {
      const resetState = {
        100000: 0,
        50000: 0,
        20000: 0,
        10000: 0,
        5000: 0,
        2000: 0,
        1000: 0,
        500: 0,
      };
      setCashCounts(resetState);
      setCountNotes('');
    }
  };

  const handleRestoreRecord = (rec: SavedCashCountRecord) => {
    if (confirm(`Muat kembali hitungan uang tersimpan dari ${rec.displayTime}?`)) {
      setCashCounts(rec.counts);
      setCountNotes(rec.notes || '');
    }
  };

  const handleDeleteRecord = (id: string) => {
    const updated = savedRecords.filter((r) => r.id !== id);
    setSavedRecords(updated);
    localStorage.setItem(STORAGE_KEY_SAVED_RECORDS, JSON.stringify(updated));
  };

  const handleCopyReport = () => {
    const today = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Rincian lembaran jika sudah dihitung
    let physicalBreakdown = '';
    if (physicalCashTotal > 0) {
      const items = DENOMINATIONS.filter((d) => (cashCounts[d] || 0) > 0)
        .map((d) => `  • Rp ${d.toLocaleString('id-ID')} x ${cashCounts[d]} = ${formatRupiah(d * cashCounts[d])}`)
        .join('\n');

      physicalBreakdown = `\n💵 *RINCIAN UANG FISIK DI DOMPET:*
${items}
👉 *Total Fisik di Dompet:* ${formatRupiah(physicalCashTotal)}
⚖️ *Status Selisih:* ${
        difference === 0
          ? 'PAS Sempurna ✓'
          : difference > 0
          ? `LEBIH ${formatRupiah(difference)}`
          : `KURANG ${formatRupiah(Math.abs(difference))}`
      }\n`;
    }

    const reportText = `📋 *LAPORAN PENGANTARAN & SETORAN COD*
👤 Kurir: ${settings.courierName}
🏢 Drop Point: ${settings.dropPointName}
📅 Tanggal: ${today}

📦 *RINGKASAN PAKET:*
• Total Paket: ${packages.length}
• Terkirim: ${packages.filter((p) => p.status === 'delivered').length}
• Pending/Kosong: ${packages.filter((p) => p.status === 'pending' || p.status === 'rescheduled').length}
• Diretur: ${packages.filter((p) => p.status === 'returned').length}
• Gagal: ${packages.filter((p) => p.status === 'failed').length}

💰 *REKAP KASIR & ONGKIR KURIR:*
• Total Paket COD Selesai: ${deliveredCod.length} paket
• Setoran Kasir J&T (Harga Paket Asli): *${formatRupiah(totalCollected)}*
• Pendapatan Ongkir Kurir (+10% Dibulatkan): *${formatRupiah(totalDeliveredCourierFees)}*
👉 *Total Fisik Diterima Pembeli: ${formatRupiah(totalBilledDelivered)}*
• Sisa COD Pending: ${formatRupiah(totalPending)}
${physicalBreakdown}
Terima kasih 🙏 (Laporan via Kurir 2.0)`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5 font-aspekta bg-[#fafafa]">
      
      {/* Top Floating Card: Rekonsiliasi Kasir & Ongkir Kurir */}
      <div className="bg-[#fafafa] rounded-[32px] p-6 sm:p-7 shadow-subtle border border-[#e4e4e7]/70 space-y-4">
        <div>
          <p className="font-fasthand text-2xl text-[#696969] leading-none mb-1">
            setoran kasir j&t,
          </p>
          <span className="text-3xl sm:text-5xl font-normal text-[#080808] tracking-[-0.035em] block leading-none my-2">
            {formatRupiah(totalCollected)}
          </span>
          <p className="text-xs text-[#696969] mt-1 max-w-md">
            Total uang fisik COD yang wajib disetor ke kasir Drop Point sore ini ({deliveredCod.length} paket berhasil).
          </p>
        </div>

        {/* Breakdown Card: Setoran J&T vs Ongkir Kurir */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-2xs">
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mb-1">
              🎉 Milik Kurir (Kantong Sendiri)
            </span>
            <div className="text-xl font-bold text-neutral-900">
              {formatRupiah(totalDeliveredCourierFees)}
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Pendapatan ongkir kurir (+10% dibulatkan) dari {deliveredCod.length} paket terantar.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900 text-white shadow-2xs">
            <span className="text-[11px] font-semibold text-amber-300 bg-neutral-800 px-2.5 py-0.5 rounded-full inline-block mb-1">
              💵 Total Tagih ke Pembeli
            </span>
            <div className="text-xl font-bold text-white">
              {formatRupiah(totalBilledDelivered)}
            </div>
            <p className="text-[11px] text-neutral-300 mt-0.5">
              Total fisik diterima: Setoran J&T ({formatRupiah(totalCollected)}) + Ongkir Anda ({formatRupiah(totalDeliveredCourierFees)}).
            </p>
          </div>
        </div>

        <button
          onClick={handleCopyReport}
          className="mt-2 flex items-center justify-center gap-2 bg-[#292929] hover:bg-[#080808] active:scale-95 text-[#fafafa] font-medium text-xs py-3 px-6 rounded-full transition shadow-sm cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Format Laporan Tersalin!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Salin Laporan WhatsApp (Termasuk Rincian Fisik & Ongkir)</span>
            </>
          )}
        </button>
      </div>

      {/* Kalkulator Pecahan Uang Fisik */}
      <div className="bg-[#fafafa] rounded-[32px] p-6 sm:p-7 shadow-subtle border border-[#e4e4e7]/70 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-[#080808] tracking-tight flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#292929]" />
              <span>Kalkulator Pecahan Uang Fisik</span>
            </h3>
            <p className="text-xs text-[#696969] mt-0.5">
              Hitung lembaran fisik di dompet agar klop saat setoran kasir sore ini
            </p>
          </div>

          <div className="text-left sm:text-right bg-white sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-[#e4e4e7]">
            <span className="text-[10px] text-[#696969] block">Total Uang Fisik:</span>
            <span className="text-lg sm:text-xl font-bold text-[#080808]">
              {formatRupiah(physicalCashTotal)}
            </span>
          </div>
        </div>

        {/* Status Selisih Banner */}
        {physicalCashTotal > 0 && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold border flex items-center gap-2 transition-all ${
              difference === 0
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : difference > 0
                ? 'bg-blue-50 text-blue-900 border-blue-200'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}
          >
            {difference === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <div>
              <span>
                {difference === 0
                  ? `✅ Uang Fisik PAS Sempurna dengan Total Tagihan (${formatRupiah(totalBilledDelivered)})!`
                  : difference > 0
                  ? `ℹ️ Uang fisik di dompet LEBIH ${formatRupiah(difference)} dari total tagihan pembeli.`
                  : `⚠️ Uang fisik di dompet KURANG ${formatRupiah(Math.abs(difference))} dari total tagihan pembeli (${formatRupiah(totalBilledDelivered)})!`}
              </span>
              <p className="text-[10px] text-neutral-600 font-normal mt-0.5">
                Setoran Kasir J&T: {formatRupiah(totalCollected)} | Milik Kurir Sendiri: {formatRupiah(totalDeliveredCourierFees)}
              </p>
            </div>
          </div>
        )}

        {/* Feedback Notifikasi Simpan */}
        {saveSuccessMsg && (
          <div className="p-3 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Denomination Inputs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {DENOMINATIONS.map((denom) => (
            <div
              key={denom}
              className="bg-white rounded-2xl p-3 border border-[#e4e4e7] flex items-center justify-between shadow-2xs hover:border-black/30 transition-all"
            >
              <div>
                <span className="text-xs font-bold text-[#080808] block">
                  Rp {denom.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-[#696969] font-mono">
                  = {formatRupiah(denom * (cashCounts[denom] || 0))}
                </span>
              </div>
              <input
                type="number"
                min="0"
                value={cashCounts[denom] || ''}
                onChange={(e) => handleCountChange(denom, parseInt(e.target.value, 10))}
                placeholder="0"
                className="w-14 bg-[#f4f4f5] border border-[#e4e4e7] text-center font-bold text-[#080808] text-xs py-1.5 rounded-full focus:outline-none focus:border-black focus:bg-white transition"
              />
            </div>
          ))}
        </div>

        {/* Catatan Tambahan (Opsional) */}
        <div>
          <label className="block text-[11px] text-[#696969] font-medium mb-1">
            Catatan Hitungan (Opsional, misal: titipan uang kembalian / uang lecek):
          </label>
          <input
            type="text"
            value={countNotes}
            onChange={(e) => setCountNotes(e.target.value)}
            placeholder="Contoh: Ada uang kembalian Rp 5.000 di Bu Siti..."
            className="w-full bg-white border border-[#e4e4e7] rounded-xl px-3.5 py-2 text-xs text-[#080808] focus:outline-none focus:border-black"
          />
        </div>

        {/* Action Buttons: Simpan & Reset */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-[#e4e4e7]">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveTodayCount}
              className="flex-1 sm:flex-none bg-[#080808] hover:bg-neutral-800 active:scale-95 text-white font-bold text-xs py-3 px-5 rounded-full transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simpan Hasil Hitungan Hari Ini 💾</span>
            </button>

            <button
              onClick={handleResetCurrentCounts}
              title="Kosongkan hitungan untuk hitung ulang"
              className="py-3 px-3.5 rounded-full bg-white hover:bg-[#f4f4f5] text-[#696969] hover:text-[#080808] border border-[#e4e4e7] transition cursor-pointer text-xs font-semibold flex items-center gap-1 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <span className="text-[11px] text-[#696969] text-center sm:text-right">
            Hitungan otomatis diingat HP Anda
          </span>
        </div>

      </div>

      {/* Arsip Riwayat Hitungan Tersimpan (Memory History) */}
      {savedRecords.length > 0 && (
        <div className="bg-white rounded-[32px] p-6 sm:p-7 shadow-subtle border border-[#e4e4e7] space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#e4e4e7] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#080808]" />
              <h4 className="font-bold text-sm text-[#080808]">
                Riwayat Hitungan Fisik Tersimpan ({savedRecords.length})
              </h4>
            </div>
            <span className="text-[11px] text-[#696969]">Agar selalu ingat setelah dihitung</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {savedRecords.map((rec) => (
              <div
                key={rec.id}
                className="bg-[#f4f4f5] p-3.5 rounded-2xl border border-[#e4e4e7] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#080808]">
                      {formatRupiah(rec.totalPhysical)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rec.difference === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.difference > 0
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rec.difference === 0
                        ? 'PAS ✓'
                        : rec.difference > 0
                        ? `Lebih ${formatRupiah(rec.difference)}`
                        : `Kurang ${formatRupiah(Math.abs(rec.difference))}`}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#696969] mt-0.5">
                    Waktu simpan: <span className="font-mono font-medium text-neutral-800">{rec.displayTime}</span>
                  </p>

                  {/* Ringkasan Lembaran */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px] font-mono text-neutral-700">
                    {DENOMINATIONS.filter((d) => (rec.counts[d] || 0) > 0).map((d) => (
                      <span key={d} className="bg-white px-2 py-0.5 rounded-md border border-[#e4e4e7]">
                        {d >= 1000 ? `${d / 1000}k` : d} x {rec.counts[d]}
                      </span>
                    ))}
                  </div>

                  {rec.notes && (
                    <p className="text-[11px] text-amber-800 mt-1 italic">
                      💡 Catatan: "{rec.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleRestoreRecord(rec)}
                    title="Muat kembali hitungan ini ke kalkulator"
                    className="px-3 py-1.5 rounded-full bg-white hover:bg-neutral-100 text-[#080808] font-bold text-[11px] border border-[#e4e4e7] transition cursor-pointer shadow-2xs"
                  >
                    Muat Ulang
                  </button>

                  <button
                    onClick={() => handleDeleteRecord(rec.id)}
                    title="Hapus riwayat hitungan ini"
                    className="p-1.5 rounded-full text-red-500 hover:bg-red-50 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
