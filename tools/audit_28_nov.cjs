const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'ocr_raw_28_nov.json'), 'utf-8'));
const stops = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'stops_merged_28_nov.json'), 'utf-8'));
const houses = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'saved_houses_meta.json'), 'utf-8'));
const snap27 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'session_27_nov_snapshot.json'), 'utf-8'));
const snap26 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'session_26_nov_snapshot.json'), 'utf-8'));
const p25 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'packages_25_nov_verified.json'), 'utf-8'));
const prevAll = [...snap27, ...snap26, ...p25];

console.log(`=== AUDIT LENGKAP ${stops.length} STOPS / ${stops.reduce((s, st) => s + st.cards.length, 0)} PAKET ===\n`);

stops.forEach((s, idx) => {
  const matchingFrames = raw.filter(r => r.text && r.text.includes(s.time));
  const phoneCandidates = new Set();
  matchingFrames.forEach(mf => {
    const t = mf.text;
    let pos = 0;
    while ((pos = t.indexOf(s.time, pos)) !== -1) {
      const lineEnd = t.indexOf('\n', pos);
      const restOfLine = t.slice(pos + s.time.length, lineEnd === -1 ? pos + 80 : lineEnd).trim();
      const nextChunk = t.slice(pos, Math.min(t.length, pos + 100));
      if (/Alamat/i.test(nextChunk) || (restOfLine && restOfLine !== '0' && restOfLine.length >= 3)) {
        const m = restOfLine.match(/(\d{3,12})/g);
        if (m) m.forEach(d => phoneCandidates.add(d));
      }
      pos += s.time.length;
    }
  });

  const cleanNameCandidates = [s.bestName, ...s.names]
    .map(n => n.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, ' ').trim())
    .filter(n => n.length >= 3);

  const matchHouse = houses.find(h => {
    const hn = (h.recipient_name || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, ' ').trim();
    return hn.length >= 3 && cleanNameCandidates.some(cn => cn === hn || (cn.length >= 4 && (hn.includes(cn) || cn.includes(hn))));
  });

  const matchPrev = prevAll.find(p => {
    const pn = (p.recipientName || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, ' ').trim();
    return pn.length >= 3 && cleanNameCandidates.some(cn => cn === pn || (cn.length >= 4 && (pn.includes(cn) || cn.includes(pn))));
  });

  console.log(`[Stop #${idx + 1}] Time: ${s.time} | Cards: ${s.cards.length} (totalItemsInCard: ${s.cards.map(c=>c.totalItemsInCard).join(',')})`);
  console.log(`  Names: ${s.names.slice(0, 6).join(' | ')}`);
  console.log(`  ListPhone: ${s.phone} | RawPhoneCandidates: [${Array.from(phoneCandidates).join(', ')}]`);
  console.log(`  Addresses (${s.addresses.length}): ${s.bestAddress}`);
  if (matchHouse) {
    console.log(`  [HOUSE MATCH] ${matchHouse.recipient_name} | ${matchHouse.recipient_phone} | ${matchHouse.lat}, ${matchHouse.lng} | Bench: ${matchHouse.benchmark} | Area: ${matchHouse.area_or_street}`);
  }
  if (matchPrev) {
    console.log(`  [PREV MATCH] ${matchPrev.recipientName} | ${matchPrev.recipientPhone} | ${matchPrev.lat}, ${matchPrev.lng} | Bench: ${matchPrev.benchmark} | Area: ${matchPrev.areaOrStreet}`);
  }
  s.cards.forEach((c, ci) => {
    console.log(`    Card ${ci+1}: ${c.trackingNumber} | Name: "${c.recipientName}" | COD: ${c.isCod ? c.codAmount : 0} (hasPay=${c.hasPaymentInfo}) | Bench: "${c.benchmark}" | File: ${c.file}`);
    if (!c.hasPaymentInfo) {
      console.log(`       [WARNING NO PAYMENT INFO] Seg: ${c.rawSegment}`);
    }
  });
  console.log('');
});
