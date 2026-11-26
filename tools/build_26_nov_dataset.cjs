const fs = require('fs');
const path = require('path');

const cardsFile = path.join(__dirname, '..', 'screenshot alamat paket', 'cards_26_nov.json');
const listFile = path.join(__dirname, '..', 'screenshot alamat paket', 'list_occurrences_26_nov.json');

if (!fs.existsSync(cardsFile) || !fs.existsSync(listFile)) {
  console.log('Cards or list occurrences not yet available.');
  process.exit(0);
}

const cards = JSON.parse(fs.readFileSync(cardsFile, 'utf-8'));
const listOccurrences = JSON.parse(fs.readFileSync(listFile, 'utf-8'));

// 1. Group list occurrences by timestamp (primary key for stop in VIP list)
const stopsByTime = new Map();

listOccurrences.forEach(item => {
  const t = item.time;
  if (!t) return;
  if (!stopsByTime.has(t)) {
    stopsByTime.set(t, {
      time: t,
      names: [item.name].filter(Boolean),
      phone: item.phone,
      addresses: [item.address].filter(Boolean),
      files: [item.file]
    });
  } else {
    const s = stopsByTime.get(t);
    if (item.name && !s.names.includes(item.name)) s.names.push(item.name);
    if (item.address && !s.addresses.includes(item.address)) s.addresses.push(item.address);
    if (item.phone && (!s.phone || s.phone.endsWith('0000'))) s.phone = item.phone;
    s.files.push(item.file);
  }
});

console.log(`Unique delivery stops by time: ${stopsByTime.size}`);

// Print all stops with times
const stopsArray = Array.from(stopsByTime.values()).sort((a, b) => b.time.localeCompare(a.time));

// Also map cards by time or recipient name
stopsArray.forEach((stop, idx) => {
  // Find card with matching time
  let matchedCard = cards.find(c => c.time === stop.time);
  
  // If not matched by time, match by name similarity
  if (!matchedCard) {
    const normNames = stop.names.map(n => n.toLowerCase().replace(/[^a-z0-9]/g, ''));
    matchedCard = cards.find(c => {
      const cn = c.recipientName.toLowerCase().replace(/[^a-z0-9]/g, '');
      return normNames.some(sn => (sn.length >= 3 && cn.includes(sn)) || (cn.length >= 3 && sn.includes(cn)));
    });
  }

  stop.index = idx + 1;
  stop.card = matchedCard || null;
  // Pick best address (longest)
  stop.bestAddress = stop.addresses.sort((a, b) => b.length - a.length)[0] || '';
  // Pick best name
  stop.bestName = (matchedCard && matchedCard.recipientName) || stop.names[0] || 'Penerima';
});

console.log(`Matched ${stopsArray.filter(s => s.card).length} of ${stopsArray.length} stops with card data.`);

const outPath = path.join(__dirname, '..', 'screenshot alamat paket', 'stops_merged_26_nov.json');
fs.writeFileSync(outPath, JSON.stringify(stopsArray, null, 2));
console.log(`Saved merged stops to ${outPath}`);
