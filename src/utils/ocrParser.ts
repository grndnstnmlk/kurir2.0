import type { ParsedResiData } from '../types';

/**
 * Ekstraktor data pintar khusus format resi ekspedisi Indonesia (J&T Express, Shopee, SiCepat, dll.)
 */
export function parseIndonesianResiText(rawText: string): ParsedResiData {
  const text = rawText.replace(/\r\n/g, '\n');
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Deteksi Nomor Resi (J&T biasanya JP..., JX..., JT..., atau 10-15 digit karakter)
  let trackingNumber = '';
  const resiRegex = /\b(J[PTX]\d{9,14}|SPX\w{8,14}|ID\d{10,16}|\d{12,16})\b/i;
  const resiMatch = text.match(resiRegex);
  if (resiMatch) {
    trackingNumber = resiMatch[1].toUpperCase();
  }

  // 2. Deteksi Nomor HP / WhatsApp Penerima
  let recipientPhone = '';
  const phoneRegex = /(?:\+?62|0)8[1-9][0-9]{7,10}\b/;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    let clean = phoneMatch[0].replace(/\D/g, '');
    if (clean.startsWith('08')) {
      clean = '628' + clean.slice(2);
    }
    recipientPhone = clean;
  }

  // 3. Deteksi COD (Cash On Delivery) dan Nominal
  let isCod = false;
  let codAmount = 0;
  const isCodKeyword = /\b(COD|BAYAR\s*DI\s*TEMPAT|CASH\s*ON\s*DELIVERY)\b/i.test(text);

  // Cari nominal uang: e.g. Rp 45.000, Rp45000, Rp. 150.000
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

  // 4. Deteksi Alamat Lengkap & Jalan/Wilayah Utama
  let fullAddress = '';
  let areaOrStreet = '';
  let benchmark = '';

  const addressKeywords = /(?:Jl\.|Jalan|Gg\.|Gang|Perum|Perumahan|Komplek|RT|RW|Dusun|Desa|Kel\.|Kec\.|Kab\.|Kp\.|Kampung)/i;
  const benchmarkKeywords = /(?:patokan|sebelah|depan|samping|pagar|belakang|dekat)/i;

  const addressLines: string[] = [];

  for (const line of lines) {
    if (benchmarkKeywords.test(line) && !benchmark) {
      benchmark = line.replace(/.*(?:patokan|sebelah|depan|samping|pagar|belakang|dekat)[:\s]*/i, '').trim();
    }

    if (addressKeywords.test(line)) {
      addressLines.push(line);
      if (!areaOrStreet) {
        const streetMatch = line.match(/(?:Jl\.|Jalan|Gg\.|Gang|Perum(?:ahan)?)\s*[^,\n\r.]+/i);
        if (streetMatch) {
          areaOrStreet = streetMatch[0].trim();
        } else {
          areaOrStreet = line.slice(0, 35).trim();
        }
      }
    }
  }

  if (addressLines.length > 0) {
    fullAddress = addressLines.join(', ');
  } else {
    const candidateLines = lines.filter(
      (l) => !l.includes(trackingNumber) && !l.includes(recipientPhone) && l.length > 10
    );
    fullAddress = candidateLines.slice(0, 2).join(', ');
    areaOrStreet = fullAddress.slice(0, 30);
  }

  // 5. Deteksi Nama Penerima
  let recipientName = '';
  const nameLabelMatch = text.match(/(?:Penerima|Kepada|To|Nama)\s*[:]\s*([a-zA-Z\s'.]{3,30})/i);
  if (nameLabelMatch) {
    recipientName = nameLabelMatch[1].trim();
  } else {
    for (const line of lines) {
      if (
        line.length >= 3 &&
        line.length <= 25 &&
        /^[a-zA-Z\s'.]+$/.test(line) &&
        !/(jnt|express|cod|penerima|pengirim|shopee|lazada|tiktok|jakarta|surabaya|bandung)/i.test(line)
      ) {
        recipientName = line.trim();
        break;
      }
    }
  }

  if (!recipientName) {
    recipientName = 'Customer';
  }

  return {
    trackingNumber: trackingNumber || `JP${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    recipientName,
    recipientPhone,
    fullAddress: fullAddress || 'Alamat perlu konfirmasi',
    areaOrStreet: areaOrStreet || fullAddress.slice(0, 25),
    benchmark,
    isCod,
    codAmount,
  };
}
