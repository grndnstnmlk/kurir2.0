import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import {
  Camera,
  Upload,
  Check,
  X,
  FileText,
  DollarSign,
  Loader2,
} from 'lucide-react';
import type { DeliveryPackage, CourierSettings } from '../types';
import { parseIndonesianResiText } from '../utils/ocrParser';
import { geocodeAddress } from '../utils/geocoding';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPackage: (pkg: DeliveryPackage) => void;
  settings: CourierSettings;
  currentCount: number;
}

export const ScanModal: React.FC<ScanModalProps> = ({
  isOpen,
  onClose,
  onAddPackage,
  settings,
  currentCount,
}) => {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [rawOcrText, setRawOcrText] = useState<string>('');
  const [showRawText, setShowRawText] = useState<boolean>(false);

  // Form Fields
  const [trackingNumber, setTrackingNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [areaOrStreet, setAreaOrStreet] = useState('');
  const [benchmark, setBenchmark] = useState('');
  const [isCod, setIsCod] = useState(false);
  const [codAmount, setCodAmount] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = async (file: File) => {
    try {
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      setIsProcessingOcr(true);
      setOcrProgress(10);

      const worker = await createWorker('ind+eng');
      setOcrProgress(40);

      const ret = await worker.recognize(file);
      setOcrProgress(80);
      const text = ret.data.text;
      setRawOcrText(text);

      await worker.terminate();
      setOcrProgress(100);
      setIsProcessingOcr(false);

      const parsed = parseIndonesianResiText(text);
      setTrackingNumber(parsed.trackingNumber || `JX${Date.now().toString().slice(-8)}`);
      setRecipientName(parsed.recipientName || '');
      setRecipientPhone(parsed.recipientPhone || '');
      setFullAddress(parsed.fullAddress || '');
      setAreaOrStreet(parsed.areaOrStreet || '');
      setBenchmark(parsed.benchmark || '');
      setIsCod(parsed.isCod);
      setCodAmount(parsed.codAmount || 0);
    } catch (err) {
      console.error('OCR Error:', err);
      setIsProcessingOcr(false);
      alert('Gagal membaca gambar secara otomatis. Anda tetap dapat memasukkan data secara manual di bawah.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullAddress.trim()) {
      alert('Mohon isi alamat pengantaran.');
      return;
    }

    setIsSaving(true);

    const coords = await geocodeAddress(
      fullAddress,
      settings.dropPointLat,
      settings.dropPointLng
    );

    const newPkg: DeliveryPackage = {
      id: `pkg-${Date.now()}`,
      trackingNumber: trackingNumber.trim() || `JX${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      recipientName: recipientName.trim() || 'Customer J&T',
      recipientPhone: recipientPhone.trim() || '081234567890',
      fullAddress: fullAddress.trim(),
      areaOrStreet: areaOrStreet.trim() || fullAddress.slice(0, 30),
      benchmark: benchmark.trim(),
      isCod,
      codAmount: isCod ? Number(codAmount) : 0,
      status: 'pending',
      lat: coords.lat,
      lng: coords.lng,
      orderIndex: currentCount + 1,
      createdAt: new Date().toISOString(),
    };

    onAddPackage(newPkg);
    setIsSaving(false);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setImagePreview(null);
    setRawOcrText('');
    setTrackingNumber('');
    setRecipientName('');
    setRecipientPhone('');
    setFullAddress('');
    setAreaOrStreet('');
    setBenchmark('');
    setIsCod(false);
    setCodAmount(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600/30 text-red-400 border border-red-500/30 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Scan Foto / Tambah Resi Paket</h2>
              <p className="text-[11px] text-slate-400">Otomatis membaca tulisan resi & patokan alamat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('camera')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                mode === 'camera'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Kamera / Foto Resi (OCR)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                mode === 'manual'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ketik / Tempel Manual</span>
            </button>
          </div>

          {mode === 'camera' && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-700 hover:border-red-500 rounded-2xl p-4 text-center bg-slate-800/40 transition">
                {imagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={imagePreview}
                      alt="Pratinjau Resi"
                      className="max-h-48 mx-auto rounded-xl object-contain border border-slate-700"
                    />
                    {isProcessingOcr ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                        <p className="text-xs font-semibold text-slate-300">
                          Sedang membaca teks resi... ({ocrProgress}%)
                        </p>
                        <div className="w-48 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-red-500 h-full transition-all duration-300"
                            style={{ width: `${ocrProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                        <Check className="w-4 h-4" /> Resi berhasil dibaca & diekstrak!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="py-4 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-red-400 flex items-center justify-center mx-auto border border-slate-700">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">
                        Ambil Foto Resi Paket atau Unggah Gambar
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Arahkan kamera ke bagian barcode, nama penerima, & alamat
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-1">
                      <label className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-md transition active:scale-95">
                        <Camera className="w-4 h-4" />
                        <span>Buka Kamera HP</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageUpload(e.target.files[0]);
                            }
                          }}
                        />
                      </label>

                      <label className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs px-3.5 py-2.5 rounded-xl cursor-pointer border border-slate-700 transition active:scale-95">
                        <Upload className="w-4 h-4" />
                        <span>Pilih File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageUpload(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {rawOcrText && (
                <div className="text-[11px]">
                  <button
                    type="button"
                    onClick={() => setShowRawText(!showRawText)}
                    className="text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    {showRawText ? 'Sembunyikan Hasil Teks Mentah' : 'Lihat Hasil Teks Mentah Resi'}
                  </button>
                  {showRawText && (
                    <pre className="mt-1 p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 font-mono text-[10px] max-h-24 overflow-y-auto whitespace-pre-wrap">
                      {rawOcrText}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Nomor Resi J&T:
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Misal: JX1234567890"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Nama Penerima:
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nama customer"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                No. HP / WhatsApp:
              </label>
              <input
                type="text"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Alamat Lengkap (Jalan, RT/RW, Desa/Perumahan):
              </label>
              <textarea
                rows={2}
                value={fullAddress}
                onChange={(e) => {
                  setFullAddress(e.target.value);
                  if (!areaOrStreet) setAreaOrStreet(e.target.value.slice(0, 30));
                }}
                placeholder="Jl. Mawar No. 10, RT 02/RW 03, Perumahan Indah..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                💡 Patokan Alamat (Opsional tapi Membantu):
              </label>
              <input
                type="text"
                value={benchmark}
                onChange={(e) => setBenchmark(e.target.value)}
                placeholder="Pagar hitam / samping warung Bu Joko / depan masjid"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCod}
                  onChange={(e) => setIsCod(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-slate-900 border-slate-700"
                />
                <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  Paket COD (Bayar di Tempat)
                </span>
              </label>

              {isCod && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Nominal Tagihan COD (Rp):
                  </label>
                  <input
                    type="number"
                    value={codAmount || ''}
                    onChange={(e) => setCodAmount(Number(e.target.value))}
                    placeholder="Contoh: 75000"
                    className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving || isProcessingOcr}
                className="flex-2 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mencari Lokasi Peta...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Simpan Paket ke Rute</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
