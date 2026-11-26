const fs = require('fs');
const path = require('path');

const stops = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'stops_merged_26_nov.json'), 'utf-8'));
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'ocr_raw_26_nov.json'), 'utf-8'));

console.log('--- PHONE EXTRACTION AUDIT ---');

stops.forEach((s, idx) => {
  // Find all frames containing this stop's time
  const matchingFrames = raw.filter(r => r.text && r.text.includes(s.time));
  const candidatePhones = new Set();
  
  matchingFrames.forEach(mf => {
    // Look for lines near Waktu Delivery
    const text = mf.text;
    const timeIdx = text.indexOf(s.time);
    if (timeIdx !== -1) {
      const slice = text.slice(Math.max(0, timeIdx - 50), Math.min(text.length, timeIdx + 150));
      const m = slice.match(/(\d{3,12})/g);
      if (m) {
        m.forEach(digits => {
          if (digits.length >= 3 && digits.length <= 12 && !digits.includes('2026') && !s.time.includes(digits)) {
            candidatePhones.add(digits);
          }
        });
      }
    }
  });

  console.log(`[Stop #${idx + 1}] Time: ${s.time} | Name: ${s.bestName}`);
  console.log(`   Current Phone: ${s.phone} | Candidates: ${Array.from(candidatePhones).join(', ')}`);
});
