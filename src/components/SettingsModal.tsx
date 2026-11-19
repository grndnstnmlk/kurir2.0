import React, { useState } from 'react';
import { Settings, MapPin, Check, X, Compass } from 'lucide-react';
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
        alert('Berhasil! Titik Drop Point telah diperbarui menggunakan koordinat GPS Anda saat ini.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600/30 text-red-400 border border-red-500/30 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Pengaturan Profil & Drop Point</h2>
              <p className="text-[11px] text-slate-400">Atur gudang awal berangkat, nama kurir, & pesan WA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Nama Kurir / Sprinter:
            </label>
            <input
              type="text"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              placeholder="Misal: Budi Santoso"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-400" />
                Drop Point / Gudang Asal
              </span>

              <button
                type="button"
                onClick={handleGetCurrentGps}
                disabled={isGettingGps}
                className="flex items-center gap-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer"
              >
                <Compass className={`w-3.5 h-3.5 ${isGettingGps ? 'animate-spin' : ''}`} />
                <span>Gunakan GPS Sekarang</span>
              </button>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Nama Drop Point:</label>
              <input
                type="text"
                value={dropPointName}
                onChange={(e) => setDropPointName(e.target.value)}
                placeholder="Misal: J&T DP Menteng"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Alamat Drop Point:</label>
              <input
                type="text"
                value={dropPointAddress}
                onChange={(e) => setDropPointAddress(e.target.value)}
                placeholder="Alamat kantor / gudang J&T Anda"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <label className="text-slate-400 block mb-0.5">Latitude:</label>
                <input
                  type="number"
                  step="any"
                  value={dropPointLat}
                  onChange={(e) => setDropPointLat(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Longitude:</label>
                <input
                  type="number"
                  step="any"
                  value={dropPointLng}
                  onChange={(e) => setDropPointLng(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 font-mono text-slate-200"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Template Pesan WhatsApp Otomatis:
            </label>
            <p className="text-[10px] text-slate-400 mb-1">
              Variabel yang bisa digunakan: <code className="text-red-400 font-mono">{"{NAMA}"}</code>, <code className="text-red-400 font-mono">{"{RESI}"}</code>, <code className="text-red-400 font-mono">{"{INFO_COD}"}</code>, <code className="text-red-400 font-mono">{"{ALAMAT}"}</code>
            </p>
            <textarea
              rows={4}
              value={customWhatsAppTemplate}
              onChange={(e) => setCustomWhatsAppTemplate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-100 font-mono text-xs focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('Muat ulang 6 paket contoh realistis J&T untuk simulasi?')) {
                  onLoadSampleData();
                  onClose();
                }
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
            >
              Muat 6 Paket Contoh J&T
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Yakin ingin mereset semua data paket hari ini?')) {
                  onResetData();
                  onClose();
                }
              }}
              className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 font-semibold transition cursor-pointer"
            >
              Hapus Semua Data
            </button>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 transition cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
