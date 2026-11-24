const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'ocr_raw_24_nov.json'), 'utf-8'));

// Separate list views and card views
const listViews = raw.filter(item => item.text.includes('Alamat Penerima') || item.text.includes('Waktu Delivery'));
const cardViews = raw.filter(item => !item.text.includes('Alamat Penerima') && !item.text.includes('Waktu Delivery'));

console.log(`Found ${listViews.length} list view screenshots and ${cardViews.length} card view screenshots.`);

// Let's print out what we see in list views
console.log('\n--- LIST VIEWS ---');
listViews.forEach((lv, i) => console.log(`${i + 1}. ${lv.file}`));

console.log('\n--- CARD VIEWS ---');
cardViews.forEach((cv, i) => {
  const resi = cv.text.match(/\b(J[PTXYZS]\d{9,14}|\d{12})\b/i);
  const nameLine = cv.text.split('\n').map(l => l.trim()).filter(Boolean)[2] || '';
  console.log(`${i + 1}. ${cv.file} -> Resi: ${resi ? resi[0] : 'N/A'}, Header: ${nameLine}`);
});
