import React, { useState, useEffect } from 'react';
import {
  Plus,
  Settings,
  Layers,
  ListOrdered,
  MapPin,
  DollarSign,
  Calendar,
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
    <header className="sticky top-0 z-40 bg-[#fafafa]/95 backdrop-blur-md border-b border-[#e4e4e7] select-none font-aspekta">
      {/* Three-Zone Navigation Bar */}
      <div className="max-w-4xl mx-auto px-5 py-3 flex items-center justify-between">
        {/* Left: Brand Wordmark + Handwritten Voice */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-[-0.02em] text-[#080808]">
            KURIR 2.0
          </span>
          <span className="font-fasthand text-xl text-[#696969] leading-none select-none">
            harian
          </span>
        </div>

        {/* Center: Standalone 'K.' Glyph with Period */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#696969]">
          <span className="font-bold text-base text-[#080808]">K.</span>
          <span>•</span>
          <span className="truncate max-w-[180px] text-[#696969] font-medium" title={dropPointName}>
            {dropPointName}
          </span>
        </div>

        {/* Right: Dark Pill Button & Settings Icon */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenScan}
            className="flex items-center gap-1.5 bg-[#292929] hover:bg-[#080808] active:scale-95 text-[#fafafa] font-medium text-xs py-2 px-4 rounded-full transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Scan Resi</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="Pengaturan"
            className="p-2 rounded-full text-[#696969] hover:text-[#080808] hover:bg-[#f4f4f5] transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pill Tabs Strip: 999px fully rounded pills on Cream / Mid Ink */}
      <nav className="flex items-center justify-center gap-1.5 px-3 py-2 border-t border-[#e4e4e7]/70 overflow-x-auto scrollbar-none text-xs">
        <button
          onClick={() => setActiveTab('deck')}
          className={`px-4 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
            activeTab === 'deck'
              ? 'bg-[#292929] text-[#fafafa]'
              : 'bg-[#f4f4f5] text-[#222222] hover:bg-[#e4e4e7]'
          }`}
        >
          Fokus
        </button>

        <button
          onClick={() => setActiveTab('route')}
          className={`px-4 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
            activeTab === 'route'
              ? 'bg-[#292929] text-[#fafafa]'
              : 'bg-[#f4f4f5] text-[#222222] hover:bg-[#e4e4e7]'
          }`}
        >
          Daftar Rute
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
            activeTab === 'map'
              ? 'bg-[#292929] text-[#fafafa]'
              : 'bg-[#f4f4f5] text-[#222222] hover:bg-[#e4e4e7]'
          }`}
        >
          Peta
        </button>

        <button
          onClick={() => setActiveTab('cod')}
          className={`px-4 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
            activeTab === 'cod'
              ? 'bg-[#292929] text-[#fafafa]'
              : 'bg-[#f4f4f5] text-[#222222] hover:bg-[#e4e4e7]'
          }`}
        >
          Rekap COD
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-[#292929] text-[#fafafa]'
              : 'bg-[#f4f4f5] text-[#222222] hover:bg-[#e4e4e7]'
          }`}
        >
          Riwayat
        </button>
      </nav>
    </header>
  );
};
