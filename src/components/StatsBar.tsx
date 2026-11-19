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
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 shadow-inner">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <div className="bg-slate-800/90 rounded-xl p-2.5 border border-slate-700/60 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400">Total Paket</p>
            <p className="text-xl font-black text-white">{total}</p>
          </div>
          <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300 font-bold">
            100%
          </span>
        </div>

        <div className="bg-emerald-950/40 rounded-xl p-2.5 border border-emerald-800/50 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-emerald-300">Terkirim</p>
            <p className="text-xl font-black text-emerald-400">{delivered}</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="bg-amber-950/40 rounded-xl p-2.5 border border-amber-800/50 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-amber-300">Sisa / Pending</p>
            <p className="text-xl font-black text-amber-400">{pending}</p>
          </div>
          <span className="text-xs px-2 py-1 rounded bg-amber-900/60 text-amber-300 font-bold">
            {total > 0 ? Math.round((pending / total) * 100) : 0}%
          </span>
        </div>

        <div className="bg-indigo-950/40 rounded-xl p-2.5 border border-indigo-800/50 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-indigo-300">COD Terkumpul</p>
            <p className="text-sm font-black text-indigo-300 truncate" title={formatRupiah(codCollected)}>
              {formatRupiah(codCollected)}
            </p>
          </div>
          <DollarSign className="w-5 h-5 text-indigo-400 shrink-0" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-400 font-medium whitespace-nowrap">Strategi Rute:</span>
          <select
            value={strategy}
            onChange={(e) => onChangeStrategy(e.target.value as RouteStrategy)}
            className="bg-slate-800 text-slate-100 font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-red-500 cursor-pointer w-full sm:w-auto"
          >
            <option value="farthest-first">🏁 Titik Terjauh Mundur (Rekomendasi)</option>
            <option value="nearest-first">⚡ Terdekat Duluan</option>
            <option value="cluster-loop">🔄 Putar per Nama Jalan</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOptimize}
            title="Susun ulang urutan pengantaran Stop 1, Stop 2..."
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 font-medium transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-red-400" />
            <span>Urutkan Otomatis</span>
          </button>

          <button
            onClick={onOpenMultiStopMap}
            title="Buka seluruh urutan paket di Google Maps"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-3 py-1.5 rounded-lg font-medium shadow transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Google Maps Rute</span>
          </button>
        </div>
      </div>
    </div>
  );
};
