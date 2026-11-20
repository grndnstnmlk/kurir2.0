import { useState, useEffect } from 'react';
import type { DeliveryPackage, CourierSettings, PackageStatus, RouteStrategy, DailyHistoryEntry } from './types';
import { DEFAULT_SETTINGS, INITIAL_SAMPLE_PACKAGES, INITIAL_SAMPLE_HISTORY } from './utils/sampleData';
import { optimizeDeliveryRoute, getMultiStopNavigationUrl } from './utils/routeOptimizer';
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
import {
  getLocalLicense,
  syncLicenseWithCloud,
  type LocalLicenseInfo,
} from './utils/licenseManager';
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

  // Status Lisensi Pengguna
  const [license, setLicense] = useState<LocalLicenseInfo | null>(() => getLocalLicense());

  useEffect(() => {
    // Sinkronisasi status lisensi dengan database Supabase di background
    syncLicenseWithCloud().then((updated) => {
      if (updated) setLicense(updated);
    });
  }, []);

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

  const [strategy, setStrategy] = useState<RouteStrategy>(settings.defaultStrategy || 'optimal-tsp');

  // Paket: Otomatis sinkronkan ke sampel Branta Pamekasan jika masih demo lama
  const [packages, setPackages] = useState<DeliveryPackage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PACKAGES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Jika masih sampel Menteng lama, perbarui ke Branta
          if (parsed[0]?.fullAddress?.includes('Menteng')) {
            return optimizeDeliveryRoute(
              INITIAL_SAMPLE_PACKAGES,
              DEFAULT_SETTINGS.dropPointLat,
              DEFAULT_SETTINGS.dropPointLng,
              'optimal-tsp'
            );
          }
          return parsed;
        }
      }
      return optimizeDeliveryRoute(
        INITIAL_SAMPLE_PACKAGES,
        DEFAULT_SETTINGS.dropPointLat,
        DEFAULT_SETTINGS.dropPointLng,
        'optimal-tsp'
      );
    } catch {
      return optimizeDeliveryRoute(
        INITIAL_SAMPLE_PACKAGES,
        DEFAULT_SETTINGS.dropPointLat,
        DEFAULT_SETTINGS.dropPointLng,
        'optimal-tsp'
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
  };

  const handleLoadSampleData = () => {
    const reordered = optimizeDeliveryRoute(
      INITIAL_SAMPLE_PACKAGES,
      settings.dropPointLat,
      settings.dropPointLng,
      strategy
    );
    setPackages(reordered);
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
    setPackages([]);
    setActiveTab('history');
  };

  const handleDeleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
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
      />

      {/* Stats Bar shown on list/map/cod tabs */}
      {activeTab !== 'deck' && (
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
          />
        )}

        {activeTab === 'map' && (
          <MapView
            packages={packages}
            settings={settings}
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
                  Muat Sampel Paket Branta Pamekasan
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
        onOpenAdminPanel={() => setIsAdminOpen(true)}
      />

      {/* Subscription & License Gatekeeper Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
        license={license}
        onLicenseUpdated={(newLicense) => setLicense(newLicense)}
        adminWhatsAppNumber={settings.adminWhatsAppNumber}
      />

      {/* Owner / Admin License Generator Modal */}
      <AdminLicenseModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}

export default App;
