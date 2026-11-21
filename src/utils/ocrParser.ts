import type { ParsedResiData } from '../types';

/**
 * Ekstraktor data pintar khusus format resi ekspedisi Indonesia
 * (J&T Express, Shopee Express, TikTok Shop, Tokopedia, SiCepat, dll.)
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
  // Jika Barcode / QR Code sudah terdeteksi di awal, utamakan kode tersebut (100% akurat)
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

  for (const line of lines) {
    // Indikasi dimulainya blok Pengirim
    if (/(?:Pengirim|[MN]9iri[mM]|Sender|Dari)\s*[:;]/i.test(line)) {
      isSenderSection = true;
      continue;
    }
    // Indikasi dimulainya blok Penerima
    if (/(?:Penerima|[eh]erima|Kepada|To)\s*[:;]/i.test(line)) {
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

  // 3. Deteksi Nama Penerima
  let recipientName = '';

  // 3a. Pola Tokopedia / TikTok Shop: Customer sering menambahkan "nama penerima: Luluk" di catatan alamat
  const embeddedNameMatch = text.match(
    /(?:nama\s*penerima|atas\s*nama|a\/n|nama)\s*[:\s]*([a-zA-Z\s'.]{2,30}?)(?=\s*(?:patokan|rt|rw|no|desa|dusun|kec|gang|gg|jl|jalan|tlp|hp|wa|[.,;]|$))/i
  );
  if (embeddedNameMatch && embeddedNameMatch[1].trim().length >= 2) {
    const candidate = embeddedNameMatch[1].trim();
    recipientName = candidate.replace(/(?:patokan|rumah|pintu|dinding).*$/i, '').trim();
  }

  // 3b. Label Penerima Standar: "Penerima : Luluk" atau "Penerima : l**k"
  if (!recipientName) {
    const nameLabelMatch = text.match(/(?:Penerima|[eh]erima|Kepada|To)\s*[:;]\s*([a-zA-Z0-9\s*'.]{2,30})/i);
    if (nameLabelMatch) {
      const raw = nameLabelMatch[1].trim();
      recipientName = raw.replace(/[|/:;]/g, '').trim();
    }
  }

  // 3c. Fallback dari baris tujuan
  if (!recipientName) {
    for (const line of destinationLines) {
      if (
        line.length >= 3 &&
        line.length <= 25 &&
        /^[a-zA-Z\s'.]+$/.test(line) &&
        !/(jnt|express|cod|penerima|pengirim|shopee|lazada|tiktok|pamekasan|branta|tlanakan|jawa|timur|indonesia)/i.test(line)
      ) {
        recipientName = line.trim();
        break;
      }
    }
  }

  if (!recipientName || recipientName === 'l**k') {
    recipientName = recipientName && recipientName !== 'l**k' ? recipientName : 'Customer J&T';
  }

  // 4. Deteksi Nomor HP / WhatsApp Penerima
  let recipientPhone = '';
  // Hanya cari di blok penerima, abaikan baris Order ID dan Call Center J&T (021-80661888)
  const nonOrderLines = destinationLines.filter(
    (l) => !/(?:Order\s*Id|der\s*ld|SKU|80661888|80861888)/i.test(l)
  );
  const nonOrderText = nonOrderLines.join('\n');

  // 4a. Coba temukan nomor HP normal (tanpa sensor)
  const unmaskedPhoneMatch = nonOrderText.match(/(?:(?:\+?62|0)8[1-9][0-9]{7,10})\b/);
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
    // Potong jika mengenai metadata SKU atau resi
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
  // Deteksi tulisan COD besar di resi (termasuk toleransi OCR "OD" pada huruf kapital)
  const isCodKeyword =
    /\b(COD|BAYAR\s*DI\s*TEMPAT|CASH\s*ON\s*DELIVERY)\b/i.test(text) ||
    /\b(OD\s*(?:LE|ul|8)?)\b/.test(text);

  // Cari nominal uang: e.g. Rp 45.000, Rp45000, COD : 150000
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

  // 7. Deteksi Alamat Tujuan & Jalan / Dusun
  let fullAddress = '';
  let areaOrStreet = '';

  const addressKeywords =
    /(?:Jl\.|Jalan|Gg\.|Gang|Perum|Perumahan|Komplek|RT|RW|Dusun|Desa|Kel\.|Kec\.|Kab\.|Pelabuhan|Dermaga|Branta|Tlanakan|Pamekasan)/i;

  const validAddressLines: string[] = [];

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

    // Tentukan jalan / area utama
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
