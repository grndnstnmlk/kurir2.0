const fs = require('fs');
const path = require('path');

const ocrFile = path.join(__dirname, '..', 'screenshot alamat paket', 'ocr_raw_27_nov.json');
if (!fs.existsSync(ocrFile)) {
  console.error(`OCR file not found: ${ocrFile}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(ocrFile, 'utf-8'));

// 1. Extract Cards per-waybill segment cleanly (handles Total 2/3/N item properly!)
const cardsMap = new Map(); // key: resi -> card object

raw.forEach(r => {
  if (!r.text) return;
  const text = r.text;
  const isCard = /Total\s*\d+\s*item/i.test(text) || /\bJ[A-Z0-9]\d{8,11}\b/.test(text);
  if (!isCard) return;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Extract header info (recipient, totalItems, benchmark)
  let recipient = '';
  let benchmark = '';
  let totalItems = 1;
  for (let i = 0; i < lines.length; i++) {
    const mTotal = lines[i].match(/Total\s*(\d+)\s*item\s*(.*)/i);
    if (mTotal) {
      totalItems = parseInt(mTotal[1], 10) || 1;
      if (i > 0) {
        recipient = lines[i - 1]
          .replace(/^[<«\s\d:=rOInformasi®83]+/, '')
          .replace(/\s*[©®]+$/, '')
          .trim();
      }
      if (mTotal[2] && mTotal[2].trim()) {
        benchmark = mTotal[2].replace(/^[~©®“”"'\s§]+/, '').trim();
      } else if (i + 1 < lines.length && !/\bJ[A-Z0-9]\d{8,11}\b/.test(lines[i + 1])) {
        benchmark = lines[i + 1].replace(/^[~©®“”"'\s]+/, '').trim();
      }
      break;
    }
  }

  // Find all resi matches with their indices
  const resiRegex = /\b(J[A-Z0-9]\d{8,11})\b/g;
  const matches = [];
  let m;
  while ((m = resiRegex.exec(text)) !== null) {
    matches.push({ resi: m[1], index: m.index });
  }
  if (matches.length === 0) return;

  for (let i = 0; i < matches.length; i++) {
    const { resi, index } = matches[i];
    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const segment = text.slice(index, nextIndex);

    // Parse COD strictly within this resi segment
    let isCod = false;
    let codAmount = 0;
    let foundExplicitZero = false;

    const belumMatch = segment.match(/Belum\s*Bayar\s*([\d,.]+)/i);
    const ppPmMatch = segment.match(/PP[._\s-]*PM\s*([\d,.]+)/i);
    const cashZeroMatch = segment.match(/(?:CC_CASH|Sudah\s*Bayar|PP[._\s-]*PM)\s*0\b/i) || /^[-=.\s]*0\b/m.test(segment);

    if (belumMatch) {
      codAmount = parseInt(belumMatch[1].replace(/[,.]/g, ''), 10) || 0;
      isCod = codAmount > 0;
    } else if (ppPmMatch) {
      codAmount = parseInt(ppPmMatch[1].replace(/[,.]/g, ''), 10) || 0;
      isCod = codAmount > 0;
      if (codAmount === 0) foundExplicitZero = true;
    } else if (cashZeroMatch) {
      isCod = false;
      codAmount = 0;
      foundExplicitZero = true;
    }

    // Parse time strictly within this resi segment
    const timeMatch = segment.match(/\b(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\b/);
    const time = timeMatch ? timeMatch[1] : '';

    // Check completeness of segment (did it have timestamp or payment status?)
    const hasPaymentInfo = Boolean(belumMatch || ppPmMatch || foundExplicitZero);
    const segQuality = (hasPaymentInfo ? 2 : 0) + (time ? 2 : 0) + (recipient ? 1 : 0) + (benchmark ? 1 : 0);

    const existing = cardsMap.get(resi);
    if (!existing) {
      cardsMap.set(resi, {
        file: r.file,
        recipientName: recipient,
        trackingNumber: resi,
        isCod,
        codAmount,
        hasPaymentInfo,
        benchmark,
        time,
        totalItemsInCard: totalItems,
        quality: segQuality,
        rawSegment: segment.replace(/\n+/g, ' | '),
      });
    } else {
      // Update fields if new occurrence has better info
      if (!existing.hasPaymentInfo && hasPaymentInfo) {
        existing.isCod = isCod;
        existing.codAmount = codAmount;
        existing.hasPaymentInfo = hasPaymentInfo;
      } else if (hasPaymentInfo && !existing.isCod && isCod && codAmount > 0) {
        existing.isCod = isCod;
        existing.codAmount = codAmount;
      }
      if (!existing.time && time) existing.time = time;
      if ((!existing.recipientName || recipient.length > existing.recipientName.length) && recipient) {
        existing.recipientName = recipient;
      }
      if ((!existing.benchmark || benchmark.length > existing.benchmark.length) && benchmark) {
        existing.benchmark = benchmark;
      }
      if (totalItems > existing.totalItemsInCard) existing.totalItemsInCard = totalItems;
    }
  }
});

console.log(`Parsed ${cardsMap.size} unique cards/waybills from 27 Nov video!`);

// 2. Extract List Items
const listPackages = [];

raw.forEach(r => {
  if (!r.text) return;
  if (!/Alamat\s*Penerima/i.test(r.text)) return;

  const text = r.text;
  const regex = /(?:Waktu Delivery[^\n]*\n+)?(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+([^\n]+)\n+Alamat\s*Penerima\s*\n+([^\n]+(?:\n+[^\n]+)?)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const time = match[1].trim();
    const rawPhone = match[2].trim();
    const address = match[3].replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

    let phone = '08******0000';
    const digits = rawPhone.match(/(\d{3,12})/);
    if (digits) {
      phone = `08******${digits[1].slice(-4)}`;
    }

    const preIdx = Math.max(0, match.index - 220);
    const preSub = text.slice(preIdx, match.index);
    const lines = preSub.split('\n').map(l => l.trim()).filter(Boolean);
    let name = '';
    for (let i = lines.length - 1; i >= 0; i--) {
      const l = lines[i];
      if (
        !l.includes('Delivery') &&
        !l.includes('Filter') &&
        !l.includes('Tambah') &&
        !l.includes('keterangan') &&
        !l.includes('cop') &&
        !l.includes('COD') &&
        !l.includes('terdekat') &&
        !l.includes('QEz') &&
        l.length > 1
      ) {
        name = l.replace(/^[8coP\s+*®f]+/, '').trim();
        break;
      }
    }

    listPackages.push({
      time,
      phone,
      rawPhone,
      address,
      name,
      file: r.file
    });
  }
});

console.log(`Parsed ${listPackages.length} raw list occurrences from 27 Nov video!`);

fs.writeFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'cards_27_nov.json'), JSON.stringify(Array.from(cardsMap.values()), null, 2));
fs.writeFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'list_occurrences_27_nov.json'), JSON.stringify(listPackages, null, 2));
