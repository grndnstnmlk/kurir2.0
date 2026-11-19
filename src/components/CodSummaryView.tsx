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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5 font-aspekta bg-[#fafafa]">
      {/* Top Floating Card: Qatchup Monochromatic Restraint */}
      <div className="bg-[#fafafa] rounded-[32px] p-6 sm:p-7 shadow-subtle border border-[#e4e4e7]/70">
        <p className="font-fasthand text-2xl text-[#696969] leading-none mb-1">
          rekonsiliasi kasir,
        </p>
        <span className="text-3xl sm:text-5xl font-normal text-[#080808] tracking-[-0.035em] block leading-none my-2">
          {formatRupiah(totalCollected)}
        </span>
        <p className="text-xs text-[#696969] mt-1 max-w-md">
          Total uang fisik COD yang wajib disetor ke kasir Drop Point sore ini dari {deliveredCod.length} paket berhasil.
        </p>

        <button
          onClick={handleCopyReport}
          className="mt-4 flex items-center justify-center gap-2 bg-[#292929] hover:bg-[#080808] active:scale-95 text-[#fafafa] font-medium text-xs py-3 px-6 rounded-full transition shadow-sm cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Format Laporan Tersalin!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Salin Laporan WhatsApp</span>
            </>
          )}
        </button>
      </div>

      {/* Kalkulator Pecahan Uang Fisik */}
      <div className="bg-[#fafafa] rounded-[32px] p-6 sm:p-7 shadow-subtle border border-[#e4e4e7]/70 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-base text-[#080808] tracking-[-0.015em] flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#292929]" />
              Kalkulator Pecahan Uang Fisik
            </h3>
            <p className="text-xs text-[#696969] mt-0.5">
              Hitung lembaran fisik di dompet agar klop saat setoran sore
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#696969] block">Total Fisik:</span>
            <span className="text-sm sm:text-base font-medium text-[#080808]">
              {formatRupiah(physicalCashTotal)}
            </span>
          </div>
        </div>

        {physicalCashTotal > 0 && (
          <div
            className={`p-3 rounded-[16px] text-xs font-medium border ${
              difference === 0
                ? 'bg-[#f4f4f5] text-[#080808] border-[#292929]'
                : difference > 0
                ? 'bg-[#f4f4f5] text-[#222222] border-[#e4e4e7]'
                : 'bg-[#f4f4f5] text-[#080808] border-[#696969]'
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
              className="bg-[#f4f4f5] rounded-[16px] p-3 border border-[#e4e4e7] flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-medium text-[#080808] block">
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
                className="w-14 bg-[#fafafa] border border-[#e4e4e7] text-center font-medium text-[#080808] text-xs py-1 rounded-full focus:outline-none focus:border-[#292929]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
