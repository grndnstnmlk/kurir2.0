const fs = require('fs');
const path = require('path');

const cards = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'cards_26_nov.json'), 'utf-8'));
const stops = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'stops_merged_26_nov.json'), 'utf-8'));

console.log('--- LOCATION CLASSIFICATION ---');

cards.forEach((c, idx) => {
  let s = stops.find(st => st.time === c.time);
  if (!s) {
    const cn = c.recipientName.toLowerCase().replace(/[^a-z0-9]/g, '');
    s = stops.find(st => {
      const sn = st.bestName.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (sn.length >= 3 && cn.includes(sn)) || (cn.length >= 3 && sn.includes(cn));
    });
  }

  const addr = (s && s.bestAddress) || '';
  const bench = c.benchmark || '';
  const name = (s && s.bestName) || c.recipientName;

  console.log(`[${idx+1}] Resi: ${c.trackingNumber} | Name: ${name} | Bench: ${bench} | Time: ${c.time}`);
  console.log(`     Address: ${addr}`);
});
