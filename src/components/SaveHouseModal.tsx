import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Camera,
  Upload,
  X,
  Check,
  Navigation,
  RefreshCw,
  Home,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import type { SavedHousePoint } from '../types';
import {
  compressHousePhoto,
  getCurrentGpsLocation,
  saveHousePoint,
} from '../utils/houseManager';

interface SaveHouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<SavedHousePoint> | null;
  onSaved: (savedHouse: SavedHousePoint) => void;
}

export const SaveHouseModal: React.FC<SaveHouseModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSaved,
}) => {
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [areaOrStreet, setAreaOrStreet] = useState('');
  const [benchmark, setBenchmark] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [lat, setLat] = useState<number>(-7.2255);
  const [lng, setLng] = useState<number>(113.4492);
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined);

  const [isGettingGps, setIsGettingGps] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setRecipientName(initialData.recipientName || '');
        setRecipientPhone(initialData.recipientPhone || '');
        setFullAddress(initialData.fullAddress || '');
        setAreaOrStreet(initialData.areaOrStreet || '');
        setBenchmark(initialData.benchmark || '');
        setNotes(initialData.notes || '');
        setPhotoUrl(initialData.photoUrl);
        setLat(initialData.lat || -7.2255);
        setLng(initialData.lng || 113.4492);
        setAccuracy(initialData.accuracyMeters);
        // Otomatis kunci GPS jika belum ada akurasi
        if (!initialData.accuracyMeters) {
          handleFetchCurrentGps();
        }
      } else {
        resetForm();
        handleFetchCurrentGps();
      }
      setFeedback(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const resetForm = () => {
    setRecipientName('');
    setRecipientPhone('');
    setFullAddress('');
    setAreaOrStreet('');
    setBenchmark('');
    setNotes('');
    setPhotoUrl(undefined);
    setLat(-7.2255);
    setLng(113.4492);
    setAccuracy(undefined);
  };

  const handleFetchCurrentGps = async () => {
    setIsGettingGps(true);
    setFeedback(null);
    try {
      const loc = await getCurrentGpsLocation();
      setLat(loc.lat);
      setLng(loc.lng);
      setAccuracy(loc.accuracy);
      setFeedback({
        type: 'success',
        text: `📍 GPS berhasil dikunci di posisi Anda! (Akurasi: ±${Math.round(loc.accuracy || 4)} meter)`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: 'Gagal mengunci GPS. Pastikan izin lokasi (GPS) di HP sudah aktif.',
      });
    }
    setIsGettingGps(false);
  };

  const handlePhotoUpload = async (file: File) => {
    setIsProcessingPhoto(true);
    try {
      const compressed = await compressHousePhoto(file);
      setPhotoUrl(compressed);
    } catch (err) {
      console.error('Failed to compress photo:', err);
      alert('Gagal memproses foto rumah. Coba gunakan foto lain.');
    }
    setIsProcessingPhoto(false);
  };

  const handleQuickSavePointOnly = () => {
    const finalName = recipientName.trim() || initialData?.recipientName || 'Titik Lokasi Pelanggan';
    const finalAddress =
      fullAddress.trim() ||
      initialData?.fullAddress ||
      areaOrStreet.trim() ||
      `Titik GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`;

    const houseToSave: SavedHousePoint = {
      id: initialData?.id || `house-${Date.now()}`,
      recipientName: finalName,
      recipientPhone: recipientPhone.trim(),
      fullAddress: finalAddress,
      areaOrStreet: areaOrStreet.trim() || 'Branta Pamekasan',
      benchmark: benchmark.trim() || 'Titik dikunci langsung di lokasi kurir',
      notes: notes.trim(),
      photoUrl,
      lat,
      lng,
      accuracyMeters: accuracy,
      savedAt: initialData?.savedAt || new Date().toISOString(),
      deliveryCount: initialData?.deliveryCount || 1,
    };

    saveHousePoint(houseToSave);
    onSaved(houseToSave);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuickSavePointOnly();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto font-aspekta">
      <div className="bg-[#fafafa] rounded-[32px] w-full max-w-lg shadow-2xl border border-[#e4e4e7] overflow-hidden my-auto max-h-[92vh] flex flex-col text-[#222222]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#fafafa] border-b border-[#e4e4e7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#080808] text-amber-400 flex items-center justify-center shadow-sm">
              <Home className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#080808] tracking-tight">
                {initialData?.id ? 'Ubah Catatan Titik Rumah' : 'Catat Titik & Foto Rumah'}
              </h2>
              <p className="text-xs text-[#696969]">Simpan koordinat akurat & foto agar selalu ingat lokasinya</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#f4f4f5] text-[#696969] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {feedback && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold border flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Quick 1-Click Save Current GPS Point */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-[22px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Hanya Ingin Mencatat Titiknya Saja?</span>
              </div>
              <p className="text-[11px] text-emerald-800/80 mt-0.5">
                Cukup 1-klik untuk merekam titik lokasi di mana Anda berdiri saat ini. Tidak perlu foto atau isi data lain.
              </p>
            </div>
            <button
              type="button"
              onClick={handleQuickSavePointOnly}
              className="bg-[#080808] hover:bg-neutral-800 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-full transition shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simpan Titik Ini Saja 📍</span>
            </button>
          </div>

          {/* Section: GPS Location Locking */}
          <div className="bg-white p-4 rounded-[22px] border border-[#e4e4e7] shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-600" />
                <span className="font-bold text-[#080808]">Titik Koordinat GPS Rumah</span>
              </div>
              <button
                type="button"
                onClick={handleFetchCurrentGps}
                disabled={isGettingGps}
                className="bg-[#080808] hover:bg-neutral-800 active:scale-95 disabled:opacity-50 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer shadow-sm transition"
              >
                <RefreshCw className={`w-3 h-3 ${isGettingGps ? 'animate-spin' : ''}`} />
                <span>{isGettingGps ? 'Mengunci GPS...' : 'Kunci GPS Saya Saat Ini 📍'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#696969] font-mono bg-[#f4f4f5] px-3.5 py-2 rounded-xl">
              <span>Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}</span>
              {accuracy && <span className="text-emerald-700 font-bold">±{Math.round(accuracy)}m</span>}
            </div>
          </div>

          {/* Section: Foto Rumah Pelanggan (Opsional) */}
          <div className="bg-white p-4 rounded-[22px] border border-[#e4e4e7] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#080808]" />
                <span className="font-bold text-[#080808]">Foto Tampak Depan / Gerbang (Opsional)</span>
              </div>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl(undefined)}
                  className="text-red-600 hover:text-red-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus Foto</span>
                </button>
              )}
            </div>

            {photoUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-[#e4e4e7] bg-neutral-900 max-h-52 flex items-center justify-center">
                <img
                  src={photoUrl}
                  alt="Foto Rumah"
                  className="w-full h-full object-cover max-h-52"
                />
                <label className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-[10px] font-bold cursor-pointer hover:bg-black transition flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  <span>Ganti Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handlePhotoUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            ) : (
              <div className="border border-dashed border-[#d4d4d8] rounded-2xl p-5 text-center bg-[#fafafa] space-y-2.5">
                <p className="text-[11px] text-[#696969]">
                  Boleh difoto atau dilewati (opsional). Foto mempermudah kurir lain atau Anda saat kirim lagi.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <label className="bg-[#292929] hover:bg-[#080808] active:scale-95 text-[#fafafa] font-bold text-xs px-4 py-2 rounded-full cursor-pointer transition shadow-sm flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isProcessingPhoto ? 'Memproses...' : 'Ambil Foto HP 📸'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handlePhotoUpload(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  <label className="bg-[#f4f4f5] hover:bg-[#e4e4e7] text-[#222222] font-semibold text-xs px-4 py-2 rounded-full cursor-pointer border border-[#e4e4e7] transition flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Galeri</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handlePhotoUpload(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#696969] font-medium mb-1">Nama Customer / Pemilik (Opsional):</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Misal: Bu Luluk / Pak Rais"
                className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-4 py-2.5 text-xs text-[#080808] font-semibold focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[#696969] font-medium mb-1">No. WhatsApp / Telepon:</label>
              <input
                type="text"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-4 py-2.5 text-xs text-[#080808] font-mono focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#696969] font-medium mb-1">Dusun / Area:</label>
              <input
                type="text"
                value={areaOrStreet}
                onChange={(e) => setAreaOrStreet(e.target.value)}
                placeholder="Misal: Dusun Bandaran / Branta Pesisir"
                className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-4 py-2.5 text-xs text-[#080808] focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[#696969] font-medium mb-1">Patokan / Ciri Fisik Rumah:</label>
              <input
                type="text"
                value={benchmark}
                onChange={(e) => setBenchmark(e.target.value)}
                placeholder="Misal: Dinding coklat, pintu hitam, samping pos ronda"
                className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-4 py-2.5 text-xs text-[#080808] focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#696969] font-medium mb-1">Alamat / Keterangan (Opsional):</label>
            <textarea
              rows={2}
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              placeholder="Alamat lengkap atau patokan lokasi..."
              className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-2xl px-4 py-2 text-xs text-[#080808] focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-[#696969] font-medium mb-1">Catatan Tambahan Kurir (Opsional):</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Orangnya biasa melaut pagi, titip ke Bu Joko kalau sepi"
              className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-4 py-2 text-xs text-[#080808] focus:outline-none focus:border-black"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full bg-[#f4f4f5] hover:bg-[#e4e4e7] text-[#222222] font-semibold text-xs border border-[#e4e4e7] transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-2 py-3 rounded-full bg-[#080808] hover:bg-neutral-800 active:scale-95 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Simpan Titik Rumah 💾</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
