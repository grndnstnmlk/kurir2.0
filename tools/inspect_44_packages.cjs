const fs = require('fs');
const path = require('path');

const cards = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'cards_26_nov.json'), 'utf-8'));
const stops = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'stops_merged_26_nov.json'), 'utf-8'));

console.log('--- 44 CARDS LIST ---');
cards.forEach((c, i) => {
  let s = stops.find(st => st.time === c.time);
  if (!s) {
    const cn = c.recipientName.toLowerCase().replace(/[^a-z0-9]/g, '');
    s = stops.find(st => {
      const sn = st.bestName.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (sn.length >= 3 && cn.includes(sn)) || (cn.length >= 3 && sn.includes(cn));
    });
  }

  const phone = s ? s.phone : 'UNKNOWN';
  const address = s ? s.bestAddress : 'UNKNOWN';
  const bestName = (s && s.bestName) || c.recipientName;
  console.log(`${i+1}. Resi: ${c.trackingNumber} | Name: ${bestName} (card: ${c.recipientName}) | COD: ${c.isCod ? c.codAmount : 'NON-COD'} | Time: ${c.time} | Phone: ${phone} | Bench: ${c.benchmark}`);
  console.log(`   Address: ${address}`);
});
