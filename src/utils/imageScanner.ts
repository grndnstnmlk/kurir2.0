import jsQR from 'jsqr';
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
} from '@zxing/library';

export interface PreprocessScanResult {
  processedBlob: Blob;
  previewUrl: string;
  decodedCode: string | null;
}

/**
 * Suara "Beep" pemindai resi khas scanner genggam J&T
 * Menggunakan Web Audio API sintetis (0 KB file eksternal, instan & bebas delay)
 */
export function playScannerBeep(): void {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (err) {
    console.debug('AudioContext not allowed or not ready:', err);
  }
}

/**
 * Getaran haptic feedback ponsel saat barcode resi berhasil dikunci
 */
export function triggerHapticFeedback(): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([40, 30, 40]);
    }
  } catch {
    // Abaikan jika tidak didukung
  }
}

/**
 * Memuat File/Blob gambar ke elemen HTMLImageElement
 */
function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

/**
 * Pindai Barcode (1D Code 128 / Code 39 / EAN 13) dan QR Code
 * Mendukung input HTMLCanvasElement maupun HTMLVideoElement (Live Camera Stream)
 * 1. BarcodeDetector Native (GPU accelerated di Android Chrome & Desktop)
 * 2. @zxing/library MultiFormatReader (Code 128 resi J&T / Shopee / TikTok)
 * 3. jsQR fallback
 */
export async function decodeBarcodeFromCanvasOrVideo(
  source: HTMLCanvasElement | HTMLVideoElement
): Promise<string | null> {
  // 1. Coba BarcodeDetector native (Chrome Android & desktop Chrome)
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['code_128', 'code_39', 'qr_code', 'ean_13', 'itf'],
      });
      const barcodes = await barcodeDetector.detect(source);
      if (barcodes && barcodes.length > 0) {
        for (const b of barcodes) {
          const val = b.rawValue?.trim();
          if (val && val.length >= 6) {
            return val;
          }
        }
      }
    } catch {
      // Fallback ke ZXing jika BarcodeDetector gagal
    }
  }

  // 2. Gunakan @zxing/library MultiFormatReader untuk barcode 1D (Code 128) dan QR Code
  try {
    let canvas: HTMLCanvasElement;
    if (source instanceof HTMLVideoElement) {
      canvas = document.createElement('canvas');
      canvas.width = source.videoWidth || 640;
      canvas.height = source.videoHeight || 480;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      }
    } else {
      canvas = source;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx && canvas.width > 0 && canvas.height > 0) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const luminances = new Uint8ClampedArray(canvas.width * canvas.height);
      const d = imgData.data;
      for (let i = 0; i < luminances.length; i++) {
        // Luminance approximation (fast integer math)
        luminances[i] = ((d[i * 4] * 3 + d[i * 4 + 1] * 4 + d[i * 4 + 2]) >> 3) | 0;
      }

      const lumSource = new RGBLuminanceSource(luminances, canvas.width, canvas.height);
      const bitmap = new BinaryBitmap(new HybridBinarizer(lumSource));
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.CODE_39,
        BarcodeFormat.EAN_13,
      ]);

      const reader = new MultiFormatReader();
      reader.setHints(hints);
      const res = reader.decode(bitmap);
      if (res && res.getText() && res.getText().trim().length >= 6) {
        return res.getText().trim();
      }
    }
  } catch {
    // Bukan barcode/QR atau belum fokus, lanjut ke jsQR
  }

  // 3. Fallback ke jsQR jika format QR Code
  try {
    let canvas: HTMLCanvasElement;
    if (source instanceof HTMLVideoElement) {
      canvas = document.createElement('canvas');
      canvas.width = source.videoWidth || 640;
      canvas.height = source.videoHeight || 480;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    } else {
      canvas = source;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx && canvas.width > 0 && canvas.height > 0) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (code && code.data && code.data.trim().length >= 6) {
        return code.data.trim();
      }
    }
  } catch (err) {
    console.debug('jsQR scan debug:', err);
  }

  return null;
}

/**
 * Pindai QR Code atau Barcode menggunakan decodeBarcodeFromCanvasOrVideo
 */
