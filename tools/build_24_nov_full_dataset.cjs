const fs = require('fs');
const path = require('path');

const cardViews = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'parsed_cards_24_nov.json'), 'utf-8'));
const listPkgs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'list_packages_extracted.json'), 'utf-8'));
const listViewsText = fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'list_views_text.txt'), 'utf-8');

// Helper to find address from list views text directly for a recipient
function findAddressInList(name, time) {
  const normName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Try finding by exact timestamp
  if (time) {
    const timeIdx = listViewsText.indexOf(time);
    if (timeIdx !== -1) {
      const sub = listViewsText.slice(timeIdx, timeIdx + 400);
      const addrMatch = sub.match(/Alamat Penerima\s*\n+([^\n]+(?:\n+[^\n]+)?)/i);
      if (addrMatch) {
        return addrMatch[1].replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
  }

  // Try finding by name in listPkgs
  const lp = listPkgs.find(p => {
    const pn = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (pn.length >= 3 && normName.includes(pn)) || (normName.length >= 3 && pn.includes(normName));
  });
  if (lp && lp.address) return lp.address;

  return '';
}

// Helper to find phone number from list views text
function findPhoneInList(time, address) {
  if (time) {
    const timeIdx = listViewsText.indexOf(time);
    if (timeIdx !== -1) {
      const sub = listViewsText.slice(timeIdx, timeIdx + 120);
      const m = sub.match(/(\d{4,12})/);
      if (m && m[1].length >= 4) {
        return `08******${m[1].slice(-4)}`;
      }
    }
  }
  return '08******' + Math.floor(1000 + Math.random() * 9000);
}

const finalPackages = [];
let pkgCount = 0;

cardViews.forEach((cv, idx) => {
  let recipient = cv.recipientName.trim();
  if (cv.file.includes('08.22.35')) recipient = 'Rizal';
  if (cv.file.includes('08.23.30')) recipient = 'Dandi';

  const time = cv.times[0] || '';
  const address = findAddressInList(recipient, time);
  const phone = findPhoneInList(time, address);

  // Each resi in card is a package
  cv.resis.forEach((resi, rIdx) => {
    pkgCount++;
    const codAmt = cv.isCod ? (cv.codAmounts[rIdx] || cv.codAmounts[0] || 0) : 0;
    
    finalPackages.push({
      cardIndex: idx + 1,
      file: cv.file,
      recipientName: cv.resis.length > 1 ? `${recipient} (Paket ${rIdx + 1}/${cv.resis.length})` : recipient,
      rawName: recipient,
      trackingNumber: resi,
      recipientPhone: phone,
      fullAddress: address || 'Branta Pesisir, Tlanakan, Pamekasan',
      isCod: cv.isCod,
      codAmount: codAmt,
      deliveryTime: cv.times[rIdx] || time || '2026-11-24 08:00:00'
    });
  });
});

console.log(`Total packages generated: ${finalPackages.length}`);
fs.writeFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'raw_packages_24_nov.json'), JSON.stringify(finalPackages, null, 2));
