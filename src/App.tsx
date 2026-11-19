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
import { Camera } from 'lucide-react';

const STORAGE_KEY_PACKAGES = 'kurir2_packages_v1';
const STORAGE_KEY_SETTINGS = 'kurir2_settings_v1';
const STORAGE_KEY_HISTORY = 'kurir2_history_v1';

export function App() {
  // Default to 'deck' (Tampilan iPhone 16 Pro Max ala Refero Design)
  const [activeTab, setActiveTab] = useState<'deck' | 'route' | 'map' | 'scan' | 'cod' | 'history'>('deck');
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [settings, setSettings] = useState<CourierSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [strategy, setStrategy] = useState<RouteStrategy>(settings.defaultStrategy || 'farthest-first');

  const [packages, setPackages] = useState<DeliveryPackage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PACKAGES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_SAMPLE_PACKAGES;
    } catch {
      return INITIAL_SAMPLE_PACKAGES;
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
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-amber-400 selection:text-black">
      {/* Top Header with iOS Status Bar & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dropPointName={settings.dropPointName}
        courierName={settings.courierName}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenScan={() => setIsScanOpen(true)}
      />

      {/* Stats Bar shown on list/map/cod tabs to keep the Deck view completely clean like Refero */}
      {activeTab !== 'deck' && (
        <StatsBar
          packages={packages}
          strategy={strategy}
          onOptimize={handleOptimizeRoute}
          onOpenMultiStopMap={handleOpenMultiStopMap}
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
      <main className="flex-1 pb-16">
        {activeTab === 'deck' && (
          <IPhoneCardDeckView
            packages={packages}
            onUpdateStatus={handleUpdateStatus}
            whatsAppTemplate={settings.customWhatsAppTemplate}
            onOpenScan={() => setIsScanOpen(true)}
            onOpenMapTab={() => setActiveTab('map')}
          />
        )}

        {activeTab === 'route' && (
          <RouteListView
            packages={packages}
            onUpdateStatus={handleUpdateStatus}
            onMovePackage={handleMovePackage}
            whatsAppTemplate={settings.customWhatsAppTemplate}
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-400/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-400/30">
                <Camera className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Scan Kamera / Tambah Paket</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Ambil foto resi fisik J&T atau masukkan nomor dan alamat untuk diurutkan ke rute
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  onClick={() => setIsScanOpen(true)}
                  className="w-full py-3.5 bg-white hover:bg-zinc-200 active:scale-95 text-black font-black text-sm rounded-2xl shadow-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                  <span>Buka Scanner Kamera Resi</span>
                </button>

                <button
                  onClick={handleLoadSampleData}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 font-semibold text-xs rounded-2xl border border-zinc-700 transition cursor-pointer"
                >
                  Muat Ulang 6 Paket Contoh J&T
                </button>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
              <h4 className="font-bold text-xs text-zinc-300 uppercase tracking-wider mb-2">
                Total Paket Terdaftar: {packages.length}
              </h4>
              <p className="text-xs text-zinc-400">
                Semua data tersimpan otomatis di memori iPhone Anda (offline ready).
              </p>
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
      />
    </div>
  );
}

export default App;
