import jsQR from 'jsqr';

export interface PreprocessScanResult {
  processedBlob: Blob;
  previewUrl: string;
  decodedCode: string | null;
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
 * Pindai QR Code atau Barcode menggunakan BarcodeDetector native (jika didukung) atau jsQR
 */
async function scanBarcodeOrQr(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  canvas: HTMLCanvasElement
): Promise<string | null> {
  // 1. Coba BarcodeDetector native (tersedia di Android Chrome & desktop Chrome)
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'itf'],
      });
      const barcodes = await barcodeDetector.detect(canvas);
      if (barcodes && barcodes.length > 0) {
        for (const b of barcodes) {
          const val = b.rawValue?.trim();
          if (val && val.length >= 6) {
            return val;
          }
        }
      }
    } catch {
      // Fallback ke jsQR jika BarcodeDetector gagal atau format tidak diizinkan
    }
  }

  // 2. Gunakan jsQR (andal & cepat untuk QR code resi J&T)
  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    const code = jsQR(imageData.data, width, height, {
      inversionAttempts: 'attemptBoth',
    });
    if (code && code.data && code.data.trim().length >= 6) {
      return code.data.trim();
    }
  } catch (err) {
    console.warn('jsQR scan error:', err);
  }

  return null;
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
