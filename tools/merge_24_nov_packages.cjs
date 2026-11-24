const fs = require('fs');
const path = require('path');

const cardViews = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'parsed_cards_24_nov.json'), 'utf-8'));
const listPkgs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'list_packages_extracted.json'), 'utf-8'));

console.log(`Cards: ${cardViews.length}, List stops: ${listPkgs.length}`);

// Let's print each card with its resi, recipientName, times, codAmounts
cardViews.forEach((cv, idx) => {
  // Find matching list pkg
  const match = listPkgs.find(lp => {
    const cName = cv.recipientName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const lName = lp.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cName.includes(lName) || lName.includes(cName) || (cv.times.length > 0 && lp.time && cv.times.includes(lp.time));
  });

  console.log(`[#${idx + 1}] Resi: ${cv.resis.join(', ')} | Name: "${cv.recipientName}" | COD: ${cv.isCod ? cv.codAmounts[0] : 'Non-COD'} | Time: ${cv.times[0] || 'N/A'}`);
  if (match) {
    console.log(`     -> Matched Addr: ${match.address}`);
    console.log(`     -> Matched Phone: ${match.phone}`);
  } else {
    console.log(`     -> NO LIST MATCH!`);
  }
});
