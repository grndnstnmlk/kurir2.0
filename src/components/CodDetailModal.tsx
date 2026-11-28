import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  MapPin,
  Phone,
  MessageCircle,
  Package,
  Truck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { DeliveryPackage } from '../types';
import {
  getSiblingPackages,
  getSingleNavigationUrl,
  generateJntDeliveryMessage,
  calculateCodWithCourierFee,
  calculateCombinedCodTotal,
  formatRupiah,
} from '../utils/routeOptimizer';

interface CodDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPackage: DeliveryPackage | null;
  allPackages: DeliveryPackage[];
  whatsAppTemplate?: string;
  onQuickEditPhone?: (pkg: DeliveryPackage) => void;
}

function formatDeliveryDate(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
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

  if (!isOpen || !targetPackage) return null;

  const siblingPackages = getSiblingPackages(targetPackage, allPackages);
  const combinedTotal = calculateCombinedCodTotal(siblingPackages);
  const cleanRecipientName =
    (targetPackage.recipientName || '').replace(/\(.*?\)/g, '').trim() || 'Penerima';

  const cleanBenchmark =
    (targetPackage.benchmark || '')
      .replace(/^DFOD\s*Ongkir\s*—?\s*/i, '')
      .trim() || targetPackage.areaOrStreet;

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[92vh] bg-[#fafafa] text-[#18181b] rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-zinc-200 overflow-hidden flex flex-col font-aspekta"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Kurir 2.0 */}
        <div className="bg-[#09090b] text-white px-5 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                Kurir 2.0 • Info Pengantaran
              </div>
              <h2 className="text-base font-bold text-white truncate">
                {cleanRecipientName}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 transition cursor-pointer shrink-0"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ringkasan Penerima & Total */}
        <div className="px-5 pt-4 pb-3 bg-white border-b border-zinc-200 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] text-zinc-500 font-medium">
                Total Pembayaran ({siblingPackages.length} Paket)
              </div>
              <div className="text-2xl font-extrabold tracking-tight text-zinc-950 font-mono">
                {combinedTotal.totalCodAmount > 0 ? combinedTotal.formattedTotal : 'Lunas (Non-COD)'}
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
              {targetPackage.areaOrStreet}
            </span>
          </div>

          <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3 text-xs text-zinc-700 space-y-1">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
              <span className="leading-snug">{targetPackage.fullAddress}</span>
            </div>
            {cleanBenchmark && (
              <div className="text-[11px] text-zinc-500 pl-5">
                Patokan: <span className="font-semibold text-zinc-700">{cleanBenchmark}</span>
              </div>
            )}
          </div>
        </div>

        {/* Daftar Paket Milik Penerima */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {siblingPackages.map((pkg, idx) => {
            const isPaid = pkg.status === 'delivered' || !pkg.isCod || pkg.codAmount <= 0;
            const totalFeePkg = pkg.isCod && pkg.codAmount > 0
              ? calculateCodWithCourierFee(pkg.codAmount).totalAmount
              : 0;

            return (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="text-[11px] font-bold text-zinc-500">
                        Paket {idx + 1} dari {siblingPackages.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-sm font-extrabold text-zinc-950">
                        {pkg.trackingNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyResi(pkg.trackingNumber)}
                        className="p-1 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
                        title="Salin Nomor Resi"
                      >
                        {copiedResi === pkg.trackingNumber ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${
                      isPaid
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {isPaid ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{pkg.status === 'delivered' ? 'Terkirim' : 'Lunas'}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        <span>Bayar di Tempat</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Detail Harga & Tanggal */}
                <div className="bg-zinc-50 rounded-xl p-3 flex items-center justify-between gap-3 border border-zinc-100">
                  <div>
                    <div className="text-[11px] text-zinc-500">Tanggal Antaran</div>
                    <div className="text-xs font-semibold text-zinc-800">
                      {formatDeliveryDate(pkg.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-zinc-500">Total Tagihan</div>
                    <div className="text-base font-extrabold text-zinc-950 font-mono">
                      {totalFeePkg > 0 ? formatRupiah(totalFeePkg) : 'Rp 0 (Lunas)'}
                    </div>
                  </div>
                </div>

                {/* Aksi Cepat */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={getSingleNavigationUrl(pkg.lat, pkg.lng, pkg.fullAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold inline-flex items-center gap-1 transition"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Peta</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => onQuickEditPhone && onQuickEditPhone(pkg)}
                      className="px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>HP</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleWhatsApp(pkg)}
                    className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-zinc-200 px-5 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-zinc-500">
            Rincian Pengantaran Kurir 2.0
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
