const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');

const dir = path.join(__dirname, '..', 'screenshot alamat paket', '24 November 2026');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')).sort();

console.log(`Found ${files.length} screenshots in ${dir}`);

async function main() {
  const numWorkers = 3;
  const workers = await Promise.all(
    Array.from({ length: numWorkers }, () => createWorker('ind+eng'))
  );
  console.log(`Initialized ${numWorkers} Tesseract workers.`);

  const results = new Array(files.length);
  let currentIndex = 0;

  async function processQueue(workerId) {
    const worker = workers[workerId];
    while (currentIndex < files.length) {
      const idx = currentIndex++;
      const file = files[idx];
      const fullPath = path.join(dir, file);
      try {
        const ret = await worker.recognize(fullPath);
        const text = ret.data.text;
        console.log(`[Worker ${workerId}] [${idx + 1}/${files.length}] ${file}: ${text.split('\n').filter(l => l.trim()).length} lines`);
        results[idx] = { file, text };
      } catch (e) {
        console.error(`Error on ${file}:`, e.message);
        results[idx] = { file, error: e.message };
      }
    }
  }

  await Promise.all(workers.map((_, i) => processQueue(i)));
  await Promise.all(workers.map(w => w.terminate()));

  const outPath = path.join(__dirname, '..', 'screenshot alamat paket', 'ocr_raw_24_nov.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`All OCR results saved to ${outPath}`);
}

main();
