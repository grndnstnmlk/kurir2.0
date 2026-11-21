import React, { useState, useRef } from 'react';
import { Settings, MapPin, X, Compass, Download, Upload, Cloud, ShieldCheck } from 'lucide-react';
import type { CourierSettings, RouteStrategy } from '../types';
import { exportAppBackup, importAppBackup } from '../utils/backupManager';
import { syncHousesWithSupabase, fetchHousesFromSupabase } from '../utils/houseManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CourierSettings;
  onSaveSettings: (settings: CourierSettings) => void;
  onResetData: () => void;
  onLoadSampleData: () => void;
  onOpenSubscription?: () => void;
  onOpenHousesDirectory?: () => void;
  onHousesRestored?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetData,
  onLoadSampleData,
  onOpenSubscription,
  onOpenHousesDirectory,
  onHousesRestored,
}) => {
  const [courierName, setCourierName] = useState(settings.courierName);
  const [dropPointName, setDropPointName] = useState(settings.dropPointName);
  const [dropPointAddress, setDropPointAddress] = useState(settings.dropPointAddress);
  const [dropPointLat, setDropPointLat] = useState(settings.dropPointLat);
  const [dropPointLng, setDropPointLng] = useState(settings.dropPointLng);
  const [defaultStrategy, setDefaultStrategy] = useState<RouteStrategy>(settings.defaultStrategy);
  const [customWhatsAppTemplate, setCustomWhatsAppTemplate] = useState(settings.customWhatsAppTemplate);
  const [adminWhatsAppNumber, setAdminWhatsAppNumber] = useState(
    settings.adminWhatsAppNumber || '6281295713923'
  );
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportBackup = () => {
    exportAppBackup();
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm(`Pulihkan data dari file "${file.name}"? Data saat ini akan digantikan dengan data cadangan.`)) {
      const res = await importAppBackup(file);
      alert(res.message);
      if (res.success) {
        if (onHousesRestored) onHousesRestored();
        onClose();
        window.location.reload();
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSyncToSupabase = async () => {
    setIsSyncingCloud(true);
    setSyncFeedback(null);
    const res = await syncHousesWithSupabase();
    setIsSyncingCloud(false);
    if (res.success) {
      setSyncFeedback(`✅ Berhasil menyinkronkan ${res.count} titik rumah ke Cloud Supabase!`);
    } else {
      setSyncFeedback(`ℹ️ Catatan: ${res.error}. Buat tabel 'saved_houses' di Supabase SQL Editor agar otomatis tersimpan di Cloud.`);
    }
  };

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
      adminWhatsAppNumber: adminWhatsAppNumber.trim().replace(/\D/g, '') || '6281295713923',
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

            {/* Pilihan Cepat Drop Point J&T Pamekasan */}
            <div className="pt-1">
              <span className="text-[11px] text-[#696969] font-medium block mb-1">
                Pilihan Cepat Gudang J&T Pamekasan:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDropPointName('J&T Express Drop Point Pamekasan (Trunojoyo)');
                    setDropPointAddress('Jl. P. Trunojoyo No. 331, Pamekasan, Madura');
                    setDropPointLat(-7.1642);
                    setDropPointLng(113.4819);
                  }}
                  className="bg-white hover:bg-neutral-100 text-[#080808] border border-[#e4e4e7] px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer active:scale-95 shadow-sm"
                >
                  🏢 J&T Trunojoyo Pamekasan (Arah Tlanakan)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDropPointName('J&T Express Drop Point Jokotole Pamekasan');
                    setDropPointAddress('Jl. Jokotole No. 201-203, Buddagan, Pamekasan');
                    setDropPointLat(-7.1616);
                    setDropPointLng(113.4924);
                  }}
                  className="bg-white hover:bg-neutral-100 text-[#080808] border border-[#e4e4e7] px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer active:scale-95 shadow-sm"
                >
                  🏢 J&T Jokotole (DC Utama)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-[#696969]">
              <div>
                <span>Lat:</span>
                <input
                  type="number"
                  step="any"
                  value={dropPointLat}
                  onChange={(e) => setDropPointLat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#fafafa] border border-[#e4e4e7] rounded-lg px-2 py-1 text-[#080808] mt-0.5"
                />
              </div>
              <div>
                <span>Lng:</span>
                <input
                  type="number"
                  step="any"
                  value={dropPointLng}
                  onChange={(e) => setDropPointLng(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#fafafa] border border-[#e4e4e7] rounded-lg px-2 py-1 text-[#080808] mt-0.5"
                />
              </div>
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
            <label className="block text-[#696969] mb-1 font-medium">
              No. WhatsApp Penjualan Lisensi (Tujuan Pembeli Transfer Rp 100rb):
            </label>
            <input
              type="text"
              placeholder="Contoh: 6281295713923"
              value={adminWhatsAppNumber}
              onChange={(e) => setAdminWhatsAppNumber(e.target.value)}
              className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-4 py-2 text-[#080808] text-xs font-mono focus:outline-none"
            />
            <span className="text-[10px] text-[#696969] mt-1 block">
              Gunakan format 628... agar tombol "Beli Kode Akses" otomatis membuka chat WhatsApp Anda.
            </span>
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

          {/* Keamanan & Cadangan Data (Backup & Cloud Sync) */}
          <div className="pt-3 border-t border-[#e4e4e7] space-y-2.5">
            <div className="flex items-center gap-1.5 text-[#080808] font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Keamanan & Cadangan Data (Anti-Hilang)</span>
            </div>
            <p className="text-[11px] text-[#696969] leading-relaxed">
              Data titik rumah tersimpan di memori aman HP Anda. Cadangkan secara berkala ke file agar tetap aman jika ganti HP.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              className="hidden"
              onChange={handleImportFileChange}
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="py-2.5 px-3 rounded-full bg-white hover:bg-[#f4f4f5] text-[#080808] font-bold text-xs border border-[#e4e4e7] cursor-pointer shadow-2xs active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Cadangkan ke File (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 rounded-full bg-white hover:bg-[#f4f4f5] text-[#080808] font-bold text-xs border border-[#e4e4e7] cursor-pointer shadow-2xs active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pulihkan dari File</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSyncToSupabase}
              disabled={isSyncingCloud}
              className="w-full py-2 px-3 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-200 cursor-pointer shadow-2xs active:scale-95 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isSyncingCloud ? 'Menghubungkan ke Supabase...' : 'Sinkronkan Titik ke Cloud Supabase'}</span>
            </button>

            {syncFeedback && (
              <p className="text-[10px] text-[#696969] bg-[#f4f4f5] p-2 rounded-xl font-mono leading-relaxed">
                {syncFeedback}
              </p>
            )}
          </div>

          {/* Buku Titik Rumah & Lisensi */}
          <div className="pt-3 border-t border-[#e4e4e7] space-y-2">
            {onOpenHousesDirectory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenHousesDirectory();
                }}
                className="w-full py-2.5 rounded-full bg-[#f4f4f5] hover:bg-[#e4e4e7] text-[#080808] font-bold text-xs border border-[#e4e4e7] cursor-pointer shadow-2xs active:scale-95 transition flex items-center justify-center gap-2"
              >
                <span>🏡 Buka Buku Titik Rumah Pelanggan</span>
              </button>
            )}

            {onOpenSubscription && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSubscription();
                }}
                className="w-full py-2.5 rounded-full bg-[#ffffff] hover:bg-neutral-100 text-[#080808] font-bold text-xs border border-[#e4e4e7] cursor-pointer shadow-2xs active:scale-95 transition flex items-center justify-center gap-2"
              >
                <span>💎 Status Lisensi & Masa Aktif</span>
              </button>
            )}
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
