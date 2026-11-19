import React, { useState, useEffect } from 'react';
import {
  Package,
  MapPin,
  ListOrdered,
  Scan,
  DollarSign,
  Settings,
  Calendar,
  Layers,
  Wifi,
  Battery,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'deck' | 'route' | 'map' | 'scan' | 'cod' | 'history';
  setActiveTab: (tab: 'deck' | 'route' | 'map' | 'scan' | 'cod' | 'history') => void;
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
  const [time, setTime] = useState<string>('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-zinc-900 select-none">
      {/* iPhone 16 Pro Max Status Bar: 9:41, Dynamic Island, Signal, WiFi, Battery */}
      <div className="px-6 pt-3 pb-1 flex items-center justify-between text-xs text-white font-semibold">
        <span className="font-semibold text-[13px] tracking-tight">{time}</span>

        {/* Dynamic Island Pill */}
        <div className="w-28 h-6 bg-black rounded-full border border-zinc-800/80 flex items-center justify-center shadow-inner">
          <div className="flex items-center gap-1.5 px-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="text-[10px] font-mono text-zinc-300 font-bold uppercase tracking-wider">
              J&T 2.0
            </span>
          </div>
        </div>

        {/* Right Status Icons */}
        <div className="flex items-center gap-1.5 text-zinc-200">
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-0.5 h-1.5 bg-white rounded-full"></span>
            <span className="w-0.5 h-2 bg-white rounded-full"></span>
            <span className="w-0.5 h-2.5 bg-white rounded-full"></span>
            <span className="w-0.5 h-3 bg-white rounded-full"></span>
          </div>
          <Wifi className="w-3.5 h-3.5" />
          <Battery className="w-4 h-4 text-white fill-white" />
        </div>
      </div>

      {/* Refero Top Action Bar: Title & High-Contrast "Done" / "+ Scan" Action */}
      <div className="px-5 py-2.5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
            <span>Kurir 2.0</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-800 text-amber-400 border border-zinc-700">
              iPhone 16 Pro Max
            </span>
          </h2>
          <p className="text-[11px] text-zinc-400 font-medium truncate max-w-[200px]">
            {courierName} • {dropPointName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScan}
            className="bg-white hover:bg-zinc-200 active:scale-95 text-black font-black text-xs px-3.5 py-1.5 rounded-full shadow-lg transition cursor-pointer"
          >
            + Scan
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 active:scale-95 transition cursor-pointer"
            title="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Segmented Tab Bar for iPhone */}
      <nav className="flex items-center justify-between px-3 py-1 bg-black border-t border-zinc-900/90 text-xs overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('deck')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 flex items-center justify-center gap-1.5 font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'deck'
              ? 'bg-white text-black shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="text-xs">Fokus</span>
        </button>

        <button
          onClick={() => setActiveTab('route')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 flex items-center justify-center gap-1.5 font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'route'
              ? 'bg-white text-black shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span className="text-xs">Daftar</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 flex items-center justify-center gap-1.5 font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'map'
              ? 'bg-white text-black shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-xs">Peta</span>
        </button>

        <button
          onClick={() => setActiveTab('cod')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 flex items-center justify-center gap-1.5 font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'cod'
              ? 'bg-amber-400 text-black shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span className="text-xs">COD</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 flex items-center justify-center gap-1.5 font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'history'
              ? 'bg-white text-black shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-xs">Riwayat</span>
        </button>
      </nav>
    </header>
  );
};
