const fs = require('fs');
const path = require('path');

const cardsFile = path.join(__dirname, '..', 'screenshot alamat paket', 'cards_28_nov.json');
const listFile = path.join(__dirname, '..', 'screenshot alamat paket', 'list_occurrences_28_nov.json');

if (!fs.existsSync(cardsFile) || !fs.existsSync(listFile)) {
  console.error('Cards or list occurrences not found.');
  process.exit(1);
}

const cards = JSON.parse(fs.readFileSync(cardsFile, 'utf-8'));
const listOccurrences = JSON.parse(fs.readFileSync(listFile, 'utf-8'));

const stopsByTime = new Map();

listOccurrences.forEach(item => {
  const t = item.time;
  if (!t) return;
  if (!stopsByTime.has(t)) {
    stopsByTime.set(t, {
      time: t,
      names: [item.name].filter(Boolean),
      phone: item.phone,
      rawPhones: [item.rawPhone].filter(Boolean),
      addresses: [item.address].filter(Boolean),
      files: [item.file]
    });
  } else {
    const s = stopsByTime.get(t);
    if (item.name && !s.names.includes(item.name)) s.names.push(item.name);
    if (item.address && !s.addresses.includes(item.address)) s.addresses.push(item.address);
    if (item.rawPhone && !s.rawPhones.includes(item.rawPhone)) s.rawPhones.push(item.rawPhone);
    if (item.phone && (!s.phone || s.phone.endsWith('0000'))) s.phone = item.phone;
    s.files.push(item.file);
  }
});

console.log(`Unique delivery stops by time (from list): ${stopsByTime.size}`);

const stopsArray = Array.from(stopsByTime.values()).sort((a, b) => b.time.localeCompare(a.time));

stopsArray.forEach((stop, idx) => {
  stop.index = idx + 1;
  stop.bestAddress = stop.addresses.sort((a, b) => b.length - a.length)[0] || '';
  stop.cards = cards.filter(c => c.time === stop.time);
  stop.bestName = (stop.cards[0] && stop.cards[0].recipientName) || stop.names[0] || 'Penerima';
});

const linkedResis = new Set(stopsArray.flatMap(s => s.cards.map(c => c.trackingNumber)));
const unlinkedCards = cards.filter(c => !linkedResis.has(c.trackingNumber));

unlinkedCards.forEach(c => {
  const cn = (c.recipientName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  let matchedStop = stopsArray.find(s => {
    const normNames = [s.bestName, ...s.names].map(n => n.toLowerCase().replace(/[^a-z0-9]/g, ''));
    return normNames.some(sn => sn.length >= 3 && cn.length >= 3 && (cn.includes(sn) || sn.includes(cn)));
  });
  if (matchedStop) {
    matchedStop.cards.push(c);
    linkedResis.add(c.trackingNumber);
  }
});

const stillUnlinked = cards.filter(c => !linkedResis.has(c.trackingNumber));

console.log(`Total cards: ${cards.length}`);
console.log(`Cards linked to stops: ${linkedResis.size}`);
console.log(`Unlinked cards: ${stillUnlinked.length}`);
if (stillUnlinked.length > 0) {
  console.log('Still unlinked:', stillUnlinked.map(c => `${c.trackingNumber} (${c.recipientName} | ${c.time})`));
}

const stopsWithoutCards = stopsArray.filter(s => s.cards.length === 0);
console.log(`Stops without matched cards: ${stopsWithoutCards.length}`);
if (stopsWithoutCards.length > 0) {
  stopsWithoutCards.forEach(s => {
    console.log(`  Stop ${s.time} | ${s.names.join(' / ')} | Phone: ${s.phone} | Addr: ${s.bestAddress}`);
  });
}

const outPath = path.join(__dirname, '..', 'screenshot alamat paket', 'stops_merged_28_nov.json');
fs.writeFileSync(outPath, JSON.stringify(stopsArray, null, 2));
console.log(`Saved merged stops to ${outPath}`);
