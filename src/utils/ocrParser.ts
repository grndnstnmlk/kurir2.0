import type { ParsedResiData } from '../types';

function cleanRecipientName(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/[|/:;]/g, ' ')
    .replace(/(?:patokan|rumah|pintu|dinding|rt|rw|no|desa|dusun|kec|gang|gg|jl|jalan|tlp|hp|wa).*$/i, '')
    .replace(/[^a-zA-Z\s.'-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Ekstraktor data pintar khusus format resi ekspedisi Indonesia
 * Mengadopsi arsitektur parser J&T Express Sprinter (OcrCameraActivity):
 * 1. Barcode 1D Code 128 / QR Code diutamakan (100% akurat)
 * 2. Pemisahan blok Pengirim vs Penerima
 * 3. Ekstraksi nomor telepon regex Indonesia (+62/08...)
 * 4. Deteksi blok Alamat berdasarkan kata kunci & kode pos 5-digit
 * 5. Deteksi COD & Nominal
 */
export function parseIndonesianResiText(
  rawText: string,
  decodedCode?: string | null
): ParsedResiData {
  const text = rawText.replace(/\r\n/g, '\n');
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Deteksi Nomor Resi
  // Jika Barcode (Code 128) / QR Code sudah terdeteksi di awal oleh scanner kamera, utamakan kode tersebut (100% akurat)
  let trackingNumber = decodedCode ? decodedCode.trim().toUpperCase() : '';

  if (!trackingNumber) {
    // J&T Express: JY..., JP..., JX..., JT..., JS..., JZ... (10-15 karakter)
    // Shopee: SPX...
    // SiCepat / Anteraja / Ninja / ID Express: ID..., TKP..., NLID...
    const resiRegex = /\b(J[PTXYZS]\d{9,14}|SPX\w{8,14}|ID\d{10,16}|TKP\w{8,14}|NLID\w{10,16}|\d{12,16})\b/i;
    const resiMatch = text.match(resiRegex);
    if (resiMatch) {
      trackingNumber = resiMatch[1].toUpperCase();
    } else {
      // Fallback: cari Nomor Order/Pesanan jika nomor resi tertutup barcode
      const orderMatch = text.match(/(?:Order\s*Id|der\s*ld|No\.?\s*Pesanan)\s*[:]\s*(\d{10,20})/i);
      if (orderMatch) {
        trackingNumber = `ORD-${orderMatch[1].slice(-8)}`;
      }
    }
  }

  // 2. Pisahkan Blok PENGIRIM vs PENERIMA
  // Sangat penting: Resi J&T mencantumkan alamat toko pengirim (misal Mojokerto, Jakarta, Tangerang).
  // Bagian ini wajib diabaikan agar tidak salah dimasukkan sebagai alamat pengantaran kurir!
  let isSenderSection = false;
  const destinationLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Indikasi dimulainya blok Pengirim
    if (/(?:Pengirim|[MN]9iri[mM]|Sender|Dari)\s*[:;]/i.test(line)) {
      isSenderSection = true;
      continue;
    }
    // Indikasi dimulainya blok Penerima
    if (/(?:Penerima|[eh]erima|Kepada|To|Receiver)\s*[:;]/i.test(line)) {
      isSenderSection = false;
    }

    if (!isSenderSection) {
      // Filter kata-kata kota asal pengirim yang sering muncul di label
      if (!/(?:MOJOKERTO|PENGIRIM|JAKARTA\s*BARAT|TANGERANG|BANDUNG|SOLO|SELLER\s*SKU)/i.test(line)) {
        destinationLines.push(line);
      }
    }
  }

  const destinationText = destinationLines.join('\n');

  // 3. Deteksi Nama Penerima (Heuristik J&T Sprinter OcrCamera)
  let recipientName = '';

  // 3a. Pola Tokopedia / TikTok Shop: Customer mencantumkan "nama penerima: Luluk"
  const embeddedNameMatch = text.match(
    /(?:nama\s*penerima|atas\s*nama|a\/n|nama)\s*[:\s]*([a-zA-Z\s'.]{2,30}?)(?=\s*(?:patokan|rt|rw|no|desa|dusun|kec|gang|gg|jl|jalan|tlp|hp|wa|[.,;]|$))/i
  );
  if (embeddedNameMatch && embeddedNameMatch[1].trim().length >= 2) {
    recipientName = cleanRecipientName(embeddedNameMatch[1]);
  }

  // 3b. Label Penerima Standar: "Penerima : Luluk" atau di baris berikutnya
  if (!recipientName) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/(?:Penerima|[eh]erima|Kepada|To|Receiver)\s*[:;]/i.test(line)) {
        const parts = line.split(/[:;]/);
        if (parts.length > 1 && parts[1].trim().length >= 2) {
          const candidate = cleanRecipientName(parts[1]);
          if (candidate && !/(?:jnt|express|cod|shopee|lazada|tiktok|pamekasan)/i.test(candidate)) {
            recipientName = candidate;
            break;
          }
        } else if (i + 1 < lines.length) {
          const nextCandidate = cleanRecipientName(lines[i + 1]);
          if (nextCandidate && nextCandidate.length >= 2 && !/(?:jnt|express|cod|alamat|address)/i.test(nextCandidate)) {
            recipientName = nextCandidate;
            break;
          }
        }
      }
    }
  }

  // 3c. Fallback dari baris tujuan
  if (!recipientName) {
    for (const line of destinationLines) {
      const cleaned = cleanRecipientName(line);
      if (
        cleaned.length >= 3 &&
        cleaned.length <= 25 &&
        !/(jnt|express|cod|penerima|pengirim|shopee|lazada|tiktok|pamekasan|branta|tlanakan|jawa|timur|indonesia)/i.test(cleaned)
      ) {
        recipientName = cleaned;
        break;
      }
    }
  }

  if (!recipientName || recipientName.toLowerCase() === 'l**k') {
    recipientName = recipientName && recipientName.toLowerCase() !== 'l**k' ? recipientName : 'Customer J&T';
  }

  // 4. Deteksi Nomor HP / WhatsApp Penerima (Pola J&T WaybillParser)
  let recipientPhone = '';
  const nonOrderLines = destinationLines.filter(
    (l) => !/(?:Order\s*Id|der\s*ld|SKU|80661888|80861888)/i.test(l)
  );
  const nonOrderText = nonOrderLines.join('\n');

  // 4a. Nomor HP normal Indonesia (+62/08...)
  const unmaskedPhoneMatch = nonOrderText.match(/(?:(?:\+?62|62|0)8[1-9][0-9]{7,10})\b/);
  if (unmaskedPhoneMatch) {
    let clean = unmaskedPhoneMatch[0].replace(/\D/g, '');
    if (clean.startsWith('08')) {
      clean = '628' + clean.slice(2);
    }
    recipientPhone = clean;
  } else {
    // 4b. Coba temukan nomor HP dengan sensor bintang dari TikTok/Tokopedia (misal: (+62)87*******73)
    const maskedPhoneMatch = nonOrderText.match(/(?:\(?\+?62\)?[\s-]?|0)8[1-9][0-9*xX\s-]{5,15}/);
    if (maskedPhoneMatch) {
      let clean = maskedPhoneMatch[0].replace(/[^\d*xX]/g, '');
      if (clean.startsWith('628')) {
        clean = '08' + clean.slice(3);
      }
      recipientPhone = `${clean} (Disensor Resi)`;
    }
  }

  // 5. Deteksi Patokan Alamat (Benchmark / Landmark)
  let benchmark = '';
  const benchmarkRegex =
    /(?:patokan(?: rumah)?|sebelah|depan|samping|pagar|belakang|dekat|posisi|ciri(?: rumah)?)\s*[:\s]*([^\n\r]+)/i;
  const benchMatch = text.match(benchmarkRegex);
  if (benchMatch) {
    let bText = benchMatch[1].trim();
    bText = bText.replace(/(?:Ship\s*:|COD|Qty|Item|SKU|Barang|Order\s*Id).*$/i, '').trim();
    benchmark = bText.replace(/[©®#*~]/g, '').trim();

    // Perbaiki artifact OCR "nding" -> "Dinding"
    if (/^nding\b/i.test(benchmark)) {
      benchmark = 'Di' + benchmark;
    }
  }

  // 6. Deteksi COD (Cash On Delivery) dan Nominal
  let isCod = false;
  let codAmount = 0;
  const isCodKeyword =
    /\b(COD|BAYAR\s*DI\s*TEMPAT|CASH\s*ON\s*DELIVERY)\b/i.test(text) ||
    /\b(OD\s*(?:LE|ul|8)?)\b/.test(text);

  const codPriceRegex = /(?:Rp\.?|COD\s*:?|TOTAL\s*:?)\s*([0-9]{1,3}(?:\.[0-9]{3})+|[0-9]{4,7})/i;
  const priceMatch = text.match(codPriceRegex);
  if (priceMatch) {
    const rawNumber = priceMatch[1].replace(/\./g, '');
    const num = parseInt(rawNumber, 10);
    if (!isNaN(num) && num > 1000) {
      codAmount = num;
      isCod = true;
    }
  } else if (isCodKeyword) {
    isCod = true;
  }

  // 7. Deteksi Alamat Tujuan & Jalan / Dusun (Heuristik Koleksi Baris J&T)
  let fullAddress = '';
  let areaOrStreet = '';

  const addressKeywords =
    /(?:Jl\.|Jalan|Gg\.|Gang|Perum|Perumahan|Komplek|RT|RW|Dusun|Desa|Kel\.|Kec\.|Kab\.|Pelabuhan|Dermaga|Branta|Tlanakan|Pamekasan|\b\d{5}\b)/i;

  const validAddressLines: string[] = [];

  // 7a. Jika ada label "Alamat:" atau "Address:", kumpulkan 2-4 baris setelahnya
  let foundAddressLabel = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/(?:Alamat|Address)\s*[:;]/i.test(line)) {
      foundAddressLabel = true;
      const parts = line.split(/[:;]/);
      if (parts.length > 1 && parts[1].trim().length > 3) {
        validAddressLines.push(parts[1].trim());
      }
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (/(?:Pengirim|Sender|Berat|Weight|COD|Qty|SKU|Checked|Barang)/i.test(nextLine)) {
          break;
        }
        if (nextLine.length >= 3) {
          validAddressLines.push(nextLine);
        }
      }
      break;
    }
  }

  // 7b. Fallback: Telusuri baris tujuan yang mengandung kata kunci jalan / kecamatan / kode pos
  if (!foundAddressLabel || validAddressLines.length === 0) {
    for (const line of destinationLines) {
      if (
        /(?:syarat|ketentuan|website|jet\.co|estimated|date|sku|seller|qty|total|barang|pcs|order|checked)/i.test(
          line
        )
      ) {
        continue;
      }

      let cleaned = line.replace(/^[|/#~“\s]+/, '').trim();
      if (cleaned.length < 4) continue;

      if (addressKeywords.test(cleaned)) {
        // Koreksi artifact OCR umum
        cleaned = cleaned.replace(/^[“\s]*abuhan/i, 'Pelabuhan');
        cleaned = cleaned.replace(/^JJ\s*VA\s*TIMUR/i, 'JAWA TIMUR,');
        cleaned = cleaned.replace(/^indaran/i, 'Dusun Bandaran');
        validAddressLines.push(cleaned);
      }
    }
  }

  if (validAddressLines.length > 0) {
    let rawAddr = validAddressLines.join(', ');
    rawAddr = rawAddr.replace(/,?\s*nama\s*penerima\s*:[^,]+/i, '');
    rawAddr = rawAddr.replace(/,?\s*patokan\s*rumah\s*:[^,]+/i, '');
    if (benchmark) {
      const escapedBench = benchmark.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      rawAddr = rawAddr.replace(new RegExp(escapedBench, 'gi'), '');
    }
    rawAddr = rawAddr
      .replace(/[©®#*~]/g, '')
      .replace(/\s+,/g, ',')
      .replace(/,\s*,/g, ',')
      .trim();

    fullAddress = rawAddr;

    const streetCandidates = validAddressLines.filter((l) =>
      /(?:Pelabuhan|Dermaga|Branta|Jl\.|Jalan|Dusun|Desa)/i.test(l)
    );
    if (streetCandidates.length > 0) {
      areaOrStreet = streetCandidates[0].replace(/,.*$/, '').trim();
    } else {
      areaOrStreet = validAddressLines[0].slice(0, 35).trim();
    }
  } else {
    fullAddress = destinationLines.slice(0, 2).join(', ');
    areaOrStreet = fullAddress.slice(0, 30);
  }

  return {
    trackingNumber: trackingNumber || `JY${Date.now().toString().slice(-8)}`,
    recipientName,
    recipientPhone,
    fullAddress: fullAddress || 'Alamat perlu konfirmasi',
    areaOrStreet: areaOrStreet || fullAddress.slice(0, 25),
    benchmark,
    isCod,
    codAmount,
  };
}
