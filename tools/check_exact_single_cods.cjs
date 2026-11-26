const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'ocr_raw_26_nov.json'), 'utf-8'));
const checkResis = [
  'JY2301059834',
  'JY2336082335',
  'JY2318314056',
  'JY2377741006',
  'JY2301728904',
  'JY2368089074'
];

checkResis.forEach(r => {
  const matches = raw.filter(item => item.text && item.text.includes(r));
  console.log('=== RESI:', r);
  matches.forEach(m => {
    const lines = m.text.split('\n').map(l => l.trim()).filter(Boolean);
    const codLine = lines.find(l => /Belum\s*Bayar|PP_PM|Sudah\s*Bayar|CC_CASH/i.test(l));
    console.log(`   Frame: ${m.file} | Line: ${codLine}`);
  });
});
