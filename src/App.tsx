import { useState, useEffect } from 'react';
import type { DeliveryPackage, CourierSettings, PackageStatus, RouteStrategy, DailyHistoryEntry, SavedHousePoint } from './types';
import { DEFAULT_SETTINGS, INITIAL_SAMPLE_PACKAGES, INITIAL_SAMPLE_HISTORY } from './utils/sampleData';
import { optimizeDeliveryRoute, getMultiStopNavigationUrl, formatRupiah, formatCodWhatsAppInfo } from './utils/routeOptimizer';
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
  pushHistoryEntryToCloud,
  fetchHistoryFromCloud,
  deleteHistoryFromCloud,
} from './utils/cloudSyncManager';
import { Camera } from 'lucide-react';

const STORAGE_KEY_PACKAGES = 'kurir2_packages_v1';
const STORAGE_KEY_SETTINGS = 'kurir2_settings_v1';
const STORAGE_KEY_HISTORY = 'kurir2_history_v1';

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

  useEffect(() => {
    // Kunci memori penyimpanan HP agar tidak dihapus otomatis oleh sistem Android/iOS
    requestPersistentStorage();

    // Sinkronisasi status lisensi dengan database Supabase di background
    syncLicenseWithCloud().then((updated) => {
      if (updated) setLicense(updated);
    });
  }, []);

  // Sinkronisasi Sesi Realtime Supabase (PC & iPhone otomatis tersambung)
  useEffect(() => {
    // 1. Ambil sesi aktif terkini dari Supabase
    fetchSessionFromCloud(sessionId).then((res) => {
      if (res.success && res.packages && res.packages.length > 0) {
        setPackages(res.packages);
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

    // 3. Berlangganan Realtime Supabase
    const unsubscribe = subscribeToSessionRealtime(sessionId, (remotePkgs, remoteSettings) => {
      setPackages((curr) => {
        if (JSON.stringify(curr) === JSON.stringify(remotePkgs)) return curr;
        return remotePkgs;
      });
      if (remoteSettings) {
        setSettings((prev) => ({ ...prev, ...remoteSettings }));
      }
    });

    return () => {
      unsubscribe();
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
    try {
      localStorage.setItem(STORAGE_KEY_PACKAGES, JSON.stringify(packages));
    } catch (e) {
      console.error('Failed to save packages to localStorage', e);
    }
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

  const handleUpdateStatus = (id: string, status: PackageStatus, notes?: string) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id === id) {
          return {
            ...pkg,
            status,
            statusNotes: notes !== undefined ? notes : pkg.statusNotes,
            deliveredAt: status === 'delivered' ? new Date().toISOString() : undefined,
          };
        }
        return pkg;
      })
    );
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
    const updated = saveHousePoint(house);
    setSavedHouses(updated);
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
        try {
          localStorage.setItem(STORAGE_KEY_PACKAGES, JSON.stringify(next));
        } catch (e) {
          console.error('Failed to persist package GPS update:', e);
        }
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

  const handleSaveQuickPhone = (pkgId: string, newPhone: string, autoOpenWhatsApp: boolean = false) => {
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

    if (autoOpenWhatsApp && targetPkg) {
      const pkg = targetPkg as DeliveryPackage;
      const codInfo = formatCodWhatsAppInfo(pkg.isCod, pkg.codAmount);

      let text = settings.customWhatsAppTemplate
        .replace(/{NAMA}/g, pkg.recipientName || 'Kak')
        .replace(/{RESI}/g, pkg.trackingNumber)
        .replace(/{INFO_COD}/g, codInfo)
        .replace(/{ALAMAT}/g, pkg.fullAddress);

      let phone = newPhone.replace(/\D/g, '');
      if (phone.startsWith('08')) {
        phone = '628' + phone.slice(2);
      }
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
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
    const reordered = optimizeDeliveryRoute(
      INITIAL_SAMPLE_PACKAGES,
      settings.dropPointLat,
      settings.dropPointLng,
      strategy
    );
    setPackages(reordered);
    pushSessionToCloud(sessionId, reordered, settings);
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

    const newHistoryEntry: DailyHistoryEntry = {
      id: `history-${Date.now()}`,
      date: dateStr,
      displayDate,
      packages: [...packages],
      totalPackages: packages.length,
      deliveredCount: packages.filter((p) => p.status === 'delivered').length,
      failedCount: packages.filter((p) => p.status === 'failed').length,
      rescheduledCount: packages.filter((p) => p.status === 'rescheduled').length,
      codCollected,
      totalCodTarget,
      archivedAt: now.toISOString(),
      notes,
    };

    setHistory((prev) => [newHistoryEntry, ...prev]);
    pushHistoryEntryToCloud(sessionId, newHistoryEntry);
    setPackages([]);
    pushSessionToCloud(sessionId, [], settings);
    setActiveTab('history');
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
    <div className={`min-h-screen flex flex-col font-aspekta transition-colors duration-300 ${
      activeTab === 'deck'
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
            onEditPackage={handleOpenEditPackage}
            onQuickEditPhone={handleOpenQuickPhone}
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
                  Muat 36 Paket Hari Ini (22 November 2026)
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
