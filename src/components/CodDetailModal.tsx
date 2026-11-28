import React, { useState } from 'react';
import {
  ChevronLeft,
  Search,
  Copy,
  Check,
  MapPin,
  Phone,
  FileText,
  MessageCircle,
  X,
  ScanLine,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import type { DeliveryPackage } from '../types';
import {
  getSiblingPackages,
  getSingleNavigationUrl,
  generateJntDeliveryMessage,
} from '../utils/routeOptimizer';

interface CodDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPackage: DeliveryPackage | null;
  allPackages: DeliveryPackage[];
  whatsAppTemplate?: string;
  onQuickEditPhone?: (pkg: DeliveryPackage) => void;
}

function formatCommaNumber(val: number): string {
  return new Intl.NumberFormat('en-US').format(Math.max(0, Math.round(val)));
}

function formatDeliveryTimestamp(iso?: string): string {
  if (!iso) return '2026-11-28 09:00:00';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export const CodDetailModal: React.FC<CodDetailModalProps> = ({
  isOpen,
  onClose,
  targetPackage,
  allPackages,
  whatsAppTemplate,
  onQuickEditPhone,
}) => {
  const [copiedResi, setCopiedResi] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  if (!isOpen || !targetPackage) return null;

  const siblingPackages = getSiblingPackages(targetPackage, allPackages);
  const cleanRecipientName =
    (targetPackage.recipientName || '').replace(/\(.*?\)/g, '').trim() || 'Penerima';

  const cleanBenchmark =
    (targetPackage.benchmark || '')
      .replace(/^DFOD\s*Ongkir\s*—?\s*/i, '')
      .trim() || targetPackage.areaOrStreet;

  const grandTotalBase = siblingPackages.reduce(
    (sum, p) => sum + (p.isCod ? p.codAmount || 0 : 0),
    0
  );

  const handleCopyResi = (resi: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(resi);
      setCopiedResi(resi);
      setTimeout(() => setCopiedResi(null), 1800);
    }
  };

  const handleWhatsApp = (pkg: DeliveryPackage) => {
    if (!pkg.recipientPhone || pkg.recipientPhone.includes('*') || pkg.recipientPhone.length < 10) {
      if (onQuickEditPhone) {
        onQuickEditPhone(pkg);
        return;
      }
    }
    const text = generateJntDeliveryMessage(pkg, whatsAppTemplate);
    let phone = (pkg.recipientPhone || '').replace(/\D/g, '');
    if (phone.startsWith('08')) {
      phone = '628' + phone.slice(2);
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const toggleSelectAll = () => {
    const allChecked = siblingPackages.every((p) => selectedIds[p.id]);
    const next: Record<string, boolean> = {};
    siblingPackages.forEach((p) => {
      next[p.id] = !allChecked;
    });
    setSelectedIds(next);
  };

  const allSelected =
    siblingPackages.length > 0 && siblingPackages.every((p) => selectedIds[p.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md h-full sm:h-auto sm:max-h-[92vh] bg-[#f5f6f8] text-[#1f2937] sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Navigation Bar */}
        <div className="bg-white px-3 py-2.5 flex items-center gap-2 border-b border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-800 transition cursor-pointer"
            aria-label="Kembali"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 bg-[#f3f4f6] rounded-full px-3 py-1.5 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate font-medium text-gray-600">
                {targetPackage.trackingNumber}
              </span>
            </div>
            <ScanLine className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-700 transition cursor-pointer"
            aria-label="Tutup"
          >
            <AlertCircle className="w-4 h-4 hidden sm:block" />
            <X className="w-5 h-5 sm:hidden" />
          </button>
        </div>

        {/* Recipient Banner */}
        <div className="bg-gradient-to-b from-[#fcecec] via-[#fdf5f5] to-[#f5f6f8] px-4 pt-3 pb-2.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white border-2 border-red-200 shadow-xs flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-red-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-bold text-gray-900 leading-tight truncate">
                {cleanRecipientName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5 flex-wrap">
                <span>
                  Total <strong className="text-red-600">{siblingPackages.length}</strong> item
                </span>
                {cleanBenchmark && (
                  <span className="text-gray-400 uppercase tracking-wide text-[11px] truncate max-w-[210px]">
                    • {cleanBenchmark}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Alamat Lengkap Penerima */}
          <div className="mt-2 bg-white/85 border border-red-100/80 rounded-xl px-3 py-2 text-[11px] text-gray-700 leading-snug">
            <span className="font-semibold text-gray-900">Alamat: </span>
            {targetPackage.fullAddress}
          </div>
        </div>

        {/* Package Cards Scrollable List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
          {siblingPackages.map((pkg) => {
            const resi = pkg.trackingNumber || '';
            const prefix = resi.length > 4 ? resi.slice(0, -4) : '';
            const last4 = resi.length > 4 ? resi.slice(-4) : resi;

            const isDfod =
              resi.startsWith('JD') || /dfod/i.test(pkg.benchmark || '');
            const isPaid = pkg.status === 'delivered' || !pkg.isCod;
            const codVal = pkg.isCod && !isDfod ? pkg.codAmount || 0 : 0;
            const dfodVal = pkg.isCod && isDfod ? pkg.codAmount || 0 : 0;
            const totalVal = codVal + dfodVal;
            const payMethod = !pkg.isCod || isDfod ? 'CC_CASH' : 'PP_PM';
            const isChecked = Boolean(selectedIds[pkg.id]);

            return (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl p-3.5 shadow-xs border border-gray-200/80 space-y-2.5"
              >
                {/* Row 1: Waybill & Select Circle */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-extrabold tracking-tight text-gray-900 font-mono">
                        {prefix}
                        <span className="text-red-600">{last4}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyResi(resi)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition cursor-pointer"
                        title="Salin Nomor Resi"
                      >
                        {copiedResi === resi ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Row 2: EZ + COD/DFOD/Non-COD Badges */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        EZ
                      </span>
                      {pkg.isCod ? (
                        <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                          {isDfod ? 'DFOD' : 'COD'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          NON-COD
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedIds((prev) => ({ ...prev, [pkg.id]: !prev[pkg.id] }))
                    }
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 transition cursor-pointer ${
                      isChecked
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                    aria-label="Pilih paket"
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                </div>

                {/* Note Pill */}
                <div className="inline-block bg-[#eef2f6] text-[#475569] text-[11px] font-medium px-2.5 py-1 rounded-md max-w-full truncate">
                  {pkg.benchmark ? pkg.benchmark : `+ ${pkg.areaOrStreet}`}
                </div>

                {/* 2-Column Info Grid */}
                <div className="bg-[#f8f9fb] rounded-xl p-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                  <div>
                    <div className="text-[11px] text-gray-400">Metode Pembayaran</div>
                    <div className="font-semibold text-gray-900 mt-0.5">{payMethod}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400">COD</div>
                    <div className="font-semibold text-gray-900 mt-0.5">
                      {formatCommaNumber(codVal)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-gray-400">Waktu Delivery</div>
                    <div className="font-semibold text-gray-900 mt-0.5 text-[11px]">
                      {formatDeliveryTimestamp(pkg.createdAt)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400">Biaya DFOD</div>
                    <div className="font-semibold text-gray-900 mt-0.5">
                      {formatCommaNumber(dfodVal)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-gray-400">Status Pembayaran</div>
                    <div
                      className={`font-semibold mt-0.5 ${
                        isPaid ? 'text-emerald-600' : 'text-amber-500'
                      }`}
                    >
                      {isPaid ? 'Sudah Bayar' : 'Belum Bayar'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400">Total</div>
                    <div className="font-bold text-red-600 text-sm mt-0.5">
                      {formatCommaNumber(totalVal)}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  <div className="flex items-center divide-x divide-gray-200 flex-1">
                    <a
                      href={getSingleNavigationUrl(pkg.lat, pkg.lng, pkg.fullAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center py-1 text-gray-500 hover:text-gray-800 transition"
                      title="Buka Google Maps"
                    >
                      <MapPin className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => onQuickEditPhone && onQuickEditPhone(pkg)}
                      className="flex-1 flex items-center justify-center py-1 text-gray-500 hover:text-gray-800 transition cursor-pointer"
                      title="No. HP Penerima"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyResi(resi)}
                      className="flex-1 flex items-center justify-center py-1 text-gray-500 hover:text-gray-800 transition cursor-pointer"
                      title="Salin Resi"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleWhatsApp(pkg)}
                    className="bg-[#22c55e] hover:bg-[#16a34a] active:scale-95 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Footer Bar */}
        <div className="bg-white border-t border-gray-200 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer"
          >
            <span
              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                allSelected ? 'bg-red-600 border-red-600 text-white' : 'border-gray-300'
              }`}
            >
              {allSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </span>
            <span>Pilih Semua</span>
          </button>

          <div className="flex items-center gap-2.5">
            {siblingPackages.length > 1 && (
              <div className="text-right">
                <div className="text-[10px] text-gray-400 leading-none">Total Gabungan</div>
                <div className="text-sm font-extrabold text-red-600">
                  Rp {formatCommaNumber(grandTotalBase)}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
