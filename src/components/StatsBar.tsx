import React from 'react';
import { RefreshCw, ExternalLink, ArrowUpDown } from 'lucide-react';
import type { DeliveryPackage, RouteStrategy } from '../types';

interface StatsBarProps {
  packages: DeliveryPackage[];
  strategy: RouteStrategy;
  onOptimize: () => void;
  onOpenMultiStopMap: () => void;
  onChangeStrategy: (strategy: RouteStrategy) => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  packages,
  strategy,
  onOptimize,
  onOpenMultiStopMap,
  onChangeStrategy,
}) => {
  const total = packages.length;
  const delivered = packages.filter((p) => p.status === 'delivered').length;
  const pending = packages.filter((p) => p.status === 'pending').length;

  const codCollected = packages
    .filter((p) => p.status === 'delivered' && p.isCod)
    .reduce((sum, p) => sum + p.codAmount, 0);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-[#fafafa] border-b border-[#e4e4e7] px-5 py-4 font-aspekta">
      <div className="max-w-4xl mx-auto space-y-3.5">
        {/* 4 Floating Metric Cards with Layered Hairline Shadows */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#fafafa] rounded-[24px] p-4 shadow-subtle border border-[#e4e4e7]/60">
            <span className="text-xs text-[#696969] tracking-[-0.010em] block">Total Paket</span>
            <span className="text-2xl sm:text-3xl font-normal text-[#080808] tracking-[-0.030em] mt-0.5 block">
              {total}
            </span>
          </div>

          <div className="bg-[#fafafa] rounded-[24px] p-4 shadow-subtle border border-[#e4e4e7]/60">
            <span className="text-xs text-[#696969] tracking-[-0.010em] block">Terkirim</span>
            <span className="text-2xl sm:text-3xl font-normal text-[#080808] tracking-[-0.030em] mt-0.5 block">
              {delivered}
            </span>
          </div>

          <div className="bg-[#fafafa] rounded-[24px] p-4 shadow-subtle border border-[#e4e4e7]/60">
            <span className="text-xs text-[#696969] tracking-[-0.010em] block">Sisa / Pending</span>
            <span className="text-2xl sm:text-3xl font-normal text-[#080808] tracking-[-0.030em] mt-0.5 block">
              {pending}
            </span>
          </div>

          <div className="bg-[#fafafa] rounded-[24px] p-4 shadow-subtle border border-[#e4e4e7]/60">
            <span className="text-xs text-[#696969] tracking-[-0.010em] block">COD Terkumpul</span>
            <span className="text-sm sm:text-base font-medium text-[#080808] tracking-[-0.015em] mt-1.5 block truncate" title={formatRupiah(codCollected)}>
              {formatRupiah(codCollected)}
            </span>
          </div>
        </div>

        {/* Controls: Strategy Selector & Pill Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#696969] font-medium whitespace-nowrap">Strategi Rute:</span>
            <select
              value={strategy}
              onChange={(e) => onChangeStrategy(e.target.value as RouteStrategy)}
              className="bg-[#f4f4f5] text-[#222222] font-medium px-3.5 py-1.5 rounded-full border border-[#e4e4e7] focus:outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="farthest-first">Titik Terjauh Mundur (Rekomendasi Pro)</option>
              <option value="nearest-first">Terdekat Duluan</option>
              <option value="cluster-loop">Putar per Nama Jalan</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOptimize}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#f4f4f5] hover:bg-[#e4e4e7] active:scale-95 text-[#222222] px-4 py-1.5 rounded-full font-medium border border-[#e4e4e7] transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#696969]" />
              <span>Urutkan Rute</span>
            </button>

            <button
              onClick={onOpenMultiStopMap}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#292929] hover:bg-[#080808] active:scale-95 text-[#fafafa] px-4 py-1.5 rounded-full font-medium transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Google Maps Rute</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
