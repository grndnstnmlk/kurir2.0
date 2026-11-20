import React from 'react';
import { RefreshCw, ExternalLink, Zap, CheckCircle2, Navigation } from 'lucide-react';
import type { DeliveryPackage, RouteStrategy } from '../types';
import {
  calculateTotalRouteDistanceKm,
  calculateEstimatedTravelTime,
  countRouteIntersections,
} from '../utils/routeOptimizer';

interface StatsBarProps {
  packages: DeliveryPackage[];
  strategy: RouteStrategy;
  onOptimize: () => void;
  onOpenMultiStopMap: () => void;
  onChangeStrategy: (strategy: RouteStrategy) => void;
  dropPointLat?: number;
  dropPointLng?: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  packages,
  strategy,
  onOptimize,
  onOpenMultiStopMap,
  onChangeStrategy,
  dropPointLat = -7.2107,
  dropPointLng = 113.4493,
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

  const totalDistanceKm = calculateTotalRouteDistanceKm(
    dropPointLat,
    dropPointLng,
    packages
  );
  const travelTime = calculateEstimatedTravelTime(totalDistanceKm, pending);
  const intersections = countRouteIntersections(
    dropPointLat,
    dropPointLng,
    packages
  );

  return (
    <div className="bg-[#fafafa] border-b border-[#e4e4e7] px-5 py-3 font-aspekta">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* 4 Floating Metric Cards with Layered Hairline Shadows */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[#fafafa] rounded-[22px] p-3.5 shadow-subtle border border-[#e4e4e7]/60">
            <span className="text-[11px] text-[#696969] tracking-[-0.010em] block">Total Paket</span>
            <span className="text-2xl font-bold text-[#080808] tracking-tight mt-0.5 block">
              {total}
            </span>
          </div>

          <div className="bg-[#fafafa] rounded-[22px] p-3.5 shadow-subtle border border-[#e4e4e7]/60">
            <span className="text-[11px] text-[#696969] tracking-[-0.010em] block">Terkirim</span>
            <span className="text-2xl font-bold text-emerald-700 tracking-tight mt-0.5 block">
              {delivered}
            </span>
          </div>

          <div className="bg-[#fafafa] rounded-[22px] p-3.5 shadow-subtle border border-[#e4e4e7]/60">
            <span className="text-[11px] text-[#696969] tracking-[-0.010em] block">Sisa Pending</span>
            <span className="text-2xl font-bold text-amber-700 tracking-tight mt-0.5 block">
              {pending}
            </span>
          </div>

          <div className="bg-[#fafafa] rounded-[22px] p-3.5 shadow-subtle border border-[#e4e4e7]/60">
            <span className="text-[11px] text-[#696969] tracking-[-0.010em] block">COD Terkumpul</span>
            <span className="text-sm sm:text-base font-bold text-[#080808] tracking-tight mt-1.5 block truncate" title={formatRupiah(codCollected)}>
              {formatRupiah(codCollected)}
            </span>
          </div>
        </div>

        {/* Route Efficiency & Anti-Backtrack Pill Strip */}
        <div className="bg-[#f4f4f5] rounded-2xl px-3.5 py-2 border border-[#e4e4e7] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[#222222] font-semibold">
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              <span>Jarak Rute: {totalDistanceKm.toFixed(1)} km</span>
            </div>
            <span className="text-[#cccccc]">•</span>
            <div className="flex items-center gap-1.5 text-[#222222] font-semibold">
              <span>⏱️ Waktu: {travelTime.displayText}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {intersections === 0 ? (
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1 border border-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Anti Bolak-Balik (0 Jalur Silang)
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-800 font-medium px-2.5 py-0.5 rounded-full text-[11px]">
                {intersections} Titik Bolak-Balik (Tekan "Urutkan Rute")
              </span>
            )}
          </div>
        </div>

        {/* Controls: Strategy Selector & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[#696969] font-medium whitespace-nowrap">Mode Susunan:</span>
            <select
              value={strategy}
              onChange={(e) => onChangeStrategy(e.target.value as RouteStrategy)}
              className="bg-[#ffffff] text-[#080808] font-semibold px-3.5 py-2 rounded-full border border-[#e4e4e7] focus:outline-none cursor-pointer w-full sm:w-auto shadow-sm"
            >
              <option value="optimal-tsp">⚡ Hemat Waktu & Anti Bolak-Balik (2-Opt TSP)</option>
              <option value="cluster-sweep">🏘️ Tersusun per Dusun / Blok (Satu Arah)</option>
              <option value="farthest-first">🏁 Titik Terjauh Mundur Pulang</option>
              <option value="nearest-first">📍 Terdekat Duluan</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOptimize}
              title="Urutkan ulang rute pengantaran agar paling hemat waktu dan tidak bolak-balik"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#ffffff] hover:bg-[#f4f4f5] active:scale-95 text-[#080808] px-4 py-2 rounded-full font-bold border border-[#e4e4e7] shadow-sm transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Urutkan Rute Sekarang</span>
            </button>

            <button
              onClick={onOpenMultiStopMap}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#292929] hover:bg-[#080808] active:scale-95 text-[#fafafa] px-4 py-2 rounded-full font-bold transition shadow-sm cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Google Maps Multi-Stop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
