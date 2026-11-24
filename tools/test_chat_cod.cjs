// Unit test to verify COD message with 10% courier fee addition

function formatRupiah(val) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
}

function calculateCodWithCourierFee(baseCodAmount, percentage = 10, roundToThousands = true) {
  if (baseCodAmount <= 0) {
    return {
      baseAmount: 0,
      courierFee: 0,
      totalAmount: 0,
      formattedBase: 'Rp 0',
      formattedFee: 'Rp 0',
      formattedTotal: 'Rp 0',
    };
  }

  const rawFee = baseCodAmount * (percentage / 100);
  let courierFee = rawFee;

  if (roundToThousands) {
    courierFee = Math.max(1000, Math.round(rawFee / 1000) * 1000);
  } else {
    courierFee = Math.round(rawFee);
  }

  const totalAmount = baseCodAmount + courierFee;

  return {
    baseAmount: baseCodAmount,
    courierFee,
    totalAmount,
    formattedBase: formatRupiah(baseCodAmount),
    formattedFee: formatRupiah(courierFee),
    formattedTotal: formatRupiah(totalAmount),
  };
}

function generateJntDeliveryMessage(pkg, customTemplate) {
  const rawRecipient = pkg.recipientName ? pkg.recipientName.trim() : 'Kak';
  const cleanRecipient = rawRecipient.replace(/^kak\s+/i, '').trim() || 'Kak';

  const rawCod = pkg.codAmount || 0;
  const isCodPkg = Boolean(pkg.isCod && rawCod > 0);

  const calc = calculateCodWithCourierFee(rawCod);
  const totalCod = calc.totalAmount;
  const formattedCodNumber = new Intl.NumberFormat('en-US').format(totalCod);
  const formattedBaseNumber = new Intl.NumberFormat('en-US').format(rawCod);
  const formattedFeeNumber = new Intl.NumberFormat('en-US').format(calc.courierFee);

  const tipePaket = isCodPkg ? 'COD ' : '';
  const infoTotal = isCodPkg
    ? `Totalnya Rp【${formattedCodNumber}】`
    : 'Paket Non-COD (Sudah Lunas)';

  const defaultJntTemplate = `Halo Kak【{NAMA}】,
Saya dari J&T Express, Mau konfirmasi paket {TIPE_PAKET}dengan nomor resi【{RESI}】ke alamat:
【{ALAMAT}】

{INFO_TOTAL}
Mohon konfirmasinya ya, apakah benar pesanan ini milik Kakak?

Terima kasih`;

  const templateToUse =
    !customTemplate ||
    customTemplate.includes('mau mengantar paket') ||
    customTemplate.includes('akan melakukan proses delivery')
      ? defaultJntTemplate
      : customTemplate;

  return templateToUse
    .replace(/{NAMA}/g, cleanRecipient)
    .replace(/{RESI}/g, pkg.trackingNumber)
    .replace(/{WAYBILL}/g, pkg.trackingNumber)
    .replace(/{ALAMAT}/g, pkg.fullAddress)
    .replace(/{TIPE_PAKET}/g, tipePaket)
    .replace(/{INFO_TOTAL}/g, infoTotal)
    .replace(/{TOTAL_COD}/g, formattedCodNumber)
    .replace(/{NOMINAL_COD}/g, formattedCodNumber)
    .replace(/{BASE_COD}/g, formattedBaseNumber)
    .replace(/{ONGKIR_KURIR}/g, formattedFeeNumber)
    .replace(
      /{KONFIRMASI_COD}/g,
      isCodPkg
        ? `Totalnya Rp【${formattedCodNumber}】\nMohon konfirmasinya ya, apakah benar pesanan ini milik Kakak?`
        : 'Mohon konfirmasinya ya, apakah benar pesanan ini milik Kakak?'
    )
    .replace(/{INFO_COD}/g, isCodPkg ? `Totalnya Rp【${formattedCodNumber}】` : 'Paket Non-COD (Sudah Lunas)');
}

// Test cases
const pkg1 = {
  recipientName: 'Diana Laili',
  trackingNumber: 'JY2379468922',
  fullAddress: 'Dermaga branta pesisir desa branta pesisir,kecamatan tlanakan kabupaten pamekasan TLANAKAN PAMEKASAN JAWA TIMUR',
  isCod: true,
  codAmount: 230218
};

console.log('=== TEST 1: Diana Laili (Base: 230,218, +10% rounded 23,000 = 253,218) ===');
console.log(generateJntDeliveryMessage(pkg1));

const pkg2 = {
  recipientName: 'Farah awalin',
  trackingNumber: 'JY2316844093',
  fullAddress: 'toko mama Mia dusun TINJANG TLANAKAN',
  isCod: true,
  codAmount: 173720
};

console.log('\n=== TEST 2: Farah awalin (Base: 173,720, +10% rounded 17,000 = 190,720) ===');
console.log(generateJntDeliveryMessage(pkg2));

const pkg3 = {
  recipientName: 'IRSYAD',
  trackingNumber: 'JY2265459933',
  fullAddress: 'jln.bongkaran, timur bowo cell, deket pohon kelapa TLANAKAN',
  isCod: false,
  codAmount: 0
};

console.log('\n=== TEST 3: IRSYAD (Non-COD) ===');
console.log(generateJntDeliveryMessage(pkg3));
