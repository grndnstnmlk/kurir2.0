import React, { useState } from 'react';
import { Settings, MapPin, X, Compass } from 'lucide-react';
import type { CourierSettings, RouteStrategy } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CourierSettings;
  onSaveSettings: (settings: CourierSettings) => void;
  onResetData: () => void;
  onLoadSampleData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetData,
  onLoadSampleData,
}) => {
  const [courierName, setCourierName] = useState(settings.courierName);
  const [dropPointName, setDropPointName] = useState(settings.dropPointName);
  const [dropPointAddress, setDropPointAddress] = useState(settings.dropPointAddress);
  const [dropPointLat, setDropPointLat] = useState(settings.dropPointLat);
  const [dropPointLng, setDropPointLng] = useState(settings.dropPointLng);
  const [defaultStrategy, setDefaultStrategy] = useState<RouteStrategy>(settings.defaultStrategy);
  const [customWhatsAppTemplate, setCustomWhatsAppTemplate] = useState(settings.customWhatsAppTemplate);
  const [isGettingGps, setIsGettingGps] = useState(false);

  if (!isOpen) return null;

  const handleGetCurrentGps = () => {
    if (!navigator.geolocation) {
      alert('Perangkat Anda tidak mendukung geolokasi GPS.');
      return;
    }
    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDropPointLat(pos.coords.latitude);
        setDropPointLng(pos.coords.longitude);
        setIsGettingGps(false);
        alert('Berhasil! Titik Drop Point telah diperbarui menggunakan koordinat GPS Anda.');
      },
      (err) => {
        setIsGettingGps(false);
        alert(`Gagal mengambil GPS: ${err.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      courierName: courierName.trim() || 'Sprinter J&T',
      dropPointName: dropPointName.trim() || 'Drop Point J&T',
      dropPointAddress: dropPointAddress.trim(),
      dropPointLat: Number(dropPointLat),
      dropPointLng: Number(dropPointLng),
      defaultStrategy,
      customWhatsAppTemplate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto font-aspekta">
      {/* Floating Modal with 32px Radius & Layered Shadow */}
      <div className="bg-[#fafafa] rounded-[32px] w-full max-w-lg shadow-deep border border-[#e4e4e7] overflow-hidden my-auto max-h-[92vh] flex flex-col text-[#222222]">
        <div className="px-7 py-5 bg-[#fafafa] border-b border-[#e4e4e7] flex items-center justify-between">
          <div>
            <h2 className="font-medium text-lg text-[#080808] tracking-[-0.015em]">
              Pengaturan Profil & Drop Point
            </h2>
            <p className="text-xs text-[#696969]">Atur nama kurir, gudang berangkat, dan template WhatsApp</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#f4f4f5] text-[#696969] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-7 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="block text-[#696969] mb-1 font-medium">Nama Sprinter Kurir:</label>
            <input
              type="text"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              placeholder="Nama kurir"
              className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-4 py-2 text-[#080808] focus:outline-none focus:border-[#292929]"
            />
          </div>

          <div className="bg-[#f4f4f5] p-4 rounded-[20px] border border-[#e4e4e7] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#080808] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#292929]" />
                Drop Point / Gudang Asal
              </span>

              <button
                type="button"
                onClick={handleGetCurrentGps}
                disabled={isGettingGps}
                className="flex items-center gap-1 bg-[#292929] hover:bg-[#080808] text-[#fafafa] px-3.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer"
              >
                <Compass className={`w-3.5 h-3.5 ${isGettingGps ? 'animate-spin' : ''}`} />
                <span>Gunakan GPS</span>
              </button>
            </div>

            <div>
              <label className="block text-[#696969] mb-0.5">Nama Drop Point:</label>
              <input
                type="text"
                value={dropPointName}
                onChange={(e) => setDropPointName(e.target.value)}
                className="w-full bg-[#fafafa] border border-[#e4e4e7] rounded-full px-3.5 py-1.5 text-[#080808] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#696969] mb-0.5">Alamat Drop Point:</label>
              <input
                type="text"
                value={dropPointAddress}
                onChange={(e) => setDropPointAddress(e.target.value)}
                className="w-full bg-[#fafafa] border border-[#e4e4e7] rounded-full px-3.5 py-1.5 text-[#080808] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#696969] mb-1 font-medium">Strategi Optimasi Rute Bawaan:</label>
            <select
              value={defaultStrategy}
              onChange={(e) => setDefaultStrategy(e.target.value as RouteStrategy)}
              className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-4 py-2 text-[#080808] font-semibold focus:outline-none focus:border-[#292929]"
            >
              <option value="optimal-tsp">⚡ Hemat Waktu & Anti Bolak-Balik (2-Opt TSP)</option>
              <option value="cluster-sweep">🏘️ Tersusun per Dusun / Blok (Satu Arah)</option>
              <option value="farthest-first">🏁 Titik Terjauh Mundur Pulang</option>
              <option value="nearest-first">📍 Terdekat Duluan</option>
            </select>
          </div>

          <div>
            <label className="block text-[#696969] mb-1 font-medium">Template Pesan WhatsApp:</label>
            <textarea
              rows={4}
              value={customWhatsAppTemplate}
              onChange={(e) => setCustomWhatsAppTemplate(e.target.value)}
              className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-[16px] p-3 text-[#080808] font-mono text-xs focus:outline-none focus:border-[#292929]"
            />
          </div>

          <div className="pt-2 border-t border-[#e4e4e7] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('Muat ulang 6 paket contoh realistis J&T?')) {
                  onLoadSampleData();
                  onClose();
                }
              }}
              className="px-4 py-2 rounded-full bg-[#f4f4f5] text-[#222222] font-medium transition cursor-pointer border border-[#e4e4e7]"
            >
              Muat 6 Paket Contoh
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Yakin ingin mereset semua data paket hari ini?')) {
                  onResetData();
                  onClose();
                }
              }}
              className="px-4 py-2 rounded-full text-[#696969] hover:text-[#080808] font-medium transition cursor-pointer"
            >
              Hapus Data
            </button>
          </div>

          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full bg-[#f4f4f5] text-[#222222] font-medium transition cursor-pointer border border-[#e4e4e7]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-2 py-3 rounded-full bg-[#292929] hover:bg-[#080808] text-[#fafafa] font-medium transition cursor-pointer shadow-sm"
            >
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
