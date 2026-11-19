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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto font-clash">
      <div className="bg-[#fff8f6] border border-[#fce5df] rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-[#00522d]">
        <div className="px-6 py-4 bg-[#fce5df]/50 border-b border-[#fce5df] flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-[#00522d]">Scan Foto Resi / Tambah Paket</h2>
            <p className="text-xs text-[#00522d]/70">Otomatis membaca data resi dan patokan alamat</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#fce5df] text-[#00522d] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex bg-[#fce5df] p-1 rounded-full text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('camera')}
              className={`flex-1 py-2 rounded-full transition cursor-pointer ${
                mode === 'camera' ? 'bg-[#db3c8a] text-white' : 'text-[#00522d]'
              }`}
            >
              Foto / Kamera Resi
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex-1 py-2 rounded-full transition cursor-pointer ${
                mode === 'manual' ? 'bg-[#db3c8a] text-white' : 'text-[#00522d]'
              }`}
            >
              Ketik Manual
            </button>
          </div>

          {mode === 'camera' && (
            <div className="border-2 border-dashed border-[#fce5df] rounded-[20px] p-5 text-center bg-[#fce5df]/30 space-y-3">
              {imagePreview ? (
                <div>
                  <img
                    src={imagePreview}
                    alt="Pratinjau Resi"
                    className="max-h-48 mx-auto rounded-[12px] object-contain border border-[#fce5df]"
                  />
                  {isProcessingOcr && (
                    <div className="flex items-center justify-center gap-2 mt-3 text-xs font-bold text-[#db3c8a]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Membaca tulisan resi... ({ocrProgress}%)</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 space-y-3">
                  <p className="text-xs font-bold text-[#00522d]">
                    Foto resi paket J&T menggunakan kamera iPhone
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <label className="bg-[#db3c8a] hover:bg-[#c22e77] text-white font-bold text-xs px-4 py-2.5 rounded-full cursor-pointer transition">
                      <span>Buka Kamera</span>
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
                    <label className="bg-[#fce5df] text-[#00522d] font-bold text-xs px-4 py-2.5 rounded-full cursor-pointer border border-[#fce5df] transition">
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
          )}

          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#00522d] mb-1">Nomor Resi:</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Misal: JX1234567890"
                  className="w-full bg-[#fce5df]/40 border border-[#fce5df] rounded-[10px] px-3 py-2 text-[#00522d] font-mono font-bold focus:outline-none focus:border-[#db3c8a]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#00522d] mb-1">Nama Penerima:</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nama customer"
                  className="w-full bg-[#fce5df]/40 border border-[#fce5df] rounded-[10px] px-3 py-2 text-[#00522d] font-bold focus:outline-none focus:border-[#db3c8a]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#00522d] mb-1">No. HP / WhatsApp:</label>
              <input
                type="text"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full bg-[#fce5df]/40 border border-[#fce5df] rounded-[10px] px-3 py-2 text-[#00522d] font-mono focus:outline-none focus:border-[#db3c8a]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#00522d] mb-1">Alamat Lengkap:</label>
              <textarea
                rows={2}
                value={fullAddress}
                onChange={(e) => {
                  setFullAddress(e.target.value);
                  if (!areaOrStreet) setAreaOrStreet(e.target.value.slice(0, 30));
                }}
                placeholder="Jl. Mawar No. 10, RT 02/RW 03..."
                className="w-full bg-[#fce5df]/40 border border-[#fce5df] rounded-[10px] px-3 py-2 text-[#00522d] focus:outline-none focus:border-[#db3c8a]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#00522d] mb-1">Patokan Alamat:</label>
              <input
                type="text"
                value={benchmark}
                onChange={(e) => setBenchmark(e.target.value)}
                placeholder="Pagar hitam / samping warung Bu Joko"
                className="w-full bg-[#fce5df]/40 border border-[#fce5df] rounded-[10px] px-3 py-2 text-[#00522d] focus:outline-none focus:border-[#db3c8a]"
              />
            </div>

            <div className="bg-[#fce5df]/60 p-3 rounded-[12px] border border-[#fce5df] space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCod}
                  onChange={(e) => setIsCod(e.target.checked)}
                  className="w-4 h-4 rounded text-[#db3c8a] focus:ring-[#db3c8a]"
                />
                <span className="text-xs font-bold text-[#00522d]">Paket COD (Bayar di Tempat)</span>
              </label>

              {isCod && (
                <div>
                  <label className="block text-[11px] font-bold text-[#00522d] mb-1">
                    Nominal COD (Rp):
                  </label>
                  <input
                    type="number"
                    value={codAmount || ''}
                    onChange={(e) => setCodAmount(Number(e.target.value))}
                    placeholder="Contoh: 75000"
                    className="w-full bg-[#fff8f6] border border-[#fce5df] rounded-[8px] px-3 py-2 text-[#db3c8a] font-mono font-bold focus:outline-none"
                  />
                </div>
              )}
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
                disabled={isSaving || isProcessingOcr}
                className="flex-2 py-3 rounded-[10px] bg-[#db3c8a] hover:bg-[#c22e77] text-white font-bold transition cursor-pointer"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Paket ke Rute'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
