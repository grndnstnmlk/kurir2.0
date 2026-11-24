const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'ocr_raw_24_nov.json'), 'utf-8'));
const listViews = raw.filter(item => item.text.includes('Alamat Penerima') || item.text.includes('Waktu Delivery'));

const packagesFromList = [];

listViews.forEach((lv) => {
  const text = lv.text;
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    // Look for "Waktu Delivery" line or timestamp line
    if (lines[i].includes('Waktu Delivery') || lines[i].match(/\b2026-11-24\s+\d{2}:\d{2}:\d{2}\b/)) {
      let time = '';
      let phone = '';
      let timeLineIdx = i;

      if (lines[i].match(/\b2026-11-24\s+\d{2}:\d{2}:\d{2}\b/)) {
        timeLineIdx = i;
      } else if (i + 1 < lines.length && lines[i + 1].match(/\b2026-11-24\s+\d{2}:\d{2}:\d{2}\b/)) {
        timeLineIdx = i + 1;
      }

      const timeLine = lines[timeLineIdx];
      const timeMatch = timeLine.match(/\b(2026-11-24\s+\d{2}:\d{2}:\d{2})\b/);
      if (timeMatch) time = timeMatch[1];

      // Phone is usually at the end of timeLine or next line
      const phoneDigits = timeLine.match(/(\d{4,12})$/);
      if (phoneDigits) {
        phone = `08******${phoneDigits[1].slice(-4)}`;
      }

      // Recipient name is 2-4 lines before Waktu Delivery
      let name = '';
      for (let j = timeLineIdx - 1; j >= Math.max(0, timeLineIdx - 5); j--) {
        const candidate = lines[j].replace(/^[+P\s0-9<]+/, '').replace(/^(Or|cop|cod|Tambah).*$/i, '').trim();
        if (candidate.length >= 3 && !candidate.includes('Waktu') && !candidate.includes('keterangan') && !candidate.includes('Delivery') && !candidate.includes('Penerima') && !candidate.includes('Filter')) {
          name = candidate;
          break;
        }
      }

      // Alamat is after "Alamat Penerima"
      let address = '';
      for (let j = timeLineIdx + 1; j < Math.min(lines.length, timeLineIdx + 6); j++) {
        if (lines[j].includes('Alamat Penerima')) {
          const addrLines = [];
          for (let k = j + 1; k < Math.min(lines.length, j + 5); k++) {
            if (lines[k].match(/^[0-9\sS&@©=]+$/) || lines[k].includes('Waktu Delivery') || lines[k].match(/\b2026-11-24\b/) || lines[k].includes('keterangan')) {
              break;
            }
            addrLines.push(lines[k]);
          }
          address = addrLines.join(' ').trim();
          break;
        }
      }

      if (name && address) {
        packagesFromList.push({
          name,
          time,
          phone,
          address,
          sourceFile: lv.file
        });
      }
    }
  }
});

console.log(`Extracted ${packagesFromList.length} package entries from list views.`);

// Deduplicate by name and address
const uniquePkgs = [];
const seen = new Set();
packagesFromList.forEach(p => {
  const key = `${p.name.toLowerCase()}_${p.address.slice(0, 20).toLowerCase()}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniquePkgs.push(p);
  }
});

console.log(`Unique packages from list views: ${uniquePkgs.length}`);
fs.writeFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'list_packages_extracted.json'), JSON.stringify(uniquePkgs, null, 2));
