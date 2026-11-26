const fs = require('fs');
const path = require('path');

const ocrFile = path.join(__dirname, '..', 'screenshot alamat paket', 'ocr_raw_26_nov.json');
if (!fs.existsSync(ocrFile)) {
  console.log(`Waiting for ${ocrFile}...`);
  process.exit(0);
}

const raw = JSON.parse(fs.readFileSync(ocrFile, 'utf-8'));

// 1. Extract Cards
const cardsMap = new Map(); // key: resi -> card object

raw.forEach(r => {
  if (!r.text) return;
  const isCard = /Total\s*\d+\s*item/i.test(r.text) || /Belum\s*Bayar/i.test(r.text) || /Sudah\s*Bayar/i.test(r.text);
  if (!isCard) return;

  const lines = r.text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Find waybill (J[A-Z0-9]\d{8,12})
  const resiMatches = r.text.match(/\b(J[A-Z0-9]\d{8,11})\b/g) || [];
  if (resiMatches.length === 0) return;

  // Find recipient name (usually 1-2 lines before "Total X item")
  let recipient = '';
  for (let i = 0; i < lines.length; i++) {
    if (/Total\s*\d+\s*item/i.test(lines[i])) {
      if (i > 0) {
        recipient = lines[i - 1].replace(/^[<«\s\d:=rOInformasi]+/, '').trim();
      }
      break;
    }
  }

  // Find COD amount
  let isCod = false;
  let codAmount = 0;
  if (/Belum\s*Bayar/i.test(r.text) || /PP_PM/i.test(r.text)) {
    isCod = true;
    const m = r.text.match(/Belum\s*Bayar\s*([\d,.]+)/i) || r.text.match(/PP_PM\s*([\d,.]+)/i);
    if (m) {
      codAmount = parseInt(m[1].replace(/[,.]/g, ''), 10);
    }
  } else if (/CC_CASH\s*0/i.test(r.text) || /Sudah\s*Bayar/i.test(r.text)) {
    isCod = false;
    codAmount = 0;
  }

  // Find Benchmark
  let benchmark = '';
  const benchMatch = r.text.match(/Total\s*\d+\s*item[^\n]*\n+([^\n]+)/i);
  if (benchMatch) {
    const candidate = benchMatch[1].trim();
    if (!candidate.startsWith('JY') && !candidate.startsWith('JD') && !candidate.startsWith('JO')) {
      benchmark = candidate;
    }
  }
  const inlineBench = r.text.match(/Total\s*\d+\s*item[:\s]*([^\n]+)/i);
  if (inlineBench && inlineBench[1].trim() && !benchmark) {
    benchmark = inlineBench[1].trim();
  }

  // Find time
  const timeMatch = r.text.match(/\b(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\b/);
  const time = timeMatch ? timeMatch[1] : '';

  resiMatches.forEach(resi => {
    if (!cardsMap.has(resi) || (codAmount > 0 && cardsMap.get(resi).codAmount === 0)) {
      cardsMap.set(resi, {
        file: r.file,
        recipientName: recipient,
        trackingNumber: resi,
        isCod,
        codAmount,
        benchmark: benchmark.replace(/[“”"']/g, '').trim(),
        time
      });
    }
  });
});

console.log(`Parsed ${cardsMap.size} unique cards from video!`);

// 2. Extract List Items
const listPackages = [];

raw.forEach(r => {
  if (!r.text) return;
  if (!r.text.includes('Alamat Penerima')) return;

  const text = r.text;
  const regex = /(?:Waktu Delivery\s+No\.\s*Hp\s*Penerima[^\n]*\n+)?(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+([^\n]+)\n+Alamat Penerima\s*\n+([^\n]+(?:\n+[^\n]+)?)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const time = match[1].trim();
    const rawPhone = match[2].trim();
    const address = match[3].replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

    // Extract phone last digits
    let phone = '08******0000';
    const digits = rawPhone.match(/(\d{3,12})/);
    if (digits) {
      phone = `08******${digits[1].slice(-4)}`;
    }

    // Try finding recipient name in preceding 200 characters
    const preIdx = Math.max(0, match.index - 200);
    const preSub = text.slice(preIdx, match.index);
    const lines = preSub.split('\n').map(l => l.trim()).filter(Boolean);
    let name = '';
    for (let i = lines.length - 1; i >= 0; i--) {
      const l = lines[i];
      if (!l.includes('Delivery') && !l.includes('Filter') && !l.includes('Tambah') && !l.includes('keterangan') && !l.includes('cop') && !l.includes('Or:') && !l.includes('QEz') && l.length > 2) {
        name = l.replace(/^[8coP\s+*]+/, '').trim();
        break;
      }
    }

    listPackages.push({
      time,
      phone,
      address,
      name,
      file: r.file
    });
  }
});

console.log(`Parsed ${listPackages.length} raw list occurrences from video!`);

// Save intermediate files
fs.writeFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'cards_26_nov.json'), JSON.stringify(Array.from(cardsMap.values()), null, 2));
fs.writeFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'list_occurrences_26_nov.json'), JSON.stringify(listPackages, null, 2));
