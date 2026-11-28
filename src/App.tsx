import { useState, useEffect, useRef } from 'react';
import type { DeliveryPackage, CourierSettings, PackageStatus, RouteStrategy, DailyHistoryEntry, SavedHousePoint } from './types';
import {
  DEFAULT_SETTINGS,
  INITIAL_SAMPLE_PACKAGES,
  INITIAL_SAMPLE_HISTORY,
  ACTIVE_DELIVERY_LABEL,
} from './utils/sampleData';
import {
  optimizeDeliveryRoute,
  getMultiStopNavigationUrl,
  formatRupiah,
  formatCodWhatsAppInfo,
  generateJntDeliveryMessage,
} from './utils/routeOptimizer';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { IPhoneCardDeckView } from './components/IPhoneCardDeckView';
import { RouteListView } from './components/RouteListView';
import { MapView } from './components/MapView';
import { ScanModal } from './components/ScanModal';
import { CodSummaryView } from './components/CodSummaryView';
import { HistoryView } from './components/HistoryView';
import { SettingsModal } from './components/SettingsModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AdminLicenseModal } from './components/AdminLicenseModal';
import { SaveHouseModal } from './components/SaveHouseModal';
import { SavedHousesModal } from './components/SavedHousesModal';
import { SyncSessionModal } from './components/SyncSessionModal';
import { EditPackageModal } from './components/EditPackageModal';
import { QuickPhoneModal } from './components/QuickPhoneModal';
import {
  getSavedHousePoints,
  saveHousePoint,
  deleteHousePoint,
  quickRecordCurrentGpsPoint,
  fetchHousesFromSupabase,
  hydrateHousesWithCachedPhotos,
  deliverWithHousePhoto,
  findMatchingHouse,
  isSameCustomer,
} from './utils/houseManager';
import {
  getLocalLicense,
  syncLicenseWithCloud,
  type LocalLicenseInfo,
} from './utils/licenseManager';
import { requestPersistentStorage } from './utils/backupManager';
import {
  getActiveSessionId,
  setActiveSessionId,
  pushSessionToCloud,
  fetchSessionFromCloud,
  subscribeToSessionRealtime,
  subscribeToSavedHousesRealtime,
  pushHistoryEntryToCloud,
  fetchHistoryFromCloud,
  deleteHistoryFromCloud,
} from './utils/cloudSyncManager';
import { Camera } from 'lucide-react';

const STORAGE_KEY_PACKAGES = 'kurir2_packages_v1';
const STORAGE_KEY_SETTINGS = 'kurir2_settings_v1';
const STORAGE_KEY_HISTORY = 'kurir2_history_v1';

const savePackagesToLocalStorageSafely = (pkgs: DeliveryPackage[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_PACKAGES, JSON.stringify(pkgs));
  } catch {
    try {
      const compact = pkgs.map((p) =>
        p.proofPhotoUrl && p.proofPhotoUrl.startsWith('data:')
          ? { ...p, proofPhotoUrl: undefined }
          : p
      );
      localStorage.setItem(STORAGE_KEY_PACKAGES, JSON.stringify(compact));
    } catch (e) {
      console.error('Failed to save packages to localStorage', e);
    }
  }
};

const mergePackagesWithHouses = (
  prev: DeliveryPackage[],
  houses: SavedHousePoint[]
): DeliveryPackage[] => {
  let hasChange = false;
  const updated = prev.map((p) => {
    const match = findMatchingHouse(houses, p);
    if (match && isSameCustomer(match, p)) {
      const photo = match.photoUrl || p.proofPhotoUrl;
      if (p.lat !== match.lat || p.lng !== match.lng || p.proofPhotoUrl !== photo) {
        hasChange = true;
        const cleanMatchBench =
          match.benchmark && !match.benchmark.includes('Titik dikunci instan')
            ? match.benchmark
            : '';
        return {
          ...p,
          lat: match.lat,
          lng: match.lng,
          areaOrStreet: p.areaOrStreet || match.areaOrStreet,
          benchmark: p.benchmark || cleanMatchBench,
          proofPhotoUrl: photo,
        };
      }
    }
    return p;
  });
  return hasChange ? updated : prev;
};

