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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5 font-clash bg-[#fff8f6]">
      {/* Top Hero Statement: Agence Foudre Typography */}
      <div className="bg-[#fce5df]/60 border border-[#fce5df] rounded-[20px] p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#00522d]">
          KASIR REKONSILIASI
        </p>
        <div className="my-2">
          <span className="font-beni font-black text-5xl sm:text-7xl text-[#db3c8a] tracking-tight leading-none block">
            {formatRupiah(totalCollected)}
          </span>
          <p className="text-xs text-[#00522d] mt-1 font-medium">
            Total uang fisik COD yang wajib disetor sore ini dari {deliveredCod.length} paket terbayar.
          </p>
        </div>

        <button
          onClick={handleCopyReport}
          className="mt-4 flex items-center justify-center gap-2 bg-[#db3c8a] hover:bg-[#c22e77] active:scale-95 text-white font-bold text-xs py-3 px-6 rounded-[10px] transition cursor-pointer"
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

      {/* Kalkulator Pecahan Uang Fisik */}
      <div className="bg-[#fff8f6] border border-[#fce5df] rounded-[20px] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#00522d] flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#db3c8a]" />
              Kalkulator Pecahan Uang Fisik
            </h3>
            <p className="text-xs text-[#00522d]/80 mt-0.5">
              Hitung lembaran fisik di dompet agar klop dengan kasir Drop Point
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#00522d] uppercase font-bold block">Uang Fisik:</span>
            <span className="text-base font-bold text-[#db3c8a]">
              {formatRupiah(physicalCashTotal)}
            </span>
          </div>
        </div>

        {physicalCashTotal > 0 && (
          <div
            className={`p-3 rounded-[10px] text-xs font-bold ${
              difference === 0
                ? 'bg-[#00522d] text-white'
                : difference > 0
                ? 'bg-[#fce5df] text-[#00522d] border border-[#fce5df]'
                : 'bg-[#db3c8a] text-white'
            }`}
          >
            {difference === 0
              ? '✅ Uang Fisik PAS Sempurna dengan Rekap Sistem!'
              : difference > 0
              ? `ℹ️ Uang fisik LEBIH ${formatRupiah(difference)} dari catatan sistem.`
              : `⚠️ Uang fisik KURANG ${formatRupiah(Math.abs(difference))} dari catatan sistem! Cek kembali paket COD.`}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[100000, 50000, 20000, 10000, 5000, 2000, 1000].map((denom) => (
            <div
              key={denom}
              className="bg-[#fce5df]/60 rounded-[10px] p-2.5 border border-[#fce5df] flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-[#00522d] block">
                  Rp {denom.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-[#00522d]/70 font-mono">
                  = {formatRupiah(denom * (cashCounts[denom] || 0))}
                </span>
              </div>
              <input
                type="number"
                min="0"
                value={cashCounts[denom] || ''}
                onChange={(e) => handleCountChange(denom, parseInt(e.target.value, 10))}
                placeholder="0"
                className="w-14 bg-[#fff8f6] border border-[#fce5df] text-center font-bold text-[#00522d] text-xs py-1 rounded-[6px] focus:outline-none focus:border-[#db3c8a]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
