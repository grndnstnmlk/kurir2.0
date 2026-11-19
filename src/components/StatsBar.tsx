import React from 'react';
import { CheckCircle2, RefreshCw, ExternalLink, DollarSign, ArrowUpDown } from 'lucide-react';
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
    <div className="bg-[#fff8f6] border-b border-[#fce5df] px-4 py-3 font-clash">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* 4 Minimal Metric Cards in Agence Foudre Style */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[#fce5df]/60 rounded-[12px] p-3 border border-[#fce5df]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#00522d]">Total Paket</p>
            <p className="text-2xl font-black font-beni text-[#db3c8a] mt-0.5">{total}</p>
          </div>

          <div className="bg-[#fce5df]/60 rounded-[12px] p-3 border border-[#fce5df]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#00522d]">Terkirim</p>
            <p className="text-2xl font-black font-beni text-[#00522d] mt-0.5">{delivered}</p>
          </div>

          <div className="bg-[#fce5df]/60 rounded-[12px] p-3 border border-[#fce5df]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#00522d]">Sisa / Pending</p>
            <p className="text-2xl font-black font-beni text-[#db3c8a] mt-0.5">{pending}</p>
          </div>

          <div className="bg-[#fce5df]/60 rounded-[12px] p-3 border border-[#fce5df]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#00522d]">COD Terkumpul</p>
            <p className="text-sm font-bold text-[#db3c8a] mt-1.5 truncate" title={formatRupiah(codCollected)}>
              {formatRupiah(codCollected)}
            </p>
          </div>
        </div>

        {/* Controls: Strategy Selector & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#00522d] font-bold whitespace-nowrap">Strategi Rute:</span>
            <select
              value={strategy}
              onChange={(e) => onChangeStrategy(e.target.value as RouteStrategy)}
              className="bg-[#fce5df] text-[#00522d] font-bold px-3 py-1.5 rounded-[10px] border border-[#fce5df] focus:outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="farthest-first">Titik Terjauh Mundur (Rekomendasi Pro)</option>
              <option value="nearest-first">Terdekat Duluan</option>
              <option value="cluster-loop">Putar per Nama Jalan</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOptimize}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#fce5df] hover:bg-[#f29ebd]/50 active:scale-95 text-[#00522d] px-3.5 py-1.5 rounded-[10px] font-bold border border-[#fce5df] transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#db3c8a]" />
              <span>Urutkan Rute</span>
            </button>

            <button
              onClick={onOpenMultiStopMap}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#db3c8a] hover:bg-[#c22e77] active:scale-95 text-white px-3.5 py-1.5 rounded-[10px] font-bold transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Google Maps</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
