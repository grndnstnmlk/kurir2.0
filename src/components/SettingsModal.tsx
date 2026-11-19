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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto font-clash">
      <div className="bg-[#fff8f6] border border-[#fce5df] rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-[#00522d]">
        <div className="px-6 py-4 bg-[#fce5df]/50 border-b border-[#fce5df] flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-[#00522d]">Pengaturan Profil & Drop Point</h2>
            <p className="text-xs text-[#00522d]/70">Atur profil kurir, gudang berangkat, dan template WA</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#fce5df] text-[#00522d] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#00522d] mb-1">Nama Sprinter Kurir:</label>
            <input
              type="text"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              placeholder="Nama kurir"
              className="w-full bg-[#fce5df]/40 border border-[#fce5df] rounded-[10px] px-3 py-2 text-[#00522d] font-bold focus:outline-none focus:border-[#db3c8a]"
            />
          </div>

          <div className="bg-[#fce5df]/50 p-4 rounded-[16px] border border-[#fce5df] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#00522d] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#db3c8a]" />
                Drop Point / Gudang Asal
              </span>

              <button
                type="button"
                onClick={handleGetCurrentGps}
                disabled={isGettingGps}
                className="flex items-center gap-1 bg-[#db3c8a] hover:bg-[#c22e77] text-white px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer"
              >
                <Compass className={`w-3.5 h-3.5 ${isGettingGps ? 'animate-spin' : ''}`} />
                <span>Gunakan GPS</span>
              </button>
            </div>

            <div>
              <label className="block text-[#00522d] mb-0.5">Nama Drop Point:</label>
              <input
                type="text"
                value={dropPointName}
                onChange={(e) => setDropPointName(e.target.value)}
                className="w-full bg-[#fff8f6] border border-[#fce5df] rounded-[8px] px-3 py-1.5 text-[#00522d] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#00522d] mb-0.5">Alamat Drop Point:</label>
              <input
                type="text"
                value={dropPointAddress}
                onChange={(e) => setDropPointAddress(e.target.value)}
                className="w-full bg-[#fff8f6] border border-[#fce5df] rounded-[8px] px-3 py-1.5 text-[#00522d] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#00522d] mb-1">Template WhatsApp:</label>
            <textarea
              rows={4}
              value={customWhatsAppTemplate}
              onChange={(e) => setCustomWhatsAppTemplate(e.target.value)}
              className="w-full bg-[#fce5df]/40 border border-[#fce5df] rounded-[10px] p-3 text-[#00522d] font-mono text-xs focus:outline-none focus:border-[#db3c8a]"
            />
          </div>

          <div className="pt-2 border-t border-[#fce5df] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('Muat ulang 6 paket contoh realistis J&T?')) {
                  onLoadSampleData();
                  onClose();
                }
              }}
              className="px-3 py-2 rounded-[8px] bg-[#fce5df] text-[#00522d] font-bold transition cursor-pointer"
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
              className="px-3 py-2 rounded-[8px] text-[#db3c8a] font-bold hover:bg-[#fce5df] transition cursor-pointer"
            >
              Hapus Data
            </button>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-[10px] bg-[#fce5df] text-[#00522d] font-bold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-2 py-3 rounded-[10px] bg-[#db3c8a] hover:bg-[#c22e77] text-white font-bold transition cursor-pointer"
            >
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
