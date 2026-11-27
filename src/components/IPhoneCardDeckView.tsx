import React, { useState, useEffect } from 'react';
import {
  Navigation,
  MessageCircle,
  CheckCircle2,
  Package as PackageIcon,
  Check,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  QrCode,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Sun,
  Moon,
  Home,
  Camera,
  RefreshCw,
  AlertCircle,
  Edit3,
  Phone,
  Layers,
  CheckCheck,
  X,
  Search,
  Boxes,
} from 'lucide-react';
import type { DeliveryPackage, PackageStatus, SavedHousePoint } from '../types';
import {
  getSingleNavigationUrl,
  getStopLegInfo,
  calculateCodWithCourierFee,
  formatCodWhatsAppInfo,
  formatRupiah,
  generateJntDeliveryMessage,
  getSiblingPackages,
  calculateCombinedCodTotal,
} from '../utils/routeOptimizer';
import { findMatchingHouse, isSameCustomer } from '../utils/houseManager';
import { RecipientPackagesModal } from './RecipientPackagesModal';
import { ACTIVE_DELIVERY_DATE, ACTIVE_DELIVERY_SHORT_LABEL } from '../utils/sampleData';

interface IPhoneCardDeckViewProps {
  packages: DeliveryPackage[];
  onUpdateStatus: (id: string, status: PackageStatus, notes?: string) => void;
  whatsAppTemplate: string;
  onOpenScan: () => void;
  onOpenMapTab: () => void;
  dropPointLat?: number;
  dropPointLng?: number;
  savedHouses?: SavedHousePoint[];
  onSaveHousePoint?: (pkg: DeliveryPackage) => void;
  onQuickPinGps?: (pkg: DeliveryPackage) => Promise<{ success: boolean; accuracy?: number; error?: string }>;
  onDeliverWithPhoto?: (pkg: DeliveryPackage, file: File) => Promise<{ success: boolean; error?: string }>;
  onEditPackage?: (pkg: DeliveryPackage) => void;
  onQuickEditPhone?: (pkg: DeliveryPackage) => void;
  onResetToToday?: () => void;
}

