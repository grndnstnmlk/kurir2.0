import React, { useState, useEffect } from 'react';
import {
  Menu,
  Zap,
  Navigation,
  ListOrdered,
  MapPin,
  DollarSign,
  Calendar,
  Settings,
  Scan,
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
  const [time, setTime] = useState<string>('09:41');

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
    <header className="sticky top-0 z-40 bg-[#fff8f6]/95 backdrop-blur-md border-b border-[#fce5df] select-none">
      {/* Top Bar: Agence Foudre Dual 50px Circular Dots */}
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left Circular Menu Trigger (50px pink circle, #db3c8a) */}
        <button
          onClick={onOpenSettings}
          title="Pengaturan & Profil Kurir"
          className="w-[46px] h-[46px] rounded-full bg-[#db3c8a] hover:bg-[#c22e77] active:scale-95 text-white flex items-center justify-center transition shadow-none border-none cursor-pointer"
        >
          <Menu className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Center Masthead Typography */}
        <div className="text-center">
          <p className="text-[11px] font-bold tracking-widest uppercase text-[#00522d] font-clash">
            J&T EXPRESS • {time}
          </p>
          <h1 className="text-2xl font-black tracking-tight text-[#db3c8a] font-beni leading-none uppercase">
            KURIR 2.0
          </h1>
          <p className="text-[10px] text-[#00522d]/70 font-clash font-medium truncate max-w-[170px] sm:max-w-xs mx-auto">
            {courierName} — {dropPointName}
          </p>
        </div>

        {/* Right Circular Brand Mark (50px pink circle with lightning glyph) */}
        <button
          onClick={onOpenScan}
          title="+ Scan Resi Baru"
          className="w-[46px] h-[46px] rounded-full bg-[#db3c8a] hover:bg-[#c22e77] active:scale-95 text-white flex items-center justify-center transition shadow-none border-none cursor-pointer"
        >
          <Zap className="w-5 h-5 fill-white stroke-none" />
        </button>
      </div>

      {/* Editorial Pill Navigation Strip */}
      <nav className="flex items-center justify-center gap-1.5 px-3 py-2 border-t border-[#fce5df] overflow-x-auto scrollbar-none text-xs font-clash">
        <button
          onClick={() => setActiveTab('deck')}
          className={`px-4 py-1.5 rounded-full font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'deck'
              ? 'bg-[#db3c8a] text-white'
              : 'bg-[#fce5df] text-[#00522d] hover:bg-[#f29ebd]/40'
          }`}
        >
          Fokus
        </button>

        <button
          onClick={() => setActiveTab('route')}
          className={`px-4 py-1.5 rounded-full font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'route'
              ? 'bg-[#db3c8a] text-white'
              : 'bg-[#fce5df] text-[#00522d] hover:bg-[#f29ebd]/40'
          }`}
        >
          Daftar Rute
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-1.5 rounded-full font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'map'
              ? 'bg-[#db3c8a] text-white'
              : 'bg-[#fce5df] text-[#00522d] hover:bg-[#f29ebd]/40'
          }`}
        >
          Peta
        </button>

        <button
          onClick={() => setActiveTab('cod')}
          className={`px-4 py-1.5 rounded-full font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'cod'
              ? 'bg-[#db3c8a] text-white'
              : 'bg-[#fce5df] text-[#00522d] hover:bg-[#f29ebd]/40'
          }`}
        >
          Rekap COD
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-1.5 rounded-full font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-[#db3c8a] text-white'
              : 'bg-[#fce5df] text-[#00522d] hover:bg-[#f29ebd]/40'
          }`}
        >
          Riwayat
        </button>
      </nav>
    </header>
  );
};