export function App() {
  const [activeTab, setActiveTab] = useState<'deck' | 'route' | 'map' | 'scan' | 'cod' | 'history'>('deck');
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Titik Rumah Pelanggan (House Location Memory Book)
  const [savedHouses, setSavedHouses] = useState<SavedHousePoint[]>(() => getSavedHousePoints());
  const [isSaveHouseOpen, setIsSaveHouseOpen] = useState(false);
  const [selectedHouseForEdit, setSelectedHouseForEdit] = useState<Partial<SavedHousePoint> | null>(null);
  const [isHousesDirectoryOpen, setIsHousesDirectoryOpen] = useState(false);

  // Status Lisensi Pengguna
  const [license, setLicense] = useState<LocalLicenseInfo | null>(() => getLocalLicense());

  // Sesi Bersama Realtime PC & iPhone
  const [sessionId, setSessionId] = useState<string>(() => getActiveSessionId());
  const [isSyncSessionOpen, setIsSyncSessionOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<DeliveryPackage | null>(null);
  const [isEditPkgOpen, setIsEditPkgOpen] = useState(false);

  // Modal Cepat Pengisian Nomor HP Pelanggan (Buka Sensor Sprinter)
  const [phoneEditPkg, setPhoneEditPkg] = useState<DeliveryPackage | null>(null);
  const [isQuickPhoneOpen, setIsQuickPhoneOpen] = useState(false);
  const hasLoadedInitialCloudSession = useRef(false);

  useEffect(() => {
    // Kunci memori penyimpanan HP agar tidak dihapus otomatis oleh sistem Android/iOS
    requestPersistentStorage();

    // Pastikan URL selalu memuat parameter ?session= agar sinkronisasi PC & iPhone selalu terhubung
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (!params.get('session') && !params.get('s')) {
          const url = new URL(window.location.href);
          url.searchParams.set('session', sessionId);
          window.history.replaceState({}, '', url.toString());
        }
      }
    } catch (e) {
      console.warn('Failed to update URL search param:', e);
    }

    // Sinkronisasi status lisensi dengan database Supabase di background
    syncLicenseWithCloud().then((updated) => {
      if (updated) setLicense(updated);
    });
  }, [sessionId]);

  // Sinkronisasi Sesi Realtime Supabase (PC & iPhone otomatis tersambung)
  useEffect(() => {
    let latestHouses: SavedHousePoint[] = getSavedHousePoints();

    const applyHousesUpdate = (houses: SavedHousePoint[]) => {
      latestHouses = houses;
      setSavedHouses(houses);
      setPackages((prev) => mergePackagesWithHouses(prev, houses));
    };

    // 1. Ambil sesi aktif terkini dari Supabase
    fetchSessionFromCloud(sessionId).then((res) => {
      hasLoadedInitialCloudSession.current = true;
      if (res.success && res.packages && res.packages.length > 0) {
        setPackages(mergePackagesWithHouses(res.packages, latestHouses));
      }
    });

    // 2. Ambil riwayat gabungan dari Supabase
    fetchHistoryFromCloud(sessionId).then((res) => {
      if (res.success && res.history && res.history.length > 0) {
        setHistory((prev) => {
          const map = new Map<string, DailyHistoryEntry>();
          res.history!.forEach((h) => map.set(h.id, h));
          prev.forEach((h) => map.set(h.id, h));
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
          );
        });
      }
    });

    // 3. Isi foto rumah dari IndexedDB secara instan, lalu tarik update dari Supabase per batch ringan
    hydrateHousesWithCachedPhotos(latestHouses).then((hydrated) => {
      applyHousesUpdate(hydrated);
    });

    fetchHousesFromSupabase(sessionId, applyHousesUpdate).then((res) => {
      if (res.houses && res.houses.length > 0) {
        applyHousesUpdate(res.houses);
      }
    });

    // 4. Berlangganan Realtime Supabase (Paket & Pengaturan)
    const unsubscribe = subscribeToSessionRealtime(sessionId, (remotePkgs, remoteSettings) => {
      setPackages((curr) => {
        if (JSON.stringify(curr) === JSON.stringify(remotePkgs)) return curr;

        // Smart merge: jika paket lokal baru saja diselesaikan / diretur di perangkat ini,
        // jangan biarkan status remote yang tertinggal menimpanya kembali ke pending
        const merged = remotePkgs.map((rPkg) => {
          const localPkg = curr.find((l) => l.id === rPkg.id);
          if (!localPkg) return rPkg;

          if (
            (localPkg.status === 'delivered' || localPkg.status === 'returned') &&
            rPkg.status === 'pending'
          ) {
            return {
              ...rPkg,
              status: localPkg.status,
              deliveredAt: localPkg.deliveredAt,
              returnedAt: localPkg.returnedAt,
              returnReason: localPkg.returnReason,
              statusNotes: localPkg.statusNotes || rPkg.statusNotes,
              proofPhotoUrl: localPkg.proofPhotoUrl || rPkg.proofPhotoUrl,
              lat: localPkg.lat || rPkg.lat,
              lng: localPkg.lng || rPkg.lng,
              areaOrStreet: localPkg.areaOrStreet || rPkg.areaOrStreet,
              benchmark: localPkg.benchmark || rPkg.benchmark,
            };
          }

          // Pertahankan foto rumah lokal jika remote belum tersinkron
          if (localPkg.proofPhotoUrl && !rPkg.proofPhotoUrl) {
            return {
              ...rPkg,
              proofPhotoUrl: localPkg.proofPhotoUrl,
            };
          }
          return rPkg;
        });

        return merged;
      });
      if (remoteSettings) {
        setSettings((prev) => ({ ...prev, ...remoteSettings }));
      }
    });

    // 5. Berlangganan Realtime Supabase untuk Titik Rumah (saved_houses)
    const unsubHouses = subscribeToSavedHousesRealtime(sessionId, () => {
      fetchHousesFromSupabase(sessionId, applyHousesUpdate).then((res) => {
        if (res.houses) {
          applyHousesUpdate(res.houses);
        }
      });
    });

    return () => {
      unsubscribe();
      unsubHouses();
    };
  }, [sessionId]);

  // Settings: Otomatis sinkronkan ke Drop Point J&T Pamekasan (Trunojoyo)
  const [settings, setSettings] = useState<CourierSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.dropPointName &&
          !parsed.dropPointName.includes('Menteng') &&
          !parsed.dropPointName.includes('Tlanakan / Branta')
        ) {
          if (!parsed.adminWhatsAppNumber || parsed.adminWhatsAppNumber.includes('1234567890')) {
            parsed.adminWhatsAppNumber = '6281295713923';
          }
          if (
            !parsed.customWhatsAppTemplate ||
            parsed.customWhatsAppTemplate.includes('mau mengantar paket') ||
            parsed.customWhatsAppTemplate.includes('akan melakukan proses delivery')
          ) {
            parsed.customWhatsAppTemplate = DEFAULT_SETTINGS.customWhatsAppTemplate;
          }
          return parsed;
        }
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [strategy, setStrategy] = useState<RouteStrategy>(settings.defaultStrategy || 'cluster-sweep');

  // Paket: Otomatis sinkronkan ke 36 paket Branta 22 November jika masih demo lama atau data awal
  const [packages, setPackages] = useState<DeliveryPackage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PACKAGES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Jika masih sampel lama (<= 6 paket atau data dummy), perbarui ke 36 paket Branta 22 November
          if (
            parsed[0]?.fullAddress?.includes('Menteng') ||
            parsed[0]?.id?.startsWith('pkg-branta-') ||
            parsed.length <= 6
          ) {
            return optimizeDeliveryRoute(
              INITIAL_SAMPLE_PACKAGES,
              DEFAULT_SETTINGS.dropPointLat,
              DEFAULT_SETTINGS.dropPointLng,
              'cluster-sweep'
            );
          }
          return parsed;
        }
      }
      return optimizeDeliveryRoute(
        INITIAL_SAMPLE_PACKAGES,
        DEFAULT_SETTINGS.dropPointLat,
        DEFAULT_SETTINGS.dropPointLng,
        'cluster-sweep'
      );
    } catch {
      return optimizeDeliveryRoute(
        INITIAL_SAMPLE_PACKAGES,
        DEFAULT_SETTINGS.dropPointLat,
        DEFAULT_SETTINGS.dropPointLng,
        'cluster-sweep'
      );
    }
  });

  const [history, setHistory] = useState<DailyHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return INITIAL_SAMPLE_HISTORY;
    } catch {
      return INITIAL_SAMPLE_HISTORY;
    }
  });

  useEffect(() => {
    savePackagesToLocalStorageSafely(packages);
  }, [packages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history to localStorage', e);
    }
  }, [history]);

  // Otomatis push update sesi ke cloud saat ada perubahan data di PC atau iPhone
  useEffect(() => {
    // Jangan push ke cloud sebelum data sesi awal dari cloud selesai ditarik (mencegah PC menimpa data iPhone)
    if (!hasLoadedInitialCloudSession.current) return;

    const timer = setTimeout(() => {
      if (packages.length > 0) {
        pushSessionToCloud(sessionId, packages, settings);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [packages, sessionId, settings]);

  // Special Admin URL access via hash (#admin) or query (?admin=1)
  useEffect(() => {
    const checkAdminRoute = () => {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (
        hash === '#admin' ||
        search.includes('admin=true') ||
        search.includes('admin=1') ||
        search === '?admin'
      ) {
        setIsAdminOpen(true);
      }
    };

    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);
    window.addEventListener('popstate', checkAdminRoute);
    return () => {
      window.removeEventListener('hashchange', checkAdminRoute);
      window.removeEventListener('popstate', checkAdminRoute);
    };
  }, []);

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    if (window.location.hash.toLowerCase() === '#admin') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  const handleAddPackage = (newPkg: DeliveryPackage) => {
    const updated = [...packages, newPkg];
    const reordered = optimizeDeliveryRoute(
      updated,
      settings.dropPointLat,
      settings.dropPointLng,
      strategy
    );
    setPackages(reordered);
    setActiveTab('deck');
  };

  const handleUpdateStatus = (
    id: string,
    status: PackageStatus,
    notes?: string,
    returnReason?: string
  ) => {
    const now = new Date().toISOString();
    let updatedList: DeliveryPackage[] = [];
    setPackages((prev) => {
      updatedList = prev.map((pkg) => {
        if (pkg.id === id) {
          return {
            ...pkg,
            status,
            statusNotes: notes !== undefined ? notes : pkg.statusNotes,
            deliveredAt: status === 'delivered' ? now : undefined,
            returnedAt: status === 'returned' ? now : undefined,
            returnReason:
              status === 'returned'
                ? returnReason || notes || 'Permintaan Penerima (Retur Saja)'
                : pkg.returnReason,
          };
        }
        return pkg;
      });
      savePackagesToLocalStorageSafely(updatedList);
      return updatedList;
    });

    // Push seketika ke cloud database tanpa menunggu timer debounce
    pushSessionToCloud(sessionId, updatedList, settings);
  };

  const handleOpenSaveHouseForPkg = (pkg: DeliveryPackage) => {
    setSelectedHouseForEdit({
      recipientName: pkg.recipientName,
      recipientPhone: pkg.recipientPhone,
      fullAddress: pkg.fullAddress,
      areaOrStreet: pkg.areaOrStreet,
      benchmark: pkg.benchmark,
      lat: pkg.lat,
      lng: pkg.lng,
    });
    setIsSaveHouseOpen(true);
  };

  const handleHouseSaved = (house: SavedHousePoint) => {
    const updated = saveHousePoint(house, sessionId);
    setSavedHouses(updated);
  };

  const handleRefreshHousesFromCloud = async () => {
    const apply = (houses: SavedHousePoint[]) => {
      setSavedHouses(houses);
      setPackages((prev) => mergePackagesWithHouses(prev, houses));
    };
    const res = await fetchHousesFromSupabase(sessionId, apply);
    if (res.houses) {
      apply(res.houses);
    }
  };

  const handleHouseDeleted = (id: string) => {
    const updated = deleteHousePoint(id);
    setSavedHouses(updated);
  };

  /**
   * Kunci titik lokasi GPS instan saat kurir berada di depan rumah (1-Tap)
   * Mengupdate koordinat paket langsung & menyimpannya ke buku titik rumah
   */
  const handleQuickPinGps = async (
    pkg: DeliveryPackage
  ): Promise<{ success: boolean; accuracy?: number; error?: string }> => {
    try {
      const { savedHouse, updatedList } = await quickRecordCurrentGpsPoint(pkg);
      setSavedHouses(updatedList);

      // Perbarui koordinat paket saat ini agar navigasi maps langsung akurat
      setPackages((prev) => {
        const next = prev.map((p) => {
          if (p.id === pkg.id) {
            return {
              ...p,
              lat: savedHouse.lat,
              lng: savedHouse.lng,
              areaOrStreet: savedHouse.areaOrStreet || p.areaOrStreet,
              benchmark: savedHouse.benchmark || p.benchmark,
            };
          }
          return p;
        });
        savePackagesToLocalStorageSafely(next);
        return next;
      });

      return { success: true, accuracy: savedHouse.accuracyMeters };
    } catch (err: any) {
      console.error('Failed to lock GPS point:', err);
      return {
        success: false,
        error: err.message || 'Gagal mengunci GPS. Pastikan izin lokasi HP aktif.',
      };
    }
  };

  /**
   * Alur Cepat 1-Langkah: Foto Rumah -> Kunci GPS -> Paket Selesai Kirim
   */
  const handleDeliverWithPhoto = async (
    pkg: DeliveryPackage,
    photoFile: File
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { savedHouse, updatedHouses } = await deliverWithHousePhoto(pkg, photoFile, undefined, sessionId);
      setSavedHouses(updatedHouses);

      setPackages((prev) => {
        const next = prev.map((p) => {
          if (p.id === pkg.id) {
            return {
              ...p,
              status: 'delivered' as PackageStatus,
              deliveredAt: new Date().toISOString(),
              lat: savedHouse.lat,
              lng: savedHouse.lng,
              areaOrStreet: savedHouse.areaOrStreet || p.areaOrStreet,
              benchmark: savedHouse.benchmark || p.benchmark,
              proofPhotoUrl: savedHouse.photoUrl || p.proofPhotoUrl,
            };
          }
          return p;
        });
        pushSessionToCloud(sessionId, next, settings);
        savePackagesToLocalStorageSafely(next);
        return next;
      });

      return { success: true };
    } catch (err: any) {
      console.error('Failed to deliver with photo:', err);
      return { success: false, error: err?.message || 'Gagal memproses foto rumah' };
    }
  };

  /**
   * Kunci titik GPS lapangan saat kurir berdiri di lokasi manapun (tanpa terikat paket)
   */
  const handleQuickPinCurrentLocation = async (): Promise<{
    success: boolean;
    accuracy?: number;
    error?: string;
  }> => {
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const { savedHouse, updatedList } = await quickRecordCurrentGpsPoint(
        undefined,
        `Titik Lapangan (${timeStr})`
      );
      setSavedHouses(updatedList);
      return { success: true, accuracy: savedHouse.accuracyMeters };
    } catch (err: any) {
      console.error('Failed to lock current location:', err);
      return {
        success: false,
        error: err.message || 'Gagal mengunci GPS. Pastikan izin lokasi HP aktif.',
      };
    }
  };

  const handleMovePackage = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === packages.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...packages];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const finalPackages = reordered.map((pkg, idx) => ({
      ...pkg,
      orderIndex: idx + 1,
    }));
    setPackages(finalPackages);
  };

  const handleOptimizeRoute = () => {
    const reordered = optimizeDeliveryRoute(
      packages,
      settings.dropPointLat,
      settings.dropPointLng,
      strategy
    );
    setPackages(reordered);
  };

  const handleOpenMultiStopMap = () => {
    const pendingPkgs = packages.filter((p) => p.status === 'pending');
    const targetList = pendingPkgs.length > 0 ? pendingPkgs : packages;

    if (targetList.length === 0) {
      alert('Tidak ada paket untuk dinavigasi.');
      return;
    }

    const url = getMultiStopNavigationUrl(
      settings.dropPointLat,
      settings.dropPointLng,
      targetList
    );
    window.open(url, '_blank');
  };

  const handleResetData = () => {
    setPackages([]);
    localStorage.removeItem(STORAGE_KEY_PACKAGES);
    pushSessionToCloud(sessionId, [], settings);
  };

  const handleOpenEditPackage = (pkg: DeliveryPackage) => {
    setEditingPkg(pkg);
    setIsEditPkgOpen(true);
  };

  const handleOpenQuickPhone = (pkg: DeliveryPackage) => {
    setPhoneEditPkg(pkg);
    setIsQuickPhoneOpen(true);
  };

  const handleSaveQuickPhone = (
    pkgId: string,
    newPhone: string,
    action: 'whatsapp' | 'sms' | 'none' = 'none'
  ) => {
    let targetPkg: DeliveryPackage | null = null;
    setPackages((prev) => {
      const updated = prev.map((p) => {
        if (p.id === pkgId) {
          targetPkg = { ...p, recipientPhone: newPhone };
          return targetPkg;
        }
        return p;
      });
      pushSessionToCloud(sessionId, updated, settings);
      return updated;
    });

    if (targetPkg && (action === 'whatsapp' || action === 'sms')) {
      const pkg = targetPkg as DeliveryPackage;
      const text = generateJntDeliveryMessage(pkg, settings.customWhatsAppTemplate);
      let phone = newPhone.replace(/\D/g, '');

      if (action === 'whatsapp') {
        if (phone.startsWith('08')) {
          phone = '628' + phone.slice(2);
        }
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
      } else if (action === 'sms') {
        if (phone.startsWith('08')) {
          phone = '0' + phone.slice(2);
        }
        window.open(`sms:${phone}?body=${encodeURIComponent(text)}`, '_blank');
      }
    }
  };

  const handleSaveEditedPackage = (updatedPkg: DeliveryPackage) => {
    setPackages((prev) => {
      const next = prev.map((p) => (p.id === updatedPkg.id ? updatedPkg : p));
      pushSessionToCloud(sessionId, next, settings);
      return next;
    });
  };

  const handleDeleteSinglePackage = (pkgId: string) => {
    setPackages((prev) => {
      const filtered = prev.filter((p) => p.id !== pkgId);
      const reordered = filtered.map((p, idx) => ({ ...p, orderIndex: idx + 1 }));
      pushSessionToCloud(sessionId, reordered, settings);
      return reordered;
    });
  };

  const handleUpdateSessionId = (newId: string) => {
    const clean = setActiveSessionId(newId);
    setSessionId(clean);
  };

  const handleLoadSampleData = () => {
    setPackages(INITIAL_SAMPLE_PACKAGES);
    pushSessionToCloud(sessionId, INITIAL_SAMPLE_PACKAGES, settings);
    savePackagesToLocalStorageSafely(INITIAL_SAMPLE_PACKAGES);
    try {
      localStorage.removeItem('kurir2_active_card_index');
      localStorage.removeItem('kurir2_active_deck_signature');
    } catch (e) {
      console.error(e);
    }
    setActiveTab('deck');
  };

  const handleArchiveToday = (notes?: string) => {
    if (packages.length === 0) return;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const displayDate = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const codCollected = packages
      .filter((p) => p.status === 'delivered' && p.isCod)
      .reduce((sum, p) => sum + p.codAmount, 0);

    const totalCodTarget = packages
      .filter((p) => p.isCod)
      .reduce((sum, p) => sum + p.codAmount, 0);

    const deliveredCount = packages.filter((p) => p.status === 'delivered').length;
    const returnedCount = packages.filter((p) => p.status === 'returned').length;
    const failedCount = packages.filter((p) => p.status === 'failed').length;
    const rescheduledCount = packages.filter((p) => p.status === 'rescheduled').length;

    // 1. Simpan rekap riwayat pengantaran hari ini secara lengkap
    const newHistoryEntry: DailyHistoryEntry = {
      id: `history-${Date.now()}`,
      date: dateStr,
      displayDate,
      packages: [...packages],
      totalPackages: packages.length,
      deliveredCount,
      returnedCount,
      failedCount,
      rescheduledCount,
      codCollected,
      totalCodTarget,
      archivedAt: now.toISOString(),
      notes,
    };

    setHistory((prev) => [newHistoryEntry, ...prev]);
    pushHistoryEntryToCloud(sessionId, newHistoryEntry);

    // 2. Filter untuk hari esoknya:
    // Paket yang SUDAH TERKIRIM atau SUDAH DIRETUR tidak ditampilkan lagi.
    // Paket yang BELUM TERKIRIM dibiarkan tetap ada untuk percobaan pengantaran berikutnya (maksimal 3x).
    const remainingUnfinished = packages
      .filter((p) => p.status !== 'delivered' && p.status !== 'returned')
      .map((p, idx) => {
        const attempts = (p.deliveryAttempts || 1) + 1;
        return {
          ...p,
          status: 'pending' as PackageStatus,
          deliveryAttempts: attempts,
          orderIndex: idx + 1,
          statusNotes:
            attempts >= 3
              ? `Percobaan ke-${attempts}/3 (Batas terakhir: Jika tidak ada respon, paket dapat diretur)`
              : `Percobaan pengantaran ke-${attempts}/3`,
        };
      });

    setPackages(remainingUnfinished);
    pushSessionToCloud(sessionId, remainingUnfinished, settings);
    savePackagesToLocalStorageSafely(remainingUnfinished);

    setActiveTab('deck');
  };

  const handleDeleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
    deleteHistoryFromCloud(id);
  };

  const handleRestoreHistory = (entry: DailyHistoryEntry) => {
    setPackages(entry.packages);
    setActiveTab('deck');
  };

  return (
    <div className={`min-h-screen flex flex-col font-aspekta transition-colors duration-300 ${activeTab === 'deck'
      ? 'bg-[#000000] text-white selection:bg-white selection:text-black'
      : 'bg-[#fafafa] text-[#222222] selection:bg-[#292929] selection:text-[#fafafa] bg-grid-faint'
      }`}>
      {/* Three-Zone Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dropPointName={settings.dropPointName}
        courierName={settings.courierName}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenScan={() => setIsScanOpen(true)}
        license={license}
        onOpenSubscription={() => setIsSubscriptionOpen(true)}
        onOpenAdminPanel={() => setIsAdminOpen(true)}
        onOpenHousesDirectory={() => setIsHousesDirectoryOpen(true)}
        savedHousesCount={savedHouses.length}
        onOpenSyncSession={() => setIsSyncSessionOpen(true)}
      />

      {/* Stats Bar shown only on route list and map tabs */}
      {(activeTab === 'route' || activeTab === 'map') && (
        <StatsBar
          packages={packages}
          strategy={strategy}
          onOptimize={handleOptimizeRoute}
          onOpenMultiStopMap={handleOpenMultiStopMap}
          dropPointLat={settings.dropPointLat}
          dropPointLng={settings.dropPointLng}
          onChangeStrategy={(newStrategy) => {
            setStrategy(newStrategy);
            const reordered = optimizeDeliveryRoute(
              packages,
              settings.dropPointLat,
              settings.dropPointLng,
              newStrategy
            );
            setPackages(reordered);
          }}
        />
      )}

      {/* Main Tab Views */}
      <main className={`flex-1 ${activeTab === 'deck' ? 'pb-2' : 'pb-16'}`}>
        {activeTab === 'deck' && (
          <IPhoneCardDeckView
            packages={packages}
            onUpdateStatus={handleUpdateStatus}
            whatsAppTemplate={settings.customWhatsAppTemplate}
            onOpenScan={() => setIsScanOpen(true)}
            onOpenMapTab={() => setActiveTab('map')}
            dropPointLat={settings.dropPointLat}
            dropPointLng={settings.dropPointLng}
            savedHouses={savedHouses}
            onSaveHousePoint={handleOpenSaveHouseForPkg}
            onQuickPinGps={handleQuickPinGps}
            onDeliverWithPhoto={handleDeliverWithPhoto}
            onEditPackage={handleOpenEditPackage}
            onQuickEditPhone={handleOpenQuickPhone}
            onResetToToday={handleLoadSampleData}
          />
        )}

        {activeTab === 'route' && (
          <RouteListView
            packages={packages}
            onUpdateStatus={handleUpdateStatus}
            onMovePackage={handleMovePackage}
            whatsAppTemplate={settings.customWhatsAppTemplate}
            dropPointLat={settings.dropPointLat}
            dropPointLng={settings.dropPointLng}
            savedHouses={savedHouses}
            onSaveHousePoint={handleOpenSaveHouseForPkg}
            onQuickPinGps={handleQuickPinGps}
            onDeliverWithPhoto={handleDeliverWithPhoto}
            onEditPackage={handleOpenEditPackage}
            onQuickEditPhone={handleOpenQuickPhone}
          />
        )}

        {activeTab === 'map' && (
          <MapView
            packages={packages}
            settings={settings}
            savedHouses={savedHouses}
          />
        )}

        {activeTab === 'scan' && (
          <div className="p-4 max-w-lg mx-auto space-y-4">
            <div className="bg-[#fafafa] rounded-[32px] p-7 text-center space-y-3.5 shadow-subtle border border-[#e4e4e7]">
              <div className="w-14 h-14 bg-[#292929] text-[#fafafa] rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Camera className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <p className="font-fasthand text-2xl text-[#696969] leading-none mb-1">
                  tambah paket baru,
                </p>
                <h3 className="font-normal text-xl text-[#080808] tracking-[-0.025em]">
                  Area Branta - Tlanakan Pamekasan
                </h3>
                <p className="text-xs text-[#696969] mt-1 max-w-xs mx-auto">
                  Ambil foto resi paket J&T menggunakan kamera untuk otomatis membaca alamat & susun rute
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  onClick={() => setIsScanOpen(true)}
                  className="w-full py-3.5 bg-[#292929] hover:bg-[#080808] active:scale-95 text-[#fafafa] font-medium text-xs rounded-full transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4 stroke-[2]" />
                  <span>Buka Scanner Kamera Resi</span>
                </button>

                <button
                  onClick={handleLoadSampleData}
                  className="w-full py-3 bg-[#f4f4f5] hover:bg-[#e4e4e7] active:scale-95 text-[#222222] font-medium text-xs rounded-full border border-[#e4e4e7] transition cursor-pointer"
                >
                  Muat {INITIAL_SAMPLE_PACKAGES.length} Paket Hari Ini ({ACTIVE_DELIVERY_LABEL})
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cod' && (
          <CodSummaryView packages={packages} settings={settings} />
        )}

        {activeTab === 'history' && (
          <HistoryView
            history={history}
            currentPackages={packages}
            settings={settings}
            onArchiveToday={handleArchiveToday}
            onDeleteHistory={handleDeleteHistory}
            onRestoreHistory={handleRestoreHistory}
            onResetToToday={handleLoadSampleData}
          />
        )}
      </main>

      {/* Modals */}
      <ScanModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onAddPackage={handleAddPackage}
        settings={settings}
        currentCount={packages.length}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
        onResetData={handleResetData}
        onLoadSampleData={handleLoadSampleData}
        onOpenSubscription={() => setIsSubscriptionOpen(true)}
        onOpenHousesDirectory={() => setIsHousesDirectoryOpen(true)}
        onHousesRestored={() => setSavedHouses(getSavedHousePoints())}
      />

      {/* Subscription & License Gatekeeper Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
        license={license}
        onLicenseUpdated={(newLicense) => setLicense(newLicense)}
        adminWhatsAppNumber={settings.adminWhatsAppNumber}
      />

      {/* Owner / Admin License Generator Modal (Protected with Password & Dedicated Link) */}
      <AdminLicenseModal
        isOpen={isAdminOpen}
        onClose={handleCloseAdmin}
      />

      {/* Catat Titik & Foto Rumah Modal */}
      <SaveHouseModal
        isOpen={isSaveHouseOpen}
        onClose={() => {
          setIsSaveHouseOpen(false);
          setSelectedHouseForEdit(null);
        }}
        initialData={selectedHouseForEdit}
        onSaved={handleHouseSaved}
      />

      {/* Buku Katalog Titik Rumah Pelanggan */}
      <SavedHousesModal
        isOpen={isHousesDirectoryOpen}
        onClose={() => setIsHousesDirectoryOpen(false)}
        houses={savedHouses}
        onAddNew={() => {
          setSelectedHouseForEdit(null);
          setIsSaveHouseOpen(true);
        }}
        onEditHouse={(house) => {
          setSelectedHouseForEdit(house);
          setIsSaveHouseOpen(true);
        }}
        onDeleteHouse={handleHouseDeleted}
        onQuickPinCurrentLocation={handleQuickPinCurrentLocation}
        onRefreshHouses={handleRefreshHousesFromCloud}
      />

      {/* Tautkan Sesi Realtime PC & iPhone Modal */}
      <SyncSessionModal
        isOpen={isSyncSessionOpen}
        onClose={() => setIsSyncSessionOpen(false)}
        currentSessionId={sessionId}
        onUpdateSessionId={handleUpdateSessionId}
      />

      {/* Edit & Koreksi Data Paket Modal (Ketik Manual di PC) */}
      <EditPackageModal
        isOpen={isEditPkgOpen}
        onClose={() => {
          setIsEditPkgOpen(false);
          setEditingPkg(null);
        }}
        pkg={editingPkg}
        onSavePackage={handleSaveEditedPackage}
        onDeletePackage={handleDeleteSinglePackage}
        dropPointLat={settings.dropPointLat}
        dropPointLng={settings.dropPointLng}
      />

      {/* Modal Cepat Isi / Buka Sensor Nomor HP Pelanggan */}
      <QuickPhoneModal
        isOpen={isQuickPhoneOpen}
        pkg={phoneEditPkg}
        onClose={() => {
          setIsQuickPhoneOpen(false);
          setPhoneEditPkg(null);
        }}
        onSavePhone={handleSaveQuickPhone}
        whatsAppTemplate={settings.customWhatsAppTemplate}
      />
    </div>
  );
}

export default App;
