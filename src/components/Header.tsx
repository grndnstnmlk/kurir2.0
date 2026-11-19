import React from 'react';
import { Package, MapPin, Navigation, Scan, DollarSign, Settings, Clock, Calendar } from 'lucide-react';

interface HeaderProps {
  activeTab: 'route' | 'map' | 'scan' | 'cod' | 'history';
  setActiveTab: (tab: 'route' | 'map' | 'scan' | 'cod' | 'history') => void;
  dropPointName: string;
  courierName: string;
  onOpenSettings: () => void;
  onOpenScan: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  dropPointName,
  courierName,
  onOpenSettings,
  onOpenScan,
}) => {
  const [time, setTime] = React.useState<string>('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/25 ring-2 ring-red-400/30">
            <Package className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-red-500 via-rose-400 to-amber-300 bg-clip-text text-transparent">
                KURIR 2.0
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/60 uppercase">
                J&T Sprinter
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span className="text-slate-200">{courierName}</span>
              <span>•</span>
              <span className="truncate max-w-[130px] sm:max-w-[200px]" title={dropPointName}>
                {dropPointName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex items-center gap-1 text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700/60">
            <Clock className="w-3.5 h-3.5 text-red-400" />
            <span>{time}</span>
          </div>

          <button
            onClick={onOpenScan}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-semibold text-xs px-3 py-2 rounded-lg shadow-md shadow-red-600/30 transition-all cursor-pointer"
          >
            <Scan className="w-4 h-4 stroke-[2.5]" />
            <span className="font-bold">+ Scan Resi</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="Pengaturan"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5 Tabs: Urutan Rute, Peta, Scan/Kelola, Rekap COD, Riwayat Harian */}
      <nav className="flex items-center justify-between px-2 py-1 bg-slate-950/70 border-t border-slate-800/80 text-xs overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('route')}
          className={`flex-1 min-w-[70px] py-2 px-1 flex flex-col sm:flex-row items-center justify-center gap-1 font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'route'
              ? 'bg-red-600/20 text-red-400 border border-red-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span className="text-[11px] sm:text-xs">Rute</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 min-w-[70px] py-2 px-1 flex flex-col sm:flex-row items-center justify-center gap-1 font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'map'
              ? 'bg-red-600/20 text-red-400 border border-red-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span className="text-[11px] sm:text-xs">Peta</span>
        </button>

        <button
          onClick={() => setActiveTab('scan')}
          className={`flex-1 min-w-[70px] py-2 px-1 flex flex-col sm:flex-row items-center justify-center gap-1 font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'scan'
              ? 'bg-red-600/20 text-red-400 border border-red-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scan className="w-4 h-4" />
          <span className="text-[11px] sm:text-xs">Kelola</span>
        </button>

        <button
          onClick={() => setActiveTab('cod')}
          className={`flex-1 min-w-[70px] py-2 px-1 flex flex-col sm:flex-row items-center justify-center gap-1 font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'cod'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span className="text-[11px] sm:text-xs">COD</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 min-w-[70px] py-2 px-1 flex flex-col sm:flex-row items-center justify-center gap-1 font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[11px] sm:text-xs">Riwayat</span>
        </button>
      </nav>
    </header>
  );
};
