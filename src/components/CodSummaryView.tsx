import React, { useState } from 'react';
import { Calculator, Check, Share2 } from 'lucide-react';
import type { DeliveryPackage, CourierSettings } from '../types';

interface CodSummaryViewProps {
  packages: DeliveryPackage[];
  settings: CourierSettings;
}

export const CodSummaryView: React.FC<CodSummaryViewProps> = ({
  packages,
  settings,
}) => {
  const [copied, setCopied] = useState(false);

  const [cashCounts, setCashCounts] = useState<{ [denom: number]: number }>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const codPackages = packages.filter((p) => p.isCod);
  const deliveredCod = codPackages.filter((p) => p.status === 'delivered');
  const pendingCod = codPackages.filter((p) => p.status === 'pending');
  const failedCod = codPackages.filter((p) => p.status === 'rescheduled' || p.status === 'failed');

  const totalCollected = deliveredCod.reduce((sum, p) => sum + p.codAmount, 0);
  const totalPending = pendingCod.reduce((sum, p) => sum + p.codAmount, 0);
  const totalTarget = codPackages.reduce((sum, p) => sum + p.codAmount, 0);

  const physicalCashTotal = Object.entries(cashCounts).reduce(
    (sum, [denom, count]) => sum + Number(denom) * (count || 0),
    0
  );

  const difference = physicalCashTotal - totalCollected;

  const handleCountChange = (denom: number, count: number) => {
    setCashCounts((prev) => ({
      ...prev,
      [denom]: Math.max(0, count || 0),
    }));
  };

  const handleCopyReport = () => {
    const today = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const reportText = `📋 *LAPORAN PENGANTARAN & SETORAN COD*
👤 Kurir: ${settings.courierName}
🏢 Drop Point: ${settings.dropPointName}
📅 Tanggal: ${today}

📦 *RINGKASAN PAKET:*
• Total Paket: ${packages.length}
• Terkirim: ${packages.filter((p) => p.status === 'delivered').length}
• Pending/Kosong: ${packages.filter((p) => p.status === 'rescheduled').length}
• Gagal/Retur: ${packages.filter((p) => p.status === 'failed').length}

💰 *REKAP KASIR COD:*
• Total Paket COD Selesai: ${deliveredCod.length} paket
• Total Uang COD Fisik: *${formatRupiah(totalCollected)}*
• Sisa COD Pending: ${formatRupiah(totalPending)}

Terima kasih 🙏 (Laporan via Kurir 2.0)`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-3 sm:p-5 max-w-4xl mx-auto space-y-5">
      <div className="bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Total Uang COD Harus Disetor Sore Ini:
              </p>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">
              {formatRupiah(totalCollected)}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Dari <strong className="text-slate-200">{deliveredCod.length}</strong> paket COD yang sudah berhasil terkirim.
            </p>
          </div>

          <button
            onClick={handleCopyReport}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs py-3 px-5 rounded-xl shadow-lg shadow-emerald-600/30 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Format Laporan Tersalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Salin Laporan WhatsApp</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-800 text-xs">
          <div>
            <p className="text-slate-400">Total Tagihan COD</p>
            <p className="font-bold text-slate-200 mt-0.5">{formatRupiah(totalTarget)}</p>
          </div>
          <div>
            <p className="text-slate-400">COD Belum Diantar</p>
            <p className="font-bold text-amber-400 mt-0.5">{formatRupiah(totalPending)}</p>
          </div>
          <div>
            <p className="text-slate-400">COD Gagal/Retur</p>
            <p className="font-bold text-rose-400 mt-0.5">{failedCod.length} Paket</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm text-white">Kalkulator Pecahan Uang Kasir</h3>
              <p className="text-[11px] text-slate-400">
                Hitung lembaran fisik di dompet agar pas saat setor ke kasir Drop Point
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Total Uang Fisik Di Tangan:</span>
            <span className="text-sm font-black text-amber-300">
              {formatRupiah(physicalCashTotal)}
            </span>
          </div>
        </div>

        {physicalCashTotal > 0 && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between border ${
              difference === 0
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : difference > 0
                ? 'bg-blue-950/40 border-blue-500/50 text-blue-300'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
            }`}
          >
            <span>
              {difference === 0
                ? '✅ Uang Fisik PAS Sempurna dengan Rekap Sistem!'
                : difference > 0
                ? `ℹ️ Uang fisik LEBIH ${formatRupiah(difference)} dari catatan sistem.`
                : `⚠️ Uang fisik KURANG ${formatRupiah(Math.abs(difference))} dari catatan sistem! Cek kembali paket COD.`}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {[100000, 50000, 20000, 10000, 5000, 2000, 1000].map((denom) => (
            <div
              key={denom}
              className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-700/60 flex items-center justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-300 block">
                  Rp {denom.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  = {formatRupiah(denom * (cashCounts[denom] || 0))}
                </span>
              </div>
              <input
                type="number"
                min="0"
                value={cashCounts[denom] || ''}
                onChange={(e) => handleCountChange(denom, parseInt(e.target.value, 10))}
                placeholder="0"
                className="w-14 bg-slate-800 border border-slate-700 text-center font-bold text-white text-xs py-1 rounded-lg focus:outline-none focus:border-amber-400"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-xs text-white uppercase tracking-wider">
            Daftar Paket COD Hari Ini ({codPackages.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-700/50">
          {codPackages.map((pkg) => (
            <div key={pkg.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-300">{pkg.trackingNumber}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      pkg.status === 'delivered'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        : pkg.status === 'rescheduled'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {pkg.status === 'delivered'
                      ? 'Terkirim & Terbayar'
                      : pkg.status === 'rescheduled'
                      ? 'Ditunda'
                      : 'Belum Diantar'}
                  </span>
                </div>
                <p className="font-semibold text-slate-100 mt-0.5">{pkg.recipientName}</p>
                <p className="text-[11px] text-slate-400 truncate max-w-xs">{pkg.fullAddress}</p>
              </div>

              <div className="text-right">
                <span className="font-black text-amber-300 text-sm">
                  {formatRupiah(pkg.codAmount)}
                </span>
                <span className="block text-[10px] text-slate-400">Stop #{pkg.orderIndex}</span>
              </div>
            </div>
          ))}

          {codPackages.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              Belum ada paket COD yang tercatat hari ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
