const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'ocr_raw_24_nov.json'), 'utf-8'));

console.log(`Total screenshots: ${raw.length}`);

// Print summaries of all files
raw.forEach((item, idx) => {
  const lines = item.text.split('\n').map(l => l.trim()).filter(Boolean);
  // Look for waybill / resi numbers (e.g., JX..., JP..., JY..., etc.)
  const resiMatches = item.text.match(/\b(J[PTXYZS]\d{9,14}|\d{12})\b/gi) || [];
  // Look for recipient names or headers
  console.log(`[#${idx + 1}] ${item.file} (${lines.length} lines) - Resi: ${resiMatches.join(', ')}`);
});
