import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import {
  Camera,
  Upload,
  X,
  Loader2,
  Zap,
  RotateCcw,
  CheckCircle2,
  ScanLine,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { DeliveryPackage, CourierSettings } from '../types';
import { parseIndonesianResiText } from '../utils/ocrParser';
import { geocodeAddress } from '../utils/geocoding';
import {
  preprocessAndScanResiImage,
  decodeBarcodeFromCanvasOrVideo,
  playScannerBeep,
  triggerHapticFeedback,
} from '../utils/imageScanner';

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
  const [mode, setMode] = useState<'live' | 'upload' | 'manual'>('live');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null);

  // Camera Live Stream State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const isScanningFrameRef = useRef<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [hasTorchCapability, setHasTorchCapability] = useState<boolean>(false);

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

  // Hentikan stream kamera video
  const stopCameraStream = useCallback(() => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
    setHasTorchCapability(false);
  }, []);

  // Mulai stream kamera video (Live Viewfinder)
  const startCameraStream = useCallback(async (facing: 'environment' | 'user' = 'environment') => {
    stopCameraStream();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Kamera tidak didukung pada browser ini. Silakan gunakan tab Upload Foto.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      setIsCameraActive(true);

      // Cek apakah kamera memiliki senter / torch
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities && track.getCapabilities()) as any;
        if (capabilities && 'torch' in capabilities) {
          setHasTorchCapability(true);
        }
      }
    } catch (err: any) {
      console.warn('Gagal mengakses kamera:', err);
      setCameraError(
        'Izin kamera belum aktif. Berikan izin kamera di browser atau gunakan tab Upload Foto.'
      );
      setIsCameraActive(false);
    }
  }, [stopCameraStream]);

  // Efek pembukaan / penutupan modal & pergantian mode kamera
  useEffect(() => {
    if (isOpen && mode === 'live' && !imagePreview && !isProcessingOcr) {
      startCameraStream(facingMode);
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, mode, facingMode, imagePreview, isProcessingOcr, startCameraStream, stopCameraStream]);

  // Ekstraksi OCR Tesseract dari Blob gambar
  const processOcrOnBlob = async (blob: Blob, knownBarcode?: string | null) => {
    try {
      setIsProcessingOcr(true);
      setOcrProgress(25);

      const worker = await createWorker('ind+eng');
      setOcrProgress(50);

      const ret = await worker.recognize(blob);
      setOcrProgress(85);
      const text = ret.data.text;

      await worker.terminate();
      setOcrProgress(100);
      setIsProcessingOcr(false);

      // 3. Parser cerdas resi ekspedisi Indonesia (J&T Sprinter heuristics)
      const parsed = parseIndonesianResiText(text, knownBarcode);
      setTrackingNumber(parsed.trackingNumber || knownBarcode || `JX${Date.now().toString().slice(-8)}`);
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
      alert('Gagal membaca teks otomatis. Silakan periksa atau lengkapi form di bawah.');
    }
  };

  // Tangkap frame saat ini dari live video stream
  const captureCurrentFrameBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current) return resolve(null);
      const video = videoRef.current;
      const w = video.videoWidth || 1280;
      const h = video.videoHeight || 720;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.drawImage(video, 0, 0, w, h);
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
    });
  };

  // Loop pemindai Barcode real-time (Code 128 / QR Code)
  useEffect(() => {
    if (!isCameraActive || mode !== 'live' || isProcessingOcr || imagePreview) {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      return;
    }

    scanIntervalRef.current = window.setInterval(async () => {
      if (isScanningFrameRef.current || !videoRef.current) return;
      const video = videoRef.current;
      if (video.readyState < 2) return; // Belum siap

      isScanningFrameRef.current = true;
      try {
        const barcode = await decodeBarcodeFromCanvasOrVideo(video);
        if (barcode && barcode.length >= 6) {
          // KUNCI BARCODE BERHASIL!
          playScannerBeep();
          triggerHapticFeedback();
          setDetectedBarcode(barcode);
          setTrackingNumber(barcode);

          // Tangkap gambar frame saat ini sebagai bukti
          const frameBlob = await captureCurrentFrameBlob();
          stopCameraStream();

          if (frameBlob) {
            const previewUrl = URL.createObjectURL(frameBlob);
            setImagePreview(previewUrl);
            await processOcrOnBlob(frameBlob, barcode);
          }
        }
      } catch (err) {
        console.debug('Frame scan debug:', err);
      } finally {
        isScanningFrameRef.current = false;
      }
    }, 180);

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [isCameraActive, mode, isProcessingOcr, imagePreview, stopCameraStream]);

  // Tombol Shutter Manual (Jepret Manual dari Live Camera jika barcode rusak/kotor)
  const handleManualSnap = async () => {
    if (!videoRef.current) return;
    playScannerBeep();
    triggerHapticFeedback();

    const frameBlob = await captureCurrentFrameBlob();
    stopCameraStream();

    if (frameBlob) {
      const previewUrl = URL.createObjectURL(frameBlob);
      setImagePreview(previewUrl);

      // Cek apakah ada barcode di frame yang dijepret
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.src = previewUrl;
      await new Promise((r) => (img.onload = r));
      canvas.width = img.naturalWidth || 1280;
      canvas.height = img.naturalHeight || 720;
      const ctx = canvas.getContext('2d');
      let barcode: string | null = null;
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        barcode = await decodeBarcodeFromCanvasOrVideo(canvas);
        if (barcode) {
          setDetectedBarcode(barcode);
          setTrackingNumber(barcode);
        }
      }

      await processOcrOnBlob(frameBlob, barcode);
    }
  };

  // Toggle Senter / Flash HP
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !isTorchOn }],
      });
      setIsTorchOn(!isTorchOn);
    } catch (e) {
      console.warn('Torch constraint error:', e);
    }
  };

  // Balik Kamera (Depan / Belakang)
  const handleFlipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
  };

  // Handle Upload Foto / File dari Galeri
  const handleImageUpload = async (file: File) => {
    try {
      setIsProcessingOcr(true);
      setOcrProgress(15);

      // 1. Pindai Barcode / QR Code & Auto-crop label putih
      const { processedBlob, previewUrl, decodedCode } = await preprocessAndScanResiImage(file);
      setImagePreview(previewUrl);
      if (decodedCode) {
        playScannerBeep();
        triggerHapticFeedback();
        setDetectedBarcode(decodedCode);
        setTrackingNumber(decodedCode);
      }
      setOcrProgress(40);

      // 2. OCR Tesseract
      await processOcrOnBlob(processedBlob, decodedCode);
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
    stopCameraStream();
    setImagePreview(null);
    setDetectedBarcode(null);
    setTrackingNumber('');
    setRecipientName('');
    setRecipientPhone('');
    setFullAddress('');
    setAreaOrStreet('');
    setBenchmark('');
    setIsCod(false);
    setCodAmount(0);
  };

  const handleRetakeScan = () => {
    setImagePreview(null);
    setDetectedBarcode(null);
    if (mode === 'live') {
      startCameraStream(facingMode);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto font-aspekta">
      <div className="bg-[#fafafa] rounded-[32px] w-full max-w-lg shadow-deep border border-[#e4e4e7] overflow-hidden my-auto max-h-[95vh] flex flex-col text-[#222222]">
        
        {/* Header Modal */}
        <div className="px-6 py-4 bg-white border-b border-[#e4e4e7] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-bold text-lg text-[#080808] tracking-tight">
                Scan Resi J&T (Dual-Stage)
              </h2>
            </div>
            <p className="text-xs text-[#696969]">Barcode Code 128 Instan & On-Device OCR</p>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-[#f4f4f5] text-[#696969] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* 3-Pill Mode Switcher */}
          <div className="flex bg-[#f4f4f5] p-1 rounded-full text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setImagePreview(null);
                setMode('live');
              }}
              className={`flex-1 py-2 px-2 rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'live' ? 'bg-[#292929] text-white shadow-sm' : 'text-[#696969] hover:text-black'
              }`}
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>Live Scanner</span>
            </button>
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                setMode('upload');
              }}
              className={`flex-1 py-2 px-2 rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'upload' ? 'bg-[#292929] text-white shadow-sm' : 'text-[#696969] hover:text-black'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Foto / Galeri</span>
            </button>
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                setMode('manual');
              }}
              className={`flex-1 py-2 px-2 rounded-full transition cursor-pointer ${
                mode === 'manual' ? 'bg-[#292929] text-white shadow-sm' : 'text-[#696969] hover:text-black'
              }`}
            >
              Ketik Manual
            </button>
          </div>

          {/* MODE 1: LIVE SCANNER KAMERA (VIEWFINDER + LASER OVERLAY) */}
          {mode === 'live' && !imagePreview && (
            <div className="relative rounded-[28px] overflow-hidden bg-black border border-neutral-800 shadow-md aspect-4/3 flex flex-col items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target & Corner Brackets */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                <div className="w-[82%] h-[68%] relative border-2 border-dashed border-emerald-400/70 rounded-2xl flex flex-col items-center justify-between p-2 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                  {/* Pojok Sudut Tegas (Reticle Brackets) */}
                  <span className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg" />
                  <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg" />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-emerald-400 rounded-br-lg" />

                  {/* Garis Laser Pemindai Animasi */}
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#10b981] animate-bounce top-1/2" />

                  {/* Petunjuk Arah */}
                  <div className="bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium px-3 py-1 rounded-full border border-white/10 mt-1">
                    Arahkan Barcode Resi ke Dalam Kotak
                  </div>

                  <div className="bg-black/60 backdrop-blur-xs text-emerald-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 mb-1">
                    ⚡ Auto-Detect Code 128 / QR
                  </div>
                </div>
              </div>

              {/* Tombol Kontrol Kamera di Atas Video */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {hasTorchCapability && (
                  <button
                    type="button"
                    onClick={handleToggleTorch}
                    className={`p-2.5 rounded-full backdrop-blur-md transition cursor-pointer ${
                      isTorchOn
                        ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/40'
                        : 'bg-black/50 text-white border border-white/20 hover:bg-black/70'
                    }`}
                    title={isTorchOn ? 'Matikan Senter' : 'Nyalakan Senter'}
                  >
                    <Zap className="w-4 h-4 fill-current" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleFlipCamera}
                  className="p-2.5 rounded-full bg-black/50 text-white border border-white/20 hover:bg-black/70 backdrop-blur-md transition cursor-pointer"
                  title="Balik Kamera"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Tombol Shutter Manual (Bawah Video) */}
              <div className="absolute bottom-3 inset-x-0 flex justify-center items-center gap-3 px-4">
                <button
                  type="button"
                  onClick={handleManualSnap}
                  className="bg-white/90 hover:bg-white text-black text-xs font-bold py-2.5 px-5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 transition active:scale-95 cursor-pointer border border-white"
                >
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Jepret & Baca Teks</span>
                </button>
              </div>

              {/* Pesan Error Jika Kamera Tidak Diizinkan */}
              {cameraError && (
                <div className="absolute inset-0 bg-black/90 p-5 flex flex-col items-center justify-center text-center text-white space-y-3">
                  <p className="text-xs text-red-400 max-w-xs">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => startCameraStream(facingMode)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-full cursor-pointer transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Lagi</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: UPLOAD FOTO DARI GALERI ATAU JIKALAU LIVE SCANNER SELESAI */}
          {mode === 'upload' && !imagePreview && (
            <div className="border border-[#e4e4e7] rounded-[24px] p-6 text-center bg-white space-y-3 shadow-subtle">
              <p className="text-xs text-[#696969]">
                Pilih foto resi paket J&T dari galeri atau kamera HP Anda
              </p>
              <div className="flex items-center justify-center gap-2">
                <label className="bg-[#292929] hover:bg-[#080808] text-[#fafafa] font-medium text-xs px-5 py-2.5 rounded-full cursor-pointer transition shadow-sm">
                  <span>Buka Kamera File</span>
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
                  <span>Pilih File Galeri</span>
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

          {/* HASIL FOTO YANG SUDAH DITANGKAP (IMAGE PREVIEW & OCR PROGRESS) */}
          {imagePreview && (
            <div className="border border-[#e4e4e7] rounded-[24px] p-4 bg-white space-y-3 shadow-subtle">
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Pratinjau Resi"
                  className="max-h-48 mx-auto rounded-[18px] object-contain border border-[#e4e4e7] shadow-inner"
                />
                <button
                  type="button"
                  onClick={handleRetakeScan}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-md transition flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Scan Ulang</span>
                </button>
              </div>

              {detectedBarcode && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-950 font-medium">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Barcode Terkunci (Code 128):</span>
                  </div>
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                    {detectedBarcode}
                  </span>
                </div>
              )}

              {isProcessingOcr && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#080808]">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>Membaca Tulisan Resi via OCR...</span>
                    </span>
                    <span className="font-mono text-emerald-700">{ocrProgress}%</span>
                  </div>
                  <div className="w-full bg-[#f4f4f5] h-2 rounded-full overflow-hidden border border-[#e4e4e7]">
                    <div
                      className="bg-emerald-600 h-full transition-all duration-300"
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Data Hasil Scan (Bisa Dikoreksi Kurir Sebelum Simpan) */}
          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold text-[#696969] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Data Paket Terisi Otomatis
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#696969] mb-1 font-semibold">Nomor Resi:</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Misal: JX1234567890"
                  className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-3.5 py-2 text-[#080808] font-mono focus:outline-none focus:border-[#292929]"
                />
              </div>

              <div>
                <label className="block text-[#696969] mb-1 font-semibold">Nama Penerima:</label>
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
              <label className="block text-[#696969] mb-1 font-semibold">No. HP / WhatsApp:</label>
              <input
                type="text"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-3.5 py-2 text-[#080808] font-mono focus:outline-none focus:border-[#292929]"
              />
            </div>

            <div>
              <label className="block text-[#696969] mb-1 font-semibold">Alamat Lengkap:</label>
              <textarea
                rows={2}
                value={fullAddress}
                onChange={(e) => {
                  setFullAddress(e.target.value);
                  if (!areaOrStreet) setAreaOrStreet(e.target.value.slice(0, 30));
                }}
                placeholder="Jl. Mawar No. 10, Dusun Mayar Branta..."
                className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-[16px] px-3.5 py-2 text-[#080808] focus:outline-none focus:border-[#292929]"
              />
            </div>

            <div>
              <label className="block text-[#696969] mb-1 font-semibold">Patokan Alamat (Ciri Rumah):</label>
              <input
                type="text"
                value={benchmark}
                onChange={(e) => setBenchmark(e.target.value)}
                placeholder="Pagar hitam / samping warung Bu Joko"
                className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-3.5 py-2 text-[#080808] focus:outline-none focus:border-[#292929]"
              />
            </div>

            {/* COD & Tagihan */}
            <div className="bg-[#f4f4f5] p-3.5 rounded-[20px] border border-[#e4e4e7] space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCod}
                  onChange={(e) => setIsCod(e.target.checked)}
                  className="w-4 h-4 rounded text-[#292929] focus:ring-[#292929]"
                />
                <span className="text-xs font-semibold text-[#080808]">Paket COD (Bayar di Tempat)</span>
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
                    className="w-full bg-white border border-[#e4e4e7] rounded-full px-3.5 py-2 text-[#080808] font-mono focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Tombol Aksi Bawah */}
            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  onClose();
                }}
                className="flex-1 py-3 rounded-full bg-[#f4f4f5] text-[#222222] font-semibold transition cursor-pointer border border-[#e4e4e7]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving || isProcessingOcr}
                className="flex-2 py-3 rounded-full bg-[#292929] hover:bg-[#080808] text-[#fafafa] font-bold transition cursor-pointer shadow-md disabled:opacity-50"
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
