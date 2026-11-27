const fs = require('fs');
const path = require('path');

const pkgs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'packages_26_nov_verified.json'), 'utf-8'));

function calculateCodWithCourierFee(baseCodAmount, percentage = 10, roundToThousands = true, maxCourierFee = 18387) {
  if (baseCodAmount <= 0) return { baseAmount: 0, courierFee: 0, totalAmount: 0 };
  const rawFee = baseCodAmount * (percentage / 100);
  let courierFee = roundToThousands ? Math.max(1000, Math.round(rawFee / 1000) * 1000) : Math.round(rawFee);
  if (courierFee > maxCourierFee) courierFee = maxCourierFee;
  return { baseAmount: baseCodAmount, courierFee, totalAmount: baseCodAmount + courierFee };
}

function formatRupiah(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
}

const zones = {};
pkgs.forEach(p => {
  const z = p.areaOrStreet || 'Lainnya';
  if (!zones[z]) zones[z] = [];
  const calc = calculateCodWithCourierFee(p.codAmount);
  zones[z].push({
    ...p,
    calc
  });
});

Object.keys(zones).forEach(z => {
  console.log('=== ' + z + ' (' + zones[z].length + ' Paket) ===');
  zones[z].forEach(p => {
    const codStr = p.isCod ? `${formatRupiah(p.codAmount)} (+ Ongkir ${formatRupiah(p.calc.courierFee)}) -> Tagih: ${formatRupiah(p.calc.totalAmount)}` : 'Non-COD (Lunas)';
    console.log(`#${p.orderIndex} | ${p.recipientName} | ${p.trackingNumber} | ${p.recipientPhone} | ${codStr}`);
    console.log(`   Patokan: ${p.benchmark || '-'}`);
    console.log(`   Alamat: ${p.fullAddress}`);
  });
  console.log('');
});
