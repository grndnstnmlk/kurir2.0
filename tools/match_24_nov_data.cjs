const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'ocr_raw_24_nov.json'), 'utf-8'));

// 1. Parse Card Views
const cardViews = raw.filter(item => !item.text.includes('Alamat Penerima') && !item.text.includes('Waktu Delivery'));
const parsedCards = [];

cardViews.forEach((cv) => {
  const lines = cv.text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Find recipient name: usually line after "Silahkan masukan informasi"
  let recipientName = '';
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Silahkan masukan') || lines[i].includes('informasi')) {
      if (i + 1 < lines.length) {
        recipientName = lines[i + 1].replace(/^[<\s]+/, '').trim();
        break;
      }
    }
  }

  // Look for waybills
  const resiMatches = [...cv.text.matchAll(/\b(J[A-Z0-9]\d{8,12}|\d{12})\b/gi)].map(m => m[0].toUpperCase());

  // Look for delivery times (e.g., 2026-11-24 08:02:05)
  const timeMatches = [...cv.text.matchAll(/\b(2026-11-24\s+\d{2}:\d{2}:\d{2})\b/g)].map(m => m[0]);

  // Look for COD amounts (e.g., Belum Bayar 173,720 or PP_PM 173,720)
  const codMatches = [...cv.text.matchAll(/(?:Belum\s*Bayar|PP_PM)\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,7})/gi)]
    .map(m => parseInt(m[1].replace(/[.,]/g, ''), 10));

  // Determine if COD
  const isCod = /cop|cod|belum\s*bayar/i.test(cv.text);

  parsedCards.push({
    file: cv.file,
    recipientName,
    resis: [...new Set(resiMatches)],
    times: timeMatches,
    codAmounts: codMatches,
    isCod,
    rawText: cv.text
  });
});

console.log(`Parsed ${parsedCards.length} card views.`);
console.log(JSON.stringify(parsedCards.slice(0, 5), null, 2));

// Save parsed cards
fs.writeFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'parsed_cards_24_nov.json'), JSON.stringify(parsedCards, null, 2));
