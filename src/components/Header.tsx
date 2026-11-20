import React, { useState } from 'react';
import {
  Plus,
  Settings,
  ShieldCheck,
  Lock,
  Key,
} from 'lucide-react';
import type { LocalLicenseInfo } from '../utils/licenseManager';
import { getDaysRemaining, isLicenseValid } from '../utils/licenseManager';

interface HeaderProps {
  activeTab: 'deck' | 'route' | 'map' | 'scan' | 'cod' | 'history';
  setActiveTab: (tab: 'deck' | 'route' | 'map' | 'scan' | 'cod' | 'history') => void;
  dropPointName: string;
  courierName: string;
  onOpenSettings: () => void;
  onOpenScan: () => void;
  license: LocalLicenseInfo | null;
  onOpenSubscription: () => void;
  onOpenAdminPanel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  dropPointName,
  courierName: _courierName,
  onOpenSettings,
  onOpenScan,
  license,
  onOpenSubscription,
  onOpenAdminPanel,
}) => {
  const isDarkTab = activeTab === 'deck';
  const [clickCount, setClickCount] = useState(0);

  const isValid = isLicenseValid(license);
  const daysLeft = license ? getDaysRemaining(license.expiresAt) : 0;

  const handleWordmarkClick = () => {
    const next = clickCount + 1;
    if (next >= 4) {
      setClickCount(0);
      onOpenAdminPanel();
    } else {
      setClickCount(next);
      setTimeout(() => setClickCount(0), 2000);
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 backdrop-blur-md border-b select-none font-aspekta ${
        isDarkTab
          ? 'bg-[#000000]/95 border-neutral-800 text-white'
          : 'bg-[#fafafa]/95 border-[#e4e4e7] text-[#222222]'
      }`}
    >
      {/* Three-Zone Navigation Bar */}
      <div className="max-w-4xl mx-auto px-5 py-2.5 flex items-center justify-between">
        {/* Left: Brand Wordmark + Handwritten Voice (Tap 4x opens Admin) */}
        <div
          onClick={handleWordmarkClick}
          className="flex items-center gap-2 cursor-pointer active:scale-95 transition"
          title="Ketuk 4x untuk buka Panel Admin Pembuat Kode"
        >
          <span
            className={`font-bold text-sm tracking-[-0.02em] ${
              isDarkTab ? 'text-white' : 'text-[#080808]'
            }`}
          >
            KURIR 2.0
          </span>
          <span
            className={`font-fasthand text-xl leading-none select-none ${
              isDarkTab ? 'text-neutral-400' : 'text-[#696969]'
            }`}
          >
            branta
          </span>
        </div>

        {/* Center: Standalone 'K.' Glyph + Drop Point + License Badge */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-[#696969]">
          <span className={`font-bold text-base ${isDarkTab ? 'text-white' : 'text-[#080808]'}`}>
            K.
          </span>
          <span>•</span>
          <span
            className={`truncate max-w-[150px] font-medium ${
              isDarkTab ? 'text-neutral-300' : 'text-[#696969]'
            }`}
            title={dropPointName}
          >
            {dropPointName}
          </span>
        </div>

        {/* Right: License Pill + Scan Button + Settings */}
        <div className="flex items-center gap-2">
          {/* License Status Badge Button */}
          {isValid ? (
            <button
              onClick={onOpenSubscription}
              title={`Lisensi aktif: ${daysLeft} hari lagi`}
              className={`flex items-center gap-1 font-bold text-[11px] px-2.5 py-1 rounded-full transition cursor-pointer active:scale-95 border ${
                license?.isTrial
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{license?.isTrial ? `Trial (${daysLeft}h)` : `PRO (${daysLeft}h)`}</span>
            </button>
          ) : (
            <button
              onClick={onOpenSubscription}
              title="Aplikasi butuh aktivasi kode akses bulanan"
              className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-900 border border-red-300 font-bold text-[11px] px-2.5 py-1 rounded-full transition cursor-pointer active:scale-95 animate-pulse"
            >
              <Lock className="w-3.5 h-3.5 text-red-600" />
              <span>Aktivasi</span>
            </button>
          )}

          <button
            onClick={onOpenScan}
            className={`flex items-center gap-1.5 active:scale-95 font-medium text-xs py-1.5 px-3 rounded-full transition shadow-sm cursor-pointer ${
              isDarkTab
                ? 'bg-white hover:bg-neutral-200 text-black font-semibold'
                : 'bg-[#292929] hover:bg-[#080808] text-[#fafafa]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan Resi</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="Pengaturan"
            className={`p-2 rounded-full transition cursor-pointer ${
              isDarkTab
                ? 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                : 'text-[#696969] hover:text-[#080808] hover:bg-[#f4f4f5]'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pill Tabs Strip: 999px fully rounded pills */}
      <nav
        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 border-t overflow-x-auto scrollbar-none text-xs ${
          isDarkTab ? 'border-neutral-800' : 'border-[#e4e4e7]/70'
        }`}
      >
        <button
          onClick={() => setActiveTab('deck')}
          className={`px-4 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
            activeTab === 'deck'
              ? 'bg-white text-black font-semibold shadow-sm'
              : isDarkTab
              ? 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              : 'bg-[#f4f4f5] text-[#222222] hover:bg-[#e4e4e7]'
          }`}
        >
          Fokus (Kartu)
        </button>

        <button
          onClick={() => setActiveTab('route')}
          className={`px-4 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
            activeTab === 'route'
              ? isDarkTab
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'bg-[#292929] text-[#fafafa]'
              : isDarkTab
              ? 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              : 'bg-[#f4f4f5] text-[#222222] hover:bg-[#e4e4e7]'
          }`}
        >
          Daftar Rute
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
            activeTab === 'map'
              ? isDarkTab
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'bg-[#292929] text-[#fafafa]'
              : isDarkTab
              ? 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              : 'bg-[#f4f4f5] text-[#222222] hover:bg-[#e4e4e7]'
          }`}
        >
          Peta
        </button>

        <button
          onClick={() => setActiveTab('cod')}
          className={`px-4 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
            activeTab === 'cod'
              ? isDarkTab
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'bg-[#292929] text-[#fafafa]'
              : isDarkTab
              ? 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              : 'bg-[#f4f4f5] text-[#222222] hover:bg-[#e4e4e7]'
          }`}
        >
          Rekap COD
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
            activeTab === 'history'
              ? isDarkTab
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'bg-[#292929] text-[#fafafa]'
              : isDarkTab
              ? 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              : 'bg-[#f4f4f5] text-[#222222] hover:bg-[#e4e4e7]'
          }`}
        >
          Riwayat
        </button>
      </nav>
    </header>
  );
};
