const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'ocr_raw_24_nov.json'), 'utf-8'));
const listViews = raw.filter(item => item.text.includes('Alamat Penerima') || item.text.includes('Waktu Delivery'));

console.log(`Analyzing ${listViews.length} list views...`);

const allParsed = [];

listViews.forEach((lv, lvIdx) => {
  const lines = lv.text.split('\n').map(l => l.trim()).filter(Boolean);
  
  console.log(`\n==============================================`);
  console.log(`LIST VIEW #${lvIdx + 1}: ${lv.file}`);
  console.log(`==============================================`);
  console.log(lv.text);
});