export const IPhoneCardDeckView: React.FC<IPhoneCardDeckViewProps> = ({
  packages,
  onUpdateStatus,
  whatsAppTemplate,
  onOpenScan,
  onOpenMapTab,
  dropPointLat = -7.2107,
  dropPointLng = 113.4493,
  savedHouses = [],
  onSaveHousePoint,
  onQuickPinGps,
  onDeliverWithPhoto,
  onEditPackage,
  onQuickEditPhone,
  onResetToToday,
}) => {
  const activeDateCompact = ACTIVE_DELIVERY_DATE.replace(/-/g, '');
  const isViewingPastArchive =
    packages.length > 0 &&
    !packages.some((p) => p.id?.includes(activeDateCompact) || p.createdAt?.includes(ACTIVE_DELIVERY_DATE));
  // Kunci index kartu di localStorage agar tidak reset ke Stop #1 saat HP terkunci / buka WhatsApp / buka kamera
  const [currentIndex, setCurrentIndexState] = useState(() => {
    try {
      const saved = localStorage.getItem('kurir2_active_card_index');
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch {}
    return 0;
  });

  const setCurrentIndex = (val: number | ((prev: number) => number)) => {
    setCurrentIndexState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      try {
        localStorage.setItem('kurir2_active_card_index', String(next));
      } catch {}
      return next;
    });
  };

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default dark AMOLED matching Refero screenshot
  const [isPinningGps, setIsPinningGps] = useState(false);
  const [isDeliveringWithPhoto, setIsDeliveringWithPhoto] = useState(false);
  const [pinToast, setPinToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isBatchAreaOpen, setIsBatchAreaOpen] = useState(false);
  const [isRecipientPackagesModalOpen, setIsRecipientPackagesModalOpen] = useState(false);
  const [filterPendingOnly, setFilterPendingOnly] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'pending' | 'cod' | 'delivered' | 'returned'>('all');
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null);
  const photoTargetPkgRef = React.useRef<DeliveryPackage | null>(null);

  // Jika app baru dibuka ATAU daftar paket berganti hari/batch baru, arahkan otomatis ke paket pending pertama
  useEffect(() => {
    if (packages.length === 0) return;
    try {
      const deckSignature = `${packages.length}:${packages[0]?.id?.slice(0, 12) || packages[0]?.createdAt?.slice(0, 10) || ''}`;
      const savedSig = localStorage.getItem('kurir2_active_deck_signature');
      const savedIdx = localStorage.getItem('kurir2_active_card_index');

      if (savedSig !== deckSignature) {
        localStorage.setItem('kurir2_active_deck_signature', deckSignature);
        const firstPendingIdx = packages.findIndex(
          (p) => p.status !== 'delivered' && p.status !== 'returned'
        );
        setCurrentIndex(firstPendingIdx >= 0 ? firstPendingIdx : 0);
        return;
      }

      if (savedIdx === null) {
        const firstPendingIdx = packages.findIndex(
          (p) => p.status !== 'delivered' && p.status !== 'returned'
        );
        if (firstPendingIdx > 0) {
          setCurrentIndex(firstPendingIdx);
        }
      }
    } catch {}
  }, [packages]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchOpen]);

  const handleTriggerCamera = () => {
    if (!currentPkg) return;
    photoTargetPkgRef.current = currentPkg;
    try {
      sessionStorage.setItem('kurir2_photo_target_pkg_id', currentPkg.id);
    } catch {}
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  const handleCameraPhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    let savedTargetId: string | null = null;
    try {
      savedTargetId = sessionStorage.getItem('kurir2_photo_target_pkg_id');
    } catch {}

    const targetPkg =
      (savedTargetId ? packages.find((p) => p.id === savedTargetId) : null) ||
      photoTargetPkgRef.current ||
      currentPkg;

    // Bersihkan kunci target setelah target berhasil dikunci
    try {
      sessionStorage.removeItem('kurir2_photo_target_pkg_id');
    } catch {}
    photoTargetPkgRef.current = null;

    if (!file || !targetPkg || !onDeliverWithPhoto) return;

    setIsDeliveringWithPhoto(true);
    setPinToast(null);

    const res = await onDeliverWithPhoto(targetPkg, file);
    setIsDeliveringWithPhoto(false);

    if (res.success) {
      setPinToast({
        type: 'success',
        text: `🎉 Foto rumah tersimpan & Paket #${targetPkg.orderIndex} (${targetPkg.recipientName}) Selesai Terkirim!`,
      });

      // Hanya geser index (+1) jika user masih berada di kartu yang baru saja difoto (mencegah loncat kartu yang salah)
      setTimeout(() => {
        if (!filterPendingOnly) {
          setCurrentIndex((prev) => {
            const currentShown = packages[prev];
            if (currentShown && currentShown.id === targetPkg.id && prev < packages.length - 1) {
              return prev + 1;
            }
            return prev;
          });
        }
        setPinToast(null);
      }, 1200);
    } else {
      setPinToast({
        type: 'error',
        text: res.error || 'Gagal memproses foto rumah.',
      });
    }
  };

  const handleQuickPin = async (pkg: DeliveryPackage) => {
    if (!onQuickPinGps || isPinningGps) return;
    setIsPinningGps(true);
    setPinToast(null);

    const res = await onQuickPinGps(pkg);
    setIsPinningGps(false);

    if (res.success) {
      setPinToast({
        type: 'success',
        text: `📍 Titik Lokasi Berhasil Dikunci! (Akurasi: ±${Math.round(res.accuracy || 4)}m)`,
      });
      setTimeout(() => setPinToast(null), 4000);
    } else {
      setPinToast({
        type: 'error',
        text: res.error || 'Gagal mengunci GPS. Pastikan izin lokasi HP aktif.',
      });
      setTimeout(() => setPinToast(null), 4000);
    }
  };

  // Keyboard navigation & search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut Ctrl+K atau slash '/' untuk membuka pencarian cepat
      if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key === 'k')) && !isSearchOpen) {
        e.preventDefault();
        setIsSearchOpen(true);
        setSearchQuery('');
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      } else if (!isSearchOpen && e.key === 'ArrowRight' && currentIndex < packages.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (!isSearchOpen && e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, packages.length, isSearchOpen]);

  if (packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[520px] px-6 text-center text-neutral-200 font-aspekta bg-[#050505] rounded-3xl m-4 border border-neutral-800">
        <div className="w-20 h-20 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 text-amber-400">
          <PackageIcon className="w-10 h-10 stroke-[1.5]" />
        </div>
        <p className="font-fasthand text-2xl text-neutral-400 mb-1">semua beres,</p>
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Tidak Ada Paket Tersisa
        </h2>
        <p className="text-sm text-neutral-400 mt-2 max-w-xs mx-auto">
          Semua antaran area Branta Pamekasan telah selesai atau diarsipkan.
        </p>
        <button
          onClick={onOpenScan}
          className="mt-6 bg-white hover:bg-neutral-200 active:scale-95 text-black font-bold text-sm px-7 py-3.5 rounded-full transition shadow-lg cursor-pointer"
        >
          + Tambah Resi Baru
        </button>
      </div>
    );
  }

  const activeUnfinishedPackages = packages.filter(
    (p) => p.status !== 'delivered' && p.status !== 'returned'
  );
  const displayPackages =
    filterPendingOnly && activeUnfinishedPackages.length > 0
      ? activeUnfinishedPackages
      : packages;

  const safeIndex = Math.min(currentIndex, Math.max(0, displayPackages.length - 1));
  const currentPkg = displayPackages[safeIndex];
  const prevPkg = safeIndex > 0 ? displayPackages[safeIndex - 1] : null;
  const legInfo = getStopLegInfo(currentPkg, prevPkg, dropPointLat, dropPointLng);
  const matchingHouse = currentPkg ? findMatchingHouse(savedHouses, currentPkg) : undefined;
  const currentPhotoUrl =
    currentPkg?.proofPhotoUrl ||
    (matchingHouse?.photoUrl && isSameCustomer(matchingHouse, currentPkg)
      ? matchingHouse.photoUrl
      : undefined);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleOpenWhatsApp = (pkg: DeliveryPackage) => {
    // Jika nomor disensor oleh J&T Sprinter (mengandung bintang *) atau kurang dari 10 digit, buka modal pengisian nomor
    if (pkg.recipientPhone?.includes('*') || (pkg.recipientPhone?.length || 0) < 10) {
      if (onQuickEditPhone) {
        onQuickEditPhone(pkg);
        return;
      }
    }

    const text = generateJntDeliveryMessage(pkg, whatsAppTemplate);

    let phone = pkg.recipientPhone.replace(/\D/g, '');
    if (phone.startsWith('08')) {
      phone = '628' + phone.slice(2);
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleOpenSms = (pkg: DeliveryPackage) => {
    if (pkg.recipientPhone?.includes('*') || (pkg.recipientPhone?.length || 0) < 10) {
      if (onQuickEditPhone) {
        onQuickEditPhone(pkg);
        return;
      }
    }

    const text = generateJntDeliveryMessage(pkg, whatsAppTemplate);
    let phone = pkg.recipientPhone.replace(/\D/g, '');
    if (phone.startsWith('08')) {
      phone = '0' + phone.slice(2);
    }

    window.open(`sms:${phone}?body=${encodeURIComponent(text)}`, '_blank');
  };

  const handleMarkDelivered = (pkg: DeliveryPackage) => {
    if (pkg.status === 'delivered') {
      if (
        confirm(
          `Status paket #${pkg.orderIndex} (${pkg.recipientName}) saat ini SUDAH TERKIRIM.\n\nApakah Anda ingin membatalkannya dan mengembalikan ke status Belum Diantar?`
        )
      ) {
        onUpdateStatus(pkg.id, 'pending');
        setPinToast({
          type: 'success',
          text: `Status Paket #${pkg.orderIndex} dikembalikan ke Belum Diantar.`,
        });
        setTimeout(() => setPinToast(null), 2500);
      }
      return;
    }

    onUpdateStatus(pkg.id, 'delivered');
    setPinToast({
      type: 'success',
      text: `✅ Paket #${pkg.orderIndex} (${pkg.recipientName}) Selesai Terkirim!`,
    });

    // Otomatis geser ke antaran berikutnya secara mulus setelah 700ms (hanya jika mode fokus sisa tidak aktif)
    setTimeout(() => {
      if (!filterPendingOnly) {
        setCurrentIndex((prev) => {
          const currentShown = packages[prev];
          if (currentShown && currentShown.id === pkg.id && prev < packages.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }
      setPinToast(null);
    }, 700);
  };

  const handlePromptReturn = (pkg: DeliveryPackage) => {
    if (pkg.status === 'returned') {
      if (
        confirm(
          `Status paket #${pkg.orderIndex} (${pkg.recipientName}) saat ini SUDAH DIRETUR.\n\nApakah Anda ingin membatalkan retur dan mengembalikan ke status Belum Diantar?`
        )
      ) {
        onUpdateStatus(pkg.id, 'pending');
        setPinToast({
          type: 'success',
          text: `Status Paket #${pkg.orderIndex} dikembalikan ke Belum Diantar.`,
        });
        setTimeout(() => setPinToast(null), 2500);
      }
      return;
    }

    const defaultReason = 'Permintaan Penerima (Retur Saja)';
    const reason = prompt(
      `Penerima minta paket diretur?\nMasukkan alasan retur paket #${pkg.orderIndex} (${pkg.recipientName}):`,
      defaultReason
    );

    if (reason !== null && reason.trim().length > 0) {
      onUpdateStatus(pkg.id, 'returned', reason.trim());
      setPinToast({
        type: 'success',
        text: `📦 Paket #${pkg.orderIndex} (${pkg.recipientName}) ditandai DIRETUR ke Drop Point!`,
      });

      // Otomatis geser ke kartu paket antaran berikutnya setelah 700ms (hanya jika mode fokus sisa tidak aktif)
      setTimeout(() => {
        if (!filterPendingOnly) {
          setCurrentIndex((prev) => {
            const currentShown = packages[prev];
            if (currentShown && currentShown.id === pkg.id && prev < packages.length - 1) {
              return prev + 1;
            }
            return prev;
          });
        }
        setPinToast(null);
      }, 700);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    // Hanya geser kartu jika gerakan horizontal dominan (bukan scroll vertikal) dan minimal 70px
    if (Math.abs(diffX) >= 70 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX > 0 && safeIndex < displayPackages.length - 1) {
        setCurrentIndex(safeIndex + 1);
      } else if (diffX < 0 && safeIndex > 0) {
        setCurrentIndex(safeIndex - 1);
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  const handleSelectPackageFromSearch = (pkg: DeliveryPackage) => {
    // Jika paket sudah terkirim/diretur dan mode Fokus Sisa aktif, matikan Fokus Sisa agar kartu bisa ditampilkan
    if ((pkg.status === 'delivered' || pkg.status === 'returned') && filterPendingOnly) {
      setFilterPendingOnly(false);
    }

    const targetIdx = packages.findIndex((p) => p.id === pkg.id);
    if (targetIdx !== -1) {
      setCurrentIndex(targetIdx);
      setPinToast({
        type: 'success',
        text: `🎯 Menampilkan Stop #${pkg.orderIndex} (${pkg.recipientName})`,
      });
      setTimeout(() => setPinToast(null), 3000);
    }

    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const filteredSearchResults = packages.filter((pkg) => {
    if (searchFilter === 'pending' && pkg.status !== 'pending' && pkg.status !== 'rescheduled') {
      return false;
    }
    if (searchFilter === 'cod' && !pkg.isCod) {
      return false;
    }
    if (searchFilter === 'delivered' && pkg.status !== 'delivered') {
      return false;
    }
    if (searchFilter === 'returned' && pkg.status !== 'returned') {
      return false;
    }

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase().trim();
    const matchName = pkg.recipientName.toLowerCase().includes(q);
    const matchResi = pkg.trackingNumber.toLowerCase().includes(q);
    const matchPhone = pkg.recipientPhone ? pkg.recipientPhone.includes(q) : false;
    const matchArea = pkg.areaOrStreet.toLowerCase().includes(q);
    const matchAddress = pkg.fullAddress.toLowerCase().includes(q);
    const matchBenchmark = pkg.benchmark ? pkg.benchmark.toLowerCase().includes(q) : false;
    const matchIndex =
      `stop ${pkg.orderIndex}`.includes(q) ||
      `#${pkg.orderIndex}`.includes(q) ||
      String(pkg.orderIndex) === q;

    return matchName || matchResi || matchPhone || matchArea || matchAddress || matchBenchmark || matchIndex;
  });

  const isDelivered = currentPkg?.status === 'delivered';
  const isReturned = currentPkg?.status === 'returned';
  const isProblem = currentPkg?.status === 'rescheduled' || currentPkg?.status === 'failed';

  const areaPkgs = currentPkg
    ? displayPackages.filter(
        (p) => (p.areaOrStreet || '').trim() === (currentPkg.areaOrStreet || '').trim()
      )
    : [];
  const areaPendingCount = areaPkgs.filter((p) => p.status === 'pending').length;
  const areaDeliveredCount = areaPkgs.filter((p) => p.status === 'delivered').length;
  const areaTotalCod = areaPkgs
    .filter((p) => p.isCod)
    .reduce((sum, p) => sum + p.codAmount, 0);

  // Paket-paket milik penerima yang sama (untuk multi-paket 1 orang)
  const recipientSiblingPkgs = React.useMemo(
    () => (currentPkg ? getSiblingPackages(currentPkg, packages) : []),
    [currentPkg, packages]
  );
  const recipientCombinedCod = React.useMemo(
    () => calculateCombinedCodTotal(recipientSiblingPkgs),
    [recipientSiblingPkgs]
  );

  return (
    <div
      className={`min-h-[calc(100vh-130px)] w-full flex flex-col justify-between transition-colors duration-300 font-aspekta select-none ${
        isDarkMode ? 'bg-[#000000] text-white' : 'bg-[#fafafa] text-[#222222]'
      }`}
    >
      {/* Container calibrated for iPhone 16 Pro Max viewport (max-w-[440px]) */}
      <div className="w-full max-w-[440px] mx-auto px-5 py-3 flex flex-col justify-between flex-1 relative">
        
        {/* Subtle decorative confetti flecks (recreating Refero screenshot atmosphere) */}
        {isDarkMode && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
            <span className="absolute top-10 left-6 w-1.5 h-1.5 bg-white/40 rounded-full rotate-45" />
            <span className="absolute top-20 right-8 w-2 h-1 bg-white/30 rounded rotate-12" />
            <span className="absolute top-44 left-10 w-1.5 h-3 bg-white/20 rounded rotate-[30deg]" />
            <span className="absolute top-72 right-12 w-2 h-2 bg-white/30 rounded-full" />
            <span className="absolute bottom-28 left-8 w-2 h-1 bg-white/40 rounded -rotate-45" />
            <span className="absolute bottom-16 right-10 w-1.5 h-1.5 bg-white/30 rounded-full" />
          </div>
        )}

        {/* Warning Banner jika sedang membuka arsip masa lalu */}
        {isViewingPastArchive && (
          <div className="mb-2 p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-between gap-2 text-xs text-amber-200 shadow-lg z-20">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">⚠️</span>
              <div className="min-w-0">
                <p className="font-bold text-amber-300 truncate">Sedang Membuka Arsip Kemarin</p>
                <p className="text-[10px] text-amber-200/80 truncate">Tampil {packages.length} paket arsip.</p>
              </div>
            </div>
            {onResetToToday && (
              <button
                type="button"
                onClick={onResetToToday}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-full transition shadow-sm shrink-0 cursor-pointer text-[11px]"
              >
                Kembali ke Hari Ini ({ACTIVE_DELIVERY_SHORT_LABEL})
              </button>
            )}
          </div>
        )}

        {/* Refero Navigation Bar: "Paket Antaran" & "Done" (Selesai) */}
        <div className="flex items-center justify-between py-2 z-10 gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              title="Ganti Mode Tampilan (Dark AMOLED / Light Paper)"
              className={`p-2 rounded-full transition cursor-pointer text-xs flex items-center gap-1.5 ${
                isDarkMode
                  ? 'text-neutral-400 hover:text-white bg-neutral-900/60'
                  : 'text-neutral-600 hover:text-black bg-neutral-200/60'
              }`}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="text-[11px] font-medium hidden sm:inline">
                {isDarkMode ? 'Terang' : 'Gelap'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(true);
                setSearchQuery('');
              }}
              title="Pencarian Cepat Paket (Ketik Nama / Resi / No. HP / Dusun) [Shortcut: /]"
              className={`py-1.5 px-3 rounded-full transition cursor-pointer text-xs flex items-center gap-1.5 font-bold shadow-2xs active:scale-95 border ${
                isDarkMode
                  ? 'text-neutral-200 hover:text-white bg-neutral-900/90 border-neutral-700 hover:border-neutral-500'
                  : 'text-neutral-800 hover:text-black bg-white border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-amber-500" />
              <span>Cari</span>
            </button>
          </div>

          <div className="text-center">
            <h2 className={`text-base font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
              Paket Antaran
            </h2>
            <div className="flex items-center justify-center gap-1.5 -mt-0.5">
              <span className="text-[11px] text-neutral-400">
                Stop {safeIndex + 1} dari {displayPackages.length}
              </span>
              {packages.some((p) => p.status === 'delivered' || p.status === 'returned') && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterPendingOnly(!filterPendingOnly);
                    setCurrentIndex(0);
                  }}
                  className={`text-[9px] px-2 py-0.2 rounded-full font-bold border transition cursor-pointer ${
                    filterPendingOnly
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                  title="Fokus menampilkan paket yang belum selesai"
                >
                  {filterPendingOnly ? 'Fokus Sisa' : 'Semua Kartu'}
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleMarkDelivered(currentPkg)}
            className={`text-xs sm:text-sm font-bold transition cursor-pointer px-3 py-1.5 rounded-full border shadow-2xs flex items-center gap-1.5 active:scale-95 ${
              isDelivered
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : isReturned
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm'
            }`}
            title={
              isDelivered
                ? 'Sudah Terkirim (Klik jika ingin membatalkan)'
                : isReturned
                ? 'Sudah Diretur (Klik jika ingin membatalkan)'
                : 'Klik untuk menandai paket ini selesai terkirim'
            }
          >
            {isDelivered ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Terkirim ✓</span>
              </>
            ) : isReturned ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                <span>Diretur ↩</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Tandai Selesai</span>
              </>
            )}
          </button>
        </div>

        {/* 3. The Prominent Hero Card (Exact Refero Design with Amber Package Badge) */}
        <div
          className="my-2 relative z-10 group"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={`w-full rounded-[34px] p-6 transition-all duration-300 relative shadow-2xl overflow-hidden flex flex-col justify-between min-h-[280px] sm:min-h-[300px] ${
              isDarkMode
                ? 'bg-white text-neutral-900'
                : 'bg-white text-neutral-900 border border-neutral-200 shadow-xl'
            }`}
          >
            {/* Top Row inside Card: Tracking Number & Yellow Parcel Badge */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-500 font-semibold block">
                  J&T EXPRESS • PAMEKASAN
                </span>
                <span className="text-xs font-mono font-bold text-neutral-800 tracking-tight block mt-0.5">
                  {currentPkg.trackingNumber}
                </span>
                <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  📍 {prevPkg ? `+${legInfo.text} dari Stop #${safeIndex}` : `+${legInfo.text} dari Gudang`}
                </span>
              </div>

              {/* Actions & Parcel Badge (Top-Right) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePromptReturn(currentPkg)}
                  title="Penerima minta paket diretur ke gudang"
                  className={`p-2.5 rounded-2xl flex items-center justify-center transition cursor-pointer border active:scale-95 ${
                    isReturned
                      ? 'bg-red-600 text-white border-red-700 shadow-sm'
                      : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {onEditPackage && (
                  <button
                    onClick={() => onEditPackage(currentPkg)}
                    title="Edit Alamat & Detail Paket (Ketik di PC)"
                    className="p-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 flex items-center justify-center transition cursor-pointer border border-neutral-200 active:scale-95"
                  >
                    <Edit3 className="w-4 h-4 text-blue-600" />
                  </button>
                )}
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition cursor-pointer ${
                    isReturned
                      ? 'bg-red-600 text-white shadow-red-500/30'
                      : 'bg-[#f59e0b] text-neutral-950 shadow-amber-500/20'
                  }`}
                  title={isReturned ? 'Paket Diretur ke Drop Point' : 'Paket Siap Kirim'}
                >
                  <PackageIcon className="w-6 h-6 stroke-[2.2]" />
                </div>
              </div>
            </div>

            {/* Middle inside Card: Delivery Recipient & Destination Preview Graphic */}
            <div className="my-3 py-2 flex flex-col items-center text-center justify-center relative">
              {/* Illustrated Delivery Parcel Box Representation / Real House Photo */}
              <div className="relative mb-2">
                {currentPhotoUrl ? (
                  <div
                    onClick={() => onSaveHousePoint && onSaveHousePoint(currentPkg)}
                    className="w-24 h-24 rounded-3xl border-2 border-amber-400 flex flex-col items-center justify-center shadow-md relative overflow-hidden group cursor-pointer"
                    title="Titik rumah tersimpan! Klik untuk lihat foto & patokan"
                  >
                    <img
                      src={currentPhotoUrl}
                      alt="Foto Rumah"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute bottom-1 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>🏡 Rumah</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-neutral-100 rounded-3xl border border-neutral-200/80 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-red-600" />
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-1 text-neutral-800 border border-neutral-200">
                      <MapPin className="w-5 h-5 text-red-600 stroke-[2.2]" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-neutral-700 tracking-tighter">
                      {currentPkg.areaOrStreet.slice(0, 14)}
                    </span>
                  </div>
                )}

                {/* Status Dot */}
                <span
                  className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    isDelivered
                      ? 'bg-emerald-500'
                      : isProblem
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                  title={currentPkg.status}
                />
              </div>

              {/* Recipient Name Highlight */}
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 line-clamp-1">
                {currentPkg.recipientName}
              </h3>
              
              {/* Phone display with high-affordance Quick Edit pill */}
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onQuickEditPhone
                      ? onQuickEditPhone(currentPkg)
                      : onEditPackage && onEditPackage(currentPkg)
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition active:scale-95 cursor-pointer border ${
                    currentPkg.recipientPhone?.includes('*')
                      ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-bold'
                      : 'bg-neutral-100 text-neutral-800 border-neutral-300 hover:bg-neutral-200'
                  }`}
                  title="Klik untuk mengisi / mengedit nomor telepon pelanggan"
                >
                  <Phone className="w-3.5 h-3.5 text-neutral-700" />
                  <span>{currentPkg.recipientPhone || 'Belum ada nomor'}</span>
                  {currentPkg.recipientPhone?.includes('*') ? (
                    <span className="bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-full font-sans font-bold shadow-2xs">
                      ✏️ Isi No. HP
                    </span>
                  ) : (
                    <Edit3 className="w-3 h-3 text-neutral-400" />
                  )}
                </button>
              </div>

              {/* Tombol Rincian & Totalan Multi-Paket Penerima Ini */}
              {recipientSiblingPkgs.length > 1 && (
                <button
                  type="button"
                  onClick={() => setIsRecipientPackagesModalOpen(true)}
                  className="w-full mt-2.5 p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/10 hover:from-amber-500/25 hover:to-orange-500/20 active:scale-98 border border-amber-400/40 text-neutral-900 flex items-center justify-between text-xs transition cursor-pointer shadow-2xs"
                  title="Penerima ini memiliki beberapa paket. Ketuk untuk melihat totalan gabungan!"
                >
                  <div className="flex items-center gap-2 text-left">
                    <div className="w-7 h-7 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      <Boxes className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                        <span>{recipientSiblingPkgs.length} Paket Milik Penerima Ini</span>
                      </div>
                      <p className="text-[10px] text-neutral-500">
                        {recipientSiblingPkgs.filter((p) => p.status === 'delivered').length}/
                        {recipientSiblingPkgs.length} Terantar • Ketuk untuk Rincian
                      </p>
                    </div>
                  </div>
                  <div className="bg-neutral-950 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shrink-0 shadow-xs">
                    <span>Total: {recipientCombinedCod.formattedTotal}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                  </div>
                </button>
              )}
            </div>

            {/* Bottom inside Card: COD Tag / Non-COD Tag & Destination Area */}
            <div className="flex flex-col gap-2 pt-3 border-t border-neutral-200/70">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-500 font-medium">Area:</span>
                  <span className="text-xs font-bold text-neutral-800">
                    {currentPkg.areaOrStreet}
                  </span>
                </div>

                {currentPkg.isCod ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (recipientSiblingPkgs.length > 1) {
                        setIsRecipientPackagesModalOpen(true);
                      }
                    }}
                    className={`bg-neutral-950 text-white px-3.5 py-1 rounded-full text-xs font-bold tracking-tight shadow-sm flex items-center gap-1.5 transition ${
                      recipientSiblingPkgs.length > 1
                        ? 'cursor-pointer hover:bg-neutral-800 active:scale-95 ring-2 ring-amber-400/70 shadow-amber-500/20'
                        : ''
                    }`}
                    title={
                      recipientSiblingPkgs.length > 1
                        ? `Penerima memiliki ${recipientSiblingPkgs.length} paket. Ketuk untuk melihat totalan gabungan!`
                        : undefined
                    }
                  >
                    <span>COD: {calculateCodWithCourierFee(currentPkg.codAmount).formattedTotal}</span>
                    {recipientSiblingPkgs.length > 1 && (
                      <span className="text-[9px] bg-amber-400 text-neutral-950 px-1.5 py-0.2 rounded-full font-black">
                        {recipientSiblingPkgs.length} Pkt
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-xs font-bold tracking-tight">
                    Lunas (Non-COD)
                  </div>
                )}
              </div>

              {/* Tombol Bawa Sekaligus per Area */}
              {areaPkgs.length > 1 && (
                <button
                  type="button"
                  onClick={() => setIsBatchAreaOpen(true)}
                  className="w-full py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-98 text-amber-900 border border-amber-300 flex items-center justify-between text-xs font-bold transition cursor-pointer shadow-2xs"
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    <span>Bawa Sekaligus ({areaPkgs.length} Paket di Area Ini)</span>
                  </span>
                  <span className="text-[10px] bg-amber-200/80 px-2 py-0.5 rounded-full font-sans">
                    {areaDeliveredCount}/{areaPkgs.length} Terantar
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. Dash Pagination (Exact Refero Indicator: --- - ---) */}
        <div className="flex items-center justify-center gap-1.5 my-3 z-10">
          {packages.map((_, idx) => {
            const isActive = idx === safeIndex;
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive
                    ? isDarkMode
                      ? 'w-10 bg-white'
                      : 'w-10 bg-neutral-900'
                    : isDarkMode
                    ? 'w-3.5 bg-white/25 hover:bg-white/50'
                    : 'w-3.5 bg-neutral-300 hover:bg-neutral-500'
                }`}
                title={`Pindah ke Stop #${idx + 1}`}
              />
            );
          })}
        </div>

        {/* 5. Giant Bold Display Headline: "MODEL 001" -> "STOP #01" */}
        <div className="text-center sm:text-left my-2 z-10">
          <h1
            className={`text-4xl sm:text-5xl font-black uppercase tracking-tight leading-none ${
              isDarkMode ? 'text-white' : 'text-neutral-950'
            }`}
          >
            STOP #{String(currentPkg.orderIndex).padStart(2, '0')}
          </h1>

          {/* Subtitle: "by Atoms x Any Distance" -> "by J&T Express × Branta Pamekasan" */}
          <p
            className={`text-xs sm:text-sm font-medium tracking-wide uppercase mt-1.5 flex flex-wrap items-center gap-1.5 ${
              isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
            }`}
          >
            <span>by J&T Express × {currentPkg.areaOrStreet || 'Branta Pamekasan'}</span>
            <span className="text-emerald-500 font-mono font-semibold">({legInfo.text})</span>
          </p>

          {/* Body Paragraph: Exact paragraph placement from Refero design */}
          <p
            className={`text-xs sm:text-sm leading-relaxed max-w-md mx-auto sm:mx-0 mt-2.5 ${
              isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
            }`}
          >
            {currentPkg.fullAddress}
            {currentPkg.benchmark && (
              <span className="block mt-1 font-medium text-amber-400">
                Patokan: {currentPkg.benchmark}
              </span>
            )}
          </p>
        </div>

        {/* 6. Action Buttons: Chat WA, SMS, dan Buka Maps */}
        <div className="grid grid-cols-12 gap-2 pt-3 z-10">
          <button
            onClick={() => handleOpenWhatsApp(currentPkg)}
            className="col-span-5 bg-white hover:bg-neutral-100 active:scale-95 text-black font-bold text-xs sm:text-sm py-3.5 px-3 rounded-2xl transition shadow-xl flex items-center justify-center gap-1.5 cursor-pointer border border-neutral-200/20"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600/20 stroke-[2.2]" />
            <span>Chat WA</span>
          </button>

          <button
            onClick={() => handleOpenSms(currentPkg)}
            title="Kirim SMS jika nomor tidak terdaftar di WhatsApp"
            className="col-span-3 bg-white hover:bg-neutral-100 active:scale-95 text-black font-bold text-xs sm:text-sm py-3.5 px-2 rounded-2xl transition shadow-xl flex items-center justify-center gap-1 cursor-pointer border border-neutral-200/20"
          >
            <Phone className="w-3.5 h-3.5 text-blue-600" />
            <span>SMS</span>
          </button>

          <a
            href={getSingleNavigationUrl(currentPkg.lat, currentPkg.lng, currentPkg.fullAddress)}
            target="_blank"
            rel="noreferrer"
            className="col-span-4 bg-white hover:bg-neutral-100 active:scale-95 text-black font-bold text-xs sm:text-sm py-3.5 px-2 rounded-2xl transition shadow-xl flex items-center justify-center gap-1.5 cursor-pointer text-center border border-neutral-200/20"
          >
            <Navigation className="w-4 h-4 text-blue-600 fill-blue-600/20 stroke-[2.2]" />
            <span>Maps</span>
          </a>
        </div>

        {/* Input file kamera tersembunyi (langsung buka kamera iPhone dengan capture="environment") */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleCameraPhotoSelected}
        />

        {/* 6b. Alur Utama: Foto Rumah & Paket Selesai Kirim */}
        <div className="pt-2.5 z-10 space-y-2">
          {/* Toast Notification */}
          {pinToast && (
            <div
              className={`p-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
                pinToast.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'bg-red-500/20 text-red-300 border border-red-500/50'
              }`}
            >
              {pinToast.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{pinToast.text}</span>
            </div>
          )}

          {/* Tombol Utama: Foto Rumah & Paket Selesai Kirim */}
          <button
            type="button"
            onClick={handleTriggerCamera}
            disabled={isDeliveringWithPhoto || isPinningGps}
            className={`w-full py-4 px-4 rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2.5 cursor-pointer shadow-lg active:scale-95 border ${
              isDelivered
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-950/50'
            }`}
          >
            {isDeliveringWithPhoto ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
                <span>Menyimpan Foto & Menyelesaikan Antaran...</span>
              </>
            ) : isDelivered ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>
                  ✅ Paket #{currentPkg.orderIndex} (
                  {currentPkg.recipientName.replace(/\(.*?\)/g, '').trim().split(' ')[0]}
                  ) Terkirim (Foto Ulang)
                </span>
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 text-white" />
                <span>
                  📸 Foto Rumah #{currentPkg.orderIndex} (
                  {currentPkg.recipientName.replace(/\(.*?\)/g, '').trim().split(' ')[0]}
                  ) & Selesai Kirim
                </span>
              </>
            )}
          </button>

          {/* Tombol Retur Paket (Penerima Minta Dikembalikan / RTS) */}
          <button
            type="button"
            onClick={() => handlePromptReturn(currentPkg)}
            className={`w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 border shadow-sm ${
              isReturned
                ? 'bg-red-600 text-white border-red-700 shadow-red-950/40'
                : isDarkMode
                ? 'bg-red-950/40 hover:bg-red-900/60 text-red-300 border-red-500/40'
                : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
            }`}
            title="Klik jika penerima meminta paket diretur ke gudang"
          >
            <RotateCcw className={`w-4 h-4 ${isReturned ? 'text-white' : 'text-red-500'}`} />
            <span>
              {isReturned
                ? `↩ Paket Berstatus Retur: "${currentPkg.returnReason || 'Permintaan Penerima'}" (Batal Retur)`
                : '↩ Retur Paket (Penerima Minta Dikembalikan)'}
            </span>
          </button>

          {/* Opsi Pendukung Cepat (Kunci GPS Saja / Lihat Foto Tersimpan) */}
          <div className="flex items-center justify-between px-2 text-[11px] text-neutral-400 pt-0.5">
            {onQuickPinGps && (
              <button
                type="button"
                onClick={() => handleQuickPin(currentPkg)}
                disabled={isPinningGps || isDeliveringWithPhoto}
                className="hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
              >
                <MapPin className="w-3 h-3 text-emerald-500" />
                <span>{isPinningGps ? 'Mengunci GPS...' : matchingHouse ? 'Update GPS Saja' : 'Kunci GPS Saja'}</span>
              </button>
            )}

            {currentPhotoUrl ? (
              <button
                type="button"
                onClick={() => onSaveHousePoint && onSaveHousePoint(currentPkg)}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                <Home className="w-3.5 h-3.5" />
                <span>🏡 Lihat Foto Rumah</span>
              </button>
            ) : onSaveHousePoint ? (
              <button
                type="button"
                onClick={() => onSaveHousePoint(currentPkg)}
                className="hover:text-amber-300 flex items-center gap-1 text-neutral-400 cursor-pointer transition"
              >
                <span>+ Catat Patokan/Ciri</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* 7. Bottom Action Link: "View in AR" Position -> "Tandai Paket Terkirim" & "Retur" */}
        <div className="flex flex-wrap items-center justify-center pt-3 pb-2 z-10 gap-3">
          <button
            onClick={() => handleMarkDelivered(currentPkg)}
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold py-1.5 px-3 rounded-full transition cursor-pointer active:scale-95 ${
              isDelivered
                ? 'text-emerald-400 hover:text-emerald-300'
                : isDarkMode
                ? 'text-neutral-300 hover:text-white'
                : 'text-neutral-700 hover:text-black'
            }`}
          >
            {isDelivered ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Batal Terkirim</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Tandai Terkirim</span>
              </>
            )}
          </button>

          <span className="text-neutral-500 text-xs">•</span>

          <button
            onClick={() => handlePromptReturn(currentPkg)}
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold py-1.5 px-3 rounded-full transition cursor-pointer active:scale-95 ${
              isReturned
                ? 'text-red-400 hover:text-red-300 font-bold'
                : 'text-red-500 hover:text-red-400'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-500" />
            <span>{isReturned ? 'Batal Retur' : 'Retur Paket'}</span>
          </button>

          <span className="text-neutral-500 text-xs">•</span>

          <button
            onClick={onOpenMapTab}
            className={`text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
              isDarkMode ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <span>Peta Rute</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* 8. iOS Home Indicator Bar (Bottom Bar) */}
        <div className="pt-1 pb-1 flex justify-center">
          <div
            className={`w-32 h-1 rounded-full ${
              isDarkMode ? 'bg-white/40' : 'bg-neutral-900/30'
            }`}
          />
        </div>

      </div>

      {/* 9. Modal Bottom Sheet: Bawa Sekaligus Paket di Area Ini */}
      {isBatchAreaOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white text-[#080808] w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] border border-[#e4e4e7] p-5 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col font-aspekta animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#e4e4e7]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-[#080808]">
                    🎒 Bawa Sekaligus dari Motor
                  </span>
                  <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {areaPkgs.length} Paket
                  </span>
                </div>
                <p className="text-xs text-[#52525b] font-medium">
                  Area: <strong>{currentPkg.areaOrStreet}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsBatchAreaOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#f4f4f5] text-[#696969] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tip Banner */}
            <div className="mt-3 p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
              <span>
                💡 Ambil <strong>{areaPkgs.length} paket</strong> ini sekaligus ke tas Anda agar tidak bolak-balik ke motor.
              </span>
              {areaTotalCod > 0 && (
                <span className="font-mono font-bold bg-amber-200/70 px-2.5 py-1 rounded-lg shrink-0">
                  COD: {formatRupiah(areaTotalCod)}
                </span>
              )}
            </div>

            {/* Scrollable list of packages in this area */}
            <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 pr-1">
              {areaPkgs.map((pkg, idx) => {
                const isPkgDelivered = pkg.status === 'delivered';
                return (
                  <div
                    key={pkg.id}
                    className={`p-3.5 rounded-2xl border transition ${
                      isPkgDelivered
                        ? 'bg-[#f4f4f5] opacity-60 border-[#e4e4e7]'
                        : 'bg-white border-[#e4e4e7] shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-[#e4e4e7] text-neutral-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                            #{pkg.orderIndex}
                          </span>
                          <span className="font-bold text-xs text-[#080808] line-clamp-1">
                            {pkg.recipientName}
                          </span>
                          {pkg.isCod ? (
                            <span className="bg-neutral-900 text-white text-[10px] px-2 py-0.5 rounded-md font-bold">
                              COD {calculateCodWithCourierFee(pkg.codAmount).formattedTotal}
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-md font-medium">
                              Lunas
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-[#52525b] line-clamp-2">
                          📍 {pkg.fullAddress}
                        </p>

                        {pkg.benchmark && (
                          <p className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                            Patokan: {pkg.benchmark}
                          </p>
                        )}
                      </div>

                      {/* Status Toggle & WhatsApp */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateStatus(
                                pkg.id,
                                pkg.status === 'delivered' ? 'pending' : 'delivered'
                              )
                            }
                            className={`px-2.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95 ${
                              isPkgDelivered
                                ? 'bg-neutral-800 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isPkgDelivered ? 'Terkirim' : 'Kirim'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePromptReturn(pkg)}
                            className={`px-2 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95 border ${
                              pkg.status === 'returned'
                                ? 'bg-red-600 text-white border-red-700'
                                : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                            }`}
                            title="Retur paket ini"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retur</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenWhatsApp(pkg)}
                            className="p-1.5 rounded-full bg-[#f4f4f5] hover:bg-[#e4e4e7] text-emerald-700 transition cursor-pointer border border-[#e4e4e7]"
                            title="Chat WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="mt-4 pt-3 border-t border-[#e4e4e7] flex items-center justify-between gap-2">
              {areaPendingCount > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        `Tandai semua (${areaPendingCount}) paket di area "${currentPkg.areaOrStreet}" sebagai terkirim?`
                      )
                    ) {
                      areaPkgs.forEach((p) => {
                        if (p.status === 'pending') {
                          onUpdateStatus(p.id, 'delivered');
                        }
                      });
                      setIsBatchAreaOpen(false);
                    }
                  }}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-full transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Selesaikan Semua ({areaPendingCount} Paket)</span>
                </button>
              ) : (
                <div className="flex-1 py-2 text-center text-xs text-emerald-700 font-bold bg-emerald-50 rounded-full border border-emerald-200">
                  ✅ Semua paket di area ini telah terantar!
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsBatchAreaOpen(false)}
                className="px-4 py-2.5 bg-[#f4f4f5] hover:bg-[#e4e4e7] text-neutral-800 font-bold text-xs rounded-full transition cursor-pointer border border-[#e4e4e7]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Modal Pencarian Cepat (Quick Search Resi / Nama / HP / Dusun) */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className={`w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] border p-4 sm:p-6 shadow-2xl max-h-[88vh] flex flex-col font-aspekta animate-in slide-in-from-bottom duration-300 ${
              isDarkMode
                ? 'bg-neutral-950 text-white border-neutral-800'
                : 'bg-white text-neutral-900 border-[#e4e4e7]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik nama, no. resi, HP, dusun..."
                  className={`w-full rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm font-medium border focus:outline-none transition ${
                    isDarkMode
                      ? 'bg-neutral-900 border-neutral-700 text-white placeholder-neutral-500 focus:border-amber-400'
                      : 'bg-[#f4f4f5] border-[#e4e4e7] text-black placeholder-neutral-400 focus:border-black'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition cursor-pointer border ${
                  isDarkMode
                    ? 'bg-neutral-900 text-neutral-300 hover:text-white border-neutral-800'
                    : 'bg-[#f4f4f5] text-neutral-700 hover:text-black border-[#e4e4e7]'
                }`}
              >
                Tutup
              </button>
            </div>

            {/* Quick Filter Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setSearchFilter('all')}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition cursor-pointer ${
                  searchFilter === 'all'
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                    : isDarkMode
                    ? 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                    : 'bg-[#f4f4f5] text-neutral-600 hover:bg-[#e4e4e7]'
                }`}
              >
                Semua ({packages.length})
              </button>

              <button
                type="button"
                onClick={() => setSearchFilter('pending')}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition cursor-pointer ${
                  searchFilter === 'pending'
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                    : isDarkMode
                    ? 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                    : 'bg-[#f4f4f5] text-neutral-600 hover:bg-[#e4e4e7]'
                }`}
              >
                Belum Diantar ({packages.filter((p) => p.status === 'pending' || p.status === 'rescheduled').length})
              </button>

              <button
                type="button"
                onClick={() => setSearchFilter('cod')}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition cursor-pointer ${
                  searchFilter === 'cod'
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                    : isDarkMode
                    ? 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                    : 'bg-[#f4f4f5] text-neutral-600 hover:bg-[#e4e4e7]'
                }`}
              >
                💰 COD ({packages.filter((p) => p.isCod).length})
              </button>

              <button
                type="button"
                onClick={() => setSearchFilter('delivered')}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition cursor-pointer ${
                  searchFilter === 'delivered'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : isDarkMode
                    ? 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                    : 'bg-[#f4f4f5] text-neutral-600 hover:bg-[#e4e4e7]'
                }`}
              >
                ✓ Terkirim ({packages.filter((p) => p.status === 'delivered').length})
              </button>

              <button
                type="button"
                onClick={() => setSearchFilter('returned')}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition cursor-pointer ${
                  searchFilter === 'returned'
                    ? 'bg-red-600 text-white font-bold shadow-xs'
                    : isDarkMode
                    ? 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                    : 'bg-[#f4f4f5] text-neutral-600 hover:bg-[#e4e4e7]'
                }`}
              >
                ↩ Retur ({packages.filter((p) => p.status === 'returned').length})
              </button>
            </div>

            {/* Results Counter / Info */}
            <div className="flex items-center justify-between py-2 text-[11px] text-neutral-400 font-medium">
              <span>
                {searchQuery.trim()
                  ? `Hasil pencarian: ${filteredSearchResults.length} paket`
                  : `Menampilkan ${filteredSearchResults.length} paket (Urutan Stop 1..${packages.length})`}
              </span>
              <span className="text-[10px] text-neutral-500">
                Ketuk paket untuk melompat
              </span>
            </div>

            {/* Scrollable Results List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[55vh]">
              {filteredSearchResults.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                    <Search className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <h4 className="text-sm font-bold">Tidak ada paket yang cocok</h4>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                    Periksa kembali ejaan nama, nomor resi (JP/JX/4 angka), atau nama dusun yang dicari.
                  </p>
                </div>
              ) : (
                filteredSearchResults.map((pkg) => {
                  const isPkgDelivered = pkg.status === 'delivered';
                  const isPkgReturned = pkg.status === 'returned';

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => handleSelectPackageFromSearch(pkg)}
                      className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer group active:scale-98 ${
                        isDarkMode
                          ? isPkgDelivered
                            ? 'bg-neutral-900/50 border-neutral-800 opacity-70 hover:opacity-100 hover:border-neutral-700'
                            : isPkgReturned
                            ? 'bg-red-950/20 border-red-900/40 hover:border-red-800'
                            : 'bg-neutral-900/90 border-neutral-800 hover:border-amber-500/60 shadow-xs'
                          : isPkgDelivered
                          ? 'bg-[#f4f4f5] border-[#e4e4e7] opacity-75 hover:opacity-100'
                          : isPkgReturned
                          ? 'bg-red-50/50 border-red-200'
                          : 'bg-white border-[#e4e4e7] hover:border-neutral-400 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="space-y-1 flex-1">
                          {/* Row 1: Stop #, Name, Resi */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-[10px] font-bold flex items-center justify-center shrink-0 border border-neutral-300 dark:border-neutral-700">
                              #{pkg.orderIndex}
                            </span>
                            <span className="font-bold text-sm text-neutral-950 dark:text-white group-hover:text-amber-500 transition">
                              {pkg.recipientName}
                            </span>
                            <span className="font-mono text-[11px] text-neutral-500">
                              {pkg.trackingNumber}
                            </span>
                          </div>

                          {/* Row 2: Area & Address */}
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1">
                            📍 <strong>{pkg.areaOrStreet}</strong> • {pkg.fullAddress}
                          </p>

                          {/* Row 3: Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {pkg.isCod ? (
                              <span className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                COD {calculateCodWithCourierFee(pkg.codAmount).formattedTotal}
                              </span>
                            ) : (
                              <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-emerald-300/40">
                                Lunas
                              </span>
                            )}

                            {isPkgDelivered ? (
                              <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                                ✓ Terkirim
                              </span>
                            ) : isPkgReturned ? (
                              <span className="bg-red-500/20 text-red-600 dark:text-red-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-red-500/30">
                                ↩ Diretur
                              </span>
                            ) : (
                              <span className="bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[10px] px-2 py-0.5 rounded-full font-medium">
                                Belum Diantar
                              </span>
                            )}

                            {(pkg.deliveryAttempts || 1) > 1 && (
                              <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                Percobaan {pkg.deliveryAttempts}/3
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons on card */}
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0 self-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPackageFromSearch(pkg);
                            }}
                            className="py-1.5 px-3 rounded-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-neutral-950 font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1"
                          >
                            <span>Buka</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenWhatsApp(pkg);
                            }}
                            className="p-1.5 rounded-full bg-[#f4f4f5] dark:bg-neutral-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-emerald-600 dark:text-emerald-400 transition cursor-pointer border border-neutral-300 dark:border-neutral-700"
                            title="Chat WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Totalan & Rincian Multi-Paket Milik 1 Orang */}
      <RecipientPackagesModal
        isOpen={isRecipientPackagesModalOpen}
        onClose={() => setIsRecipientPackagesModalOpen(false)}
        targetPackage={currentPkg}
        allPackages={packages}
        onUpdateStatus={onUpdateStatus}
        onSelectPackage={(pkg) => {
          const idx = packages.findIndex((p) => p.id === pkg.id);
          if (idx !== -1) {
            setCurrentIndex(idx);
          }
        }}
        onEditPackage={onEditPackage}
        onQuickEditPhone={onQuickEditPhone}
      />

    </div>
  );
};
