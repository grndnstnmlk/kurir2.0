const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');

const dir = path.join(__dirname, '..', 'screenshot alamat paket', '25 November 2026', 'extracted_frames');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort();

console.log(`Found ${files.length} frames to OCR in ${dir}`);

async function main() {
  const numWorkers = 4; // 4 parallel workers for speed
  const workers = await Promise.all(
    Array.from({ length: numWorkers }, () => createWorker('ind+eng'))
  );
  console.log(`Initialized ${numWorkers} Tesseract workers.`);

  const results = new Array(files.length);
  let currentIndex = 0;
  let completed = 0;

  async function processQueue(workerId) {
    const worker = workers[workerId];
    while (currentIndex < files.length) {
      const idx = currentIndex++;
      const file = files[idx];
      const fullPath = path.join(dir, file);
      try {
        const ret = await worker.recognize(fullPath);
        const text = ret.data.text;
        completed++;
        if (completed % 25 === 0 || completed === files.length) {
          console.log(`[Progress: ${completed}/${files.length} frames] (${((completed/files.length)*100).toFixed(0)}%)`);
        }
        results[idx] = { file, text };
      } catch (e) {
        console.error(`Error on ${file}:`, e.message);
        results[idx] = { file, error: e.message };
      }
    }
  }

  await Promise.all(workers.map((_, i) => processQueue(i)));
  await Promise.all(workers.map(w => w.terminate()));

  const outPath = path.join(__dirname, '..', 'screenshot alamat paket', 'ocr_raw_25_nov.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nAll OCR results saved to ${outPath}`);
}

main();
