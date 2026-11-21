import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import {
  Camera,
  Upload,
  X,
  Loader2,
} from 'lucide-react';
import type { DeliveryPackage, CourierSettings } from '../types';
import { parseIndonesianResiText } from '../utils/ocrParser';
import { geocodeAddress } from '../utils/geocoding';
import { preprocessAndScanResiImage } from '../utils/imageScanner';

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
      setIsProcessingOcr(true);
      setOcrProgress(15);

      // 1. Pindai Barcode / QR Code langsung & Auto-crop label putih dari background plastik gelap
      const { processedBlob, previewUrl, decodedCode } = await preprocessAndScanResiImage(file);
      setImagePreview(previewUrl);
      setOcrProgress(35);

      // 2. OCR Tesseract pada gambar label yang sudah terpotong bersih
      const worker = await createWorker('ind+eng');
      setOcrProgress(55);

      const ret = await worker.recognize(processedBlob);
      setOcrProgress(85);
      const text = ret.data.text;
      setRawOcrText(text);

      await worker.terminate();
      setOcrProgress(100);
      setIsProcessingOcr(false);

      // 3. Parser cerdas resi ekspedisi Indonesia (J&T, Shopee, TikTok Shop)
      const parsed = parseIndonesianResiText(text, decodedCode);
      setTrackingNumber(parsed.trackingNumber || `JY${Date.now().toString().slice(-8)}`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto font-aspekta">
      {/* Floating Modal with 32px Radius & Deep Layered Elevation */}
      <div className="bg-[#fafafa] rounded-[32px] w-full max-w-lg shadow-deep border border-[#e4e4e7] overflow-hidden my-auto max-h-[92vh] flex flex-col text-[#222222]">
        <div className="px-7 py-5 bg-[#fafafa] border-b border-[#e4e4e7] flex items-center justify-between">
          <div>
            <h2 className="font-medium text-lg text-[#080808] tracking-[-0.015em]">
              Scan Resi / Tambah Paket
            </h2>
            <p className="text-xs text-[#696969]">Otomatis membaca data resi dan patokan alamat</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#f4f4f5] text-[#696969] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-7 overflow-y-auto space-y-4">
          {/* Pill Mode Switcher */}
          <div className="flex bg-[#f4f4f5] p-1 rounded-full text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode('camera')}
              className={`flex-1 py-2 rounded-full transition cursor-pointer ${
                mode === 'camera' ? 'bg-[#292929] text-[#fafafa]' : 'text-[#696969]'
              }`}
            >
              Foto / Kamera Resi
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex-1 py-2 rounded-full transition cursor-pointer ${
                mode === 'manual' ? 'bg-[#292929] text-[#fafafa]' : 'text-[#696969]'
              }`}
            >
              Ketik Manual
            </button>
          </div>

          {mode === 'camera' && (
            <div className="border border-[#e4e4e7] rounded-[24px] p-6 text-center bg-[#fafafa] space-y-3 shadow-subtle">
              {imagePreview ? (
                <div>
                  <img
                    src={imagePreview}
                    alt="Pratinjau Resi"
                    className="max-h-48 mx-auto rounded-[16px] object-contain border border-[#e4e4e7]"
                  />
                  {isProcessingOcr && (
                    <div className="flex items-center justify-center gap-2 mt-3 text-xs font-medium text-[#080808]">
                      <Loader2 className="w-4 h-4 animate-spin text-[#292929]" />
                      <span>Membaca tulisan resi... ({ocrProgress}%)</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 space-y-3">
                  <p className="text-xs text-[#696969]">
                    Foto resi paket J&T menggunakan kamera ponsel Anda
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <label className="bg-[#292929] hover:bg-[#080808] text-[#fafafa] font-medium text-xs px-5 py-2.5 rounded-full cursor-pointer transition shadow-sm">
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
                    <label className="bg-[#f4f4f5] text-[#222222] font-medium text-xs px-5 py-2.5 rounded-full cursor-pointer border border-[#e4e4e7] transition">
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

          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#696969] mb-1 font-medium">Nomor Resi:</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Misal: JX1234567890"
                  className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-3.5 py-2 text-[#080808] font-mono focus:outline-none focus:border-[#292929]"
                />
              </div>

              <div>
                <label className="block text-[#696969] mb-1 font-medium">Nama Penerima:</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nama customer"
                  className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-3.5 py-2 text-[#080808] focus:outline-none focus:border-[#292929]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#696969] mb-1 font-medium">No. HP / WhatsApp:</label>
              <input
                type="text"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-3.5 py-2 text-[#080808] font-mono focus:outline-none focus:border-[#292929]"
              />
            </div>

            <div>
              <label className="block text-[#696969] mb-1 font-medium">Alamat Lengkap:</label>
              <textarea
                rows={2}
                value={fullAddress}
                onChange={(e) => {
                  setFullAddress(e.target.value);
                  if (!areaOrStreet) setAreaOrStreet(e.target.value.slice(0, 30));
                }}
                placeholder="Jl. Mawar No. 10, RT 02/RW 03..."
                className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-[16px] px-3.5 py-2 text-[#080808] focus:outline-none focus:border-[#292929]"
              />
            </div>

            <div>
              <label className="block text-[#696969] mb-1 font-medium">Patokan Alamat:</label>
              <input
                type="text"
                value={benchmark}
                onChange={(e) => setBenchmark(e.target.value)}
                placeholder="Pagar hitam / samping warung Bu Joko"
                className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-3.5 py-2 text-[#080808] focus:outline-none focus:border-[#292929]"
              />
            </div>

            <div className="bg-[#f4f4f5] p-3.5 rounded-[20px] border border-[#e4e4e7] space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCod}
                  onChange={(e) => setIsCod(e.target.checked)}
                  className="w-4 h-4 rounded text-[#292929] focus:ring-[#292929]"
                />
                <span className="text-xs font-medium text-[#080808]">Paket COD (Bayar di Tempat)</span>
              </label>

              {isCod && (
                <div>
                  <label className="block text-[11px] text-[#696969] mb-1">
                    Nominal COD (Rp):
                  </label>
                  <input
                    type="number"
                    value={codAmount || ''}
                    onChange={(e) => setCodAmount(Number(e.target.value))}
                    placeholder="Contoh: 75000"
                    className="w-full bg-[#fafafa] border border-[#e4e4e7] rounded-full px-3.5 py-2 text-[#080808] font-mono focus:outline-none"
                  />
                </div>
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
                disabled={isSaving || isProcessingOcr}
                className="flex-2 py-3 rounded-full bg-[#292929] hover:bg-[#080808] text-[#fafafa] font-medium transition cursor-pointer shadow-sm"
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