async function scanBarcodeOrQr(
  _ctx: CanvasRenderingContext2D,
  _width: number,
  _height: number,
  canvas: HTMLCanvasElement
): Promise<string | null> {
  return decodeBarcodeFromCanvasOrVideo(canvas);
}

/**
 * Deteksi kotak label putih (thermal paper) yang menempel di atas plastik/paket hitam/abu-abu
 * Memotong background hitam berkerut agar OCR Tesseract lebih fokus dan 3x lebih akurat
 */
function findWhiteLabelBoundingBox(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { x: number; y: number; w: number; h: number } | null {
  try {
    // Sampel grid resolusi rendah untuk kecepatan pemindaian
    const step = Math.max(4, Math.floor(width / 300));
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    let brightPixelCount = 0;

    const threshold = 140; // Kecerahan kertas putih

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        // Luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (lum > threshold) {
          brightPixelCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const totalSampled = (height / step) * (width / step);
    const brightRatio = brightPixelCount / totalSampled;

    // Jika label putih mengisi antara 15% s/d 90% layar, crop area label tersebut
    if (brightRatio > 0.12 && brightRatio < 0.95 && maxX > minX && maxY > minY) {
      const pad = Math.floor(width * 0.02); // 2% padding
      const x = Math.max(0, minX - pad);
      const y = Math.max(0, minY - pad);
      const w = Math.min(width - x, maxX - minX + pad * 2);
      const h = Math.min(height - y, maxY - minY + pad * 2);

      if (w > width * 0.3 && h > height * 0.3) {
        return { x, y, w, h };
      }
    }
  } catch (err) {
    console.warn('Auto-crop detection warning:', err);
  }

  return null;
}

/**
 * Memproses gambar resi:
 * 1. Decode Barcode/QR Code (No. Resi langsung didapat tanpa salah baca OCR)
 * 2. Auto-crop kertas resi putih dari background plastik gelap
 * 3. Menghasilkan Blob optimal untuk OCR Tesseract
 */
export async function preprocessAndScanResiImage(file: File): Promise<PreprocessScanResult> {
  const img = await loadImage(file);

  // Batasi ukuran canvas maksimal 1800px agar memori HP efisien dan proses OCR gesit
  const maxDim = 1800;
  let targetW = img.naturalWidth || img.width;
  let targetH = img.naturalHeight || img.height;

  if (targetW > maxDim || targetH > maxDim) {
    if (targetW > targetH) {
      targetH = Math.round((targetH * maxDim) / targetW);
      targetW = maxDim;
    } else {
      targetW = Math.round((targetW * maxDim) / targetH);
      targetH = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    return {
      processedBlob: file,
      previewUrl: URL.createObjectURL(file),
      decodedCode: null,
    };
  }

  ctx.drawImage(img, 0, 0, targetW, targetH);

  // 1. Pindai QR / Barcode pada gambar penuh
  let decodedCode = await scanBarcodeOrQr(ctx, targetW, targetH, canvas);

  // 2. Deteksi kertas label putih
  const labelBox = findWhiteLabelBoundingBox(ctx, targetW, targetH);

  let finalCanvas = canvas;

  if (labelBox) {
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = labelBox.w;
    cropCanvas.height = labelBox.h;
    const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true });

    if (cropCtx) {
      cropCtx.drawImage(
        canvas,
        labelBox.x,
        labelBox.y,
        labelBox.w,
        labelBox.h,
        0,
        0,
        labelBox.w,
        labelBox.h
      );

      finalCanvas = cropCanvas;

      // Jika pada gambar penuh belum ketemu QR code, coba scan ulang di area cropped
      if (!decodedCode) {
        decodedCode = await scanBarcodeOrQr(cropCtx, labelBox.w, labelBox.h, cropCanvas);
      }
    }
  }

  // Konversi hasil olahan ke Blob JPEG berkualitas tinggi
  const processedBlob = await new Promise<Blob>((resolve) => {
    finalCanvas.toBlob(
      (blob) => {
        resolve(blob || file);
      },
      'image/jpeg',
      0.92
    );
  });

  const previewUrl = URL.createObjectURL(processedBlob);

  return {
    processedBlob,
    previewUrl,
    decodedCode,
  };
}
