const fs = require('fs');
const path = require('path');

const cards = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'cards_26_nov.json'), 'utf-8'));
const stops = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'stops_merged_26_nov.json'), 'utf-8'));
const prev25 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'packages_25_nov_verified.json'), 'utf-8'));
const prev24 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'packages_24_nov_verified.json'), 'utf-8'));
const prev23 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'packages_23_nov_verified.json'), 'utf-8'));
const savedHouses = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'saved_houses_dump.json'), 'utf-8'));

const allPrev = [...prev25, ...prev24, ...prev23];

console.log(`Cross-referencing 34 stops against ${allPrev.length} past packages and ${savedHouses.length} saved houses...`);

stops.forEach((s, idx) => {
  // Find match in past packages
  const normNames = s.names.map(n => n.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const matchPkg = allPrev.find(p => {
    const pn = p.recipientName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return normNames.some(sn => sn.length >= 3 && (pn.includes(sn) || sn.includes(pn)));
  });

  const matchHouse = savedHouses.find(h => {
    const hn = h.recipient_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return normNames.some(sn => sn.length >= 3 && (hn.includes(sn) || sn.includes(hn)));
  });

  console.log(`[Stop #${idx + 1}] Time: ${s.time} | BestName: ${s.bestName} | Phone: ${s.phone}`);
  if (matchPkg) {
    console.log(`   -> Matched past pkg: ${matchPkg.recipientName} (${matchPkg.recipientPhone}) | Area: ${matchPkg.areaOrStreet} | Coords: ${matchPkg.lat}, ${matchPkg.lng}`);
  }
  if (matchHouse) {
    console.log(`   -> Matched saved house: ${matchHouse.recipient_name} (${matchHouse.recipient_phone}) | Photo: ${!!matchHouse.photo_url}`);
  }
});
