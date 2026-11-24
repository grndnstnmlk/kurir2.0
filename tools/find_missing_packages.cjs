const fs = require('fs');
const path = require('path');

const cardViews = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'parsed_cards_24_nov.json'), 'utf-8'));
const listPkgs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'list_packages_extracted.json'), 'utf-8'));

console.log('--- FINDING PACKAGES IN LIST VIEW NOT IN CARDS ---');

listPkgs.forEach((lp, idx) => {
  const match = cardViews.find(cv => {
    const cName = cv.recipientName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const lName = lp.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (cName.length >= 3 && lName.includes(cName)) || (lName.length >= 3 && cName.includes(lName)) || (cv.times.length > 0 && lp.time && cv.times.includes(lp.time));
  });

  if (!match) {
    console.log(`[UNMATCHED LIST ITEM #${idx + 1}]`);
    console.log(`  Name: ${lp.name}`);
    console.log(`  Time: ${lp.time}`);
    console.log(`  Phone: ${lp.phone}`);
    console.log(`  Address: ${lp.address}`);
    console.log(`  Source: ${lp.sourceFile}`);
  }
});
