import React from 'react';
import {
  X,
  Boxes,
  CheckCircle2,
  Package,
  ExternalLink,
  MessageCircle,
  Phone,
  Edit3,
  RotateCcw,
  CheckCheck,
} from 'lucide-react';
import type { DeliveryPackage, PackageStatus } from '../types';
import {
  getSiblingPackages,
  calculateCombinedCodTotal,
  calculateCodWithCourierFee,
  generateMultiPackageJntMessage,
} from '../utils/routeOptimizer';

interface RecipientPackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPackage: DeliveryPackage | null;
  allPackages: DeliveryPackage[];
  onUpdateStatus: (id: string, status: PackageStatus, notes?: string) => void;
  onSelectPackage?: (pkg: DeliveryPackage) => void;
  onEditPackage?: (pkg: DeliveryPackage) => void;
  onQuickEditPhone?: (pkg: DeliveryPackage) => void;
}

export const RecipientPackagesModal: React.FC<RecipientPackagesModalProps> = ({
  isOpen,
  onClose,
  targetPackage,
  allPackages,
  onUpdateStatus,
  onSelectPackage,
  onEditPackage,
  onQuickEditPhone,
}) => {
  if (!isOpen || !targetPackage) return null;

  const siblingPackages = getSiblingPackages(targetPackage, allPackages);
  const combinedCod = calculateCombinedCodTotal(siblingPackages);

  const cleanRecipientName = (targetPackage.recipientName || '')
    .replace(/\(.*?\)/g, '')
    .trim() || 'Penerima';

  const deliveredCount = siblingPackages.filter((p) => p.status === 'delivered').length;
  const returnedCount = siblingPackages.filter((p) => p.status === 'returned').length;
  const pendingCount = siblingPackages.filter(
    (p) => p.status !== 'delivered' && p.status !== 'returned'
  ).length;

  const isAllDelivered = siblingPackages.length > 0 && deliveredCount === siblingPackages.length;

  const handleMarkAllDelivered = () => {
    siblingPackages.forEach((pkg) => {
      if (pkg.status !== 'delivered') {
        onUpdateStatus(pkg.id, 'delivered');
      }
    });
  };

  const handleOpenWhatsAppAll = () => {
    const text = generateMultiPackageJntMessage(siblingPackages);
    const validPhonePkg = siblingPackages.find(
      (p) => p.recipientPhone && !p.recipientPhone.includes('*') && p.recipientPhone.length >= 10
    ) || targetPackage;

    if (validPhonePkg.recipientPhone?.includes('*') || (validPhonePkg.recipientPhone?.length || 0) < 10) {
      if (onQuickEditPhone) {
        onQuickEditPhone(validPhonePkg);
        return;
      }
    }

    let phone = (validPhonePkg.recipientPhone || '').replace(/\D/g, '');
    if (phone.startsWith('08')) {
      phone = '628' + phone.slice(2);
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-start justify-between gap-3 bg-neutral-50/70 dark:bg-neutral-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-neutral-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-neutral-950 dark:text-white line-clamp-1">
                  {cleanRecipientName}
                </h3>
                <span className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300/40">
                  {siblingPackages.length} Paket
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                📍 {targetPackage.fullAddress}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Hero Card Total Tagihan Gabungan */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white shadow-lg border border-neutral-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5" />
                <span>Total Tagihan Gabungan ({siblingPackages.length} Paket)</span>
              </span>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                  isAllDelivered
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {deliveredCount}/{siblingPackages.length} Terantar
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-white my-1">
              {combinedCod.formattedTotal}
            </div>

            <p className="text-xs text-neutral-400 mt-2">
              {combinedCod.codPackagesCount > 0 ? (
                <>
                  Penerima membayar total <strong>{combinedCod.formattedTotal}</strong> untuk{' '}
                  <strong>{combinedCod.codPackagesCount} paket COD</strong>
                  {combinedCod.nonCodPackagesCount > 0 &&
                    ` + ${combinedCod.nonCodPackagesCount} paket Non-COD (Lunas)`}
                  .
                </>
              ) : (
                <>Semua {siblingPackages.length} paket sudah lunas (Non-COD).</>
              )}
            </p>
          </div>

          {/* List of Sibling Packages */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-500 dark:text-neutral-400 px-1">
              <span>Rincian Setiap Paket ({siblingPackages.length})</span>
              <span>Nominal COD</span>
            </div>

            {siblingPackages.map((pkg) => {
              const isPkgDelivered = pkg.status === 'delivered';
              const isPkgReturned = pkg.status === 'returned';

              return (
                <div
                  key={pkg.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isPkgDelivered
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                      : isPkgReturned
                      ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                      : 'bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 shadow-2xs hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        #{pkg.orderIndex}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                            {pkg.trackingNumber}
                          </span>
                          {pkg.recipientName.includes('(') && (
                            <span className="text-[10px] bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-1.5 py-0.2 rounded font-medium">
                              {pkg.recipientName.slice(pkg.recipientName.indexOf('('))}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                          {pkg.benchmark || pkg.fullAddress}
                        </p>
                      </div>
                    </div>

                    {/* Price Badge */}
                    <div className="text-right shrink-0">
                      {pkg.isCod && pkg.codAmount > 0 ? (
                        <div className="bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold px-2.5 py-1 rounded-full shadow-2xs">
                          {calculateCodWithCourierFee(pkg.codAmount).formattedTotal}
                        </div>
                      ) : (
                        <div className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-300/40">
                          Lunas
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons per package */}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-700/60 text-xs">
                    <div className="flex items-center gap-1.5">
                      {onSelectPackage && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectPackage(pkg);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Buka Kartu</span>
                        </button>
                      )}

                      {onEditPackage && (
                        <button
                          type="button"
                          onClick={() => onEditPackage(pkg)}
                          className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 transition cursor-pointer"
                          title="Edit nominal COD atau data paket ini"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStatus(pkg.id, isPkgDelivered ? 'pending' : 'delivered')
                      }
                      className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 text-xs ${
                        isPkgDelivered
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isPkgDelivered ? 'Terkirim' : 'Kirim'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/90 space-y-2">
          {!isAllDelivered ? (
            <button
              type="button"
              onClick={handleMarkAllDelivered}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
            >
              <CheckCheck className="w-5 h-5" />
              <span>Selesaikan Semua ({siblingPackages.length} Paket Sekaligus)</span>
            </button>
          ) : (
            <div className="py-2.5 px-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs text-center border border-emerald-300/40 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Semua {siblingPackages.length} paket milik penerima ini sudah selesai terantar!</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenWhatsAppAll}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-emerald-700 dark:text-emerald-400 font-bold text-xs border border-neutral-200 dark:border-neutral-700 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Kirim WA Rangkuman Semua Paket</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-2xl bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
