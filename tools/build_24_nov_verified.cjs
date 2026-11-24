const fs = require('fs');
const path = require('path');

// 31 Packages (30 stops, 1 multi-item: Milly Aprili rukbana with 2 items)
// Sequenced logically from North to South (Entrance -> Pasar -> Bandaran -> Gilin Gang 1 -> Gilin Al-Furqon)
const packages24Nov = [
  // =========================================================================
  // ZONE 1: Jl. Raya Tlanakan, Pegadaian & Bongkaran (6 Paket)
  // =========================================================================
  {
    id: 'pkg-20261124-01',
    trackingNumber: 'JY2316844093',
    recipientName: 'Farah awalin',
    recipientPhone: '08******4309',
    fullAddress: 'toko mama Mia dusun TINJANG TLANAKAN',
    areaOrStreet: 'Jl. Raya Tlanakan, Pegadaian & Bongkaran',
    benchmark: 'Toko Mama Mia, Dusun Tinjang',
    isCod: true,
    codAmount: 173720,
    status: 'pending',
    lat: -7.2155,
    lng: 113.4510,
    orderIndex: 1,
    createdAt: '2026-11-24T08:02:05.000Z'
  },
  {
    id: 'pkg-20261124-02',
    trackingNumber: 'JY2265459933',
    recipientName: 'IRSYAD',
    recipientPhone: '08******0061',
    fullAddress: 'jln.bongkaran, timur bowo cell, deket pohon kelapa TLANAKAN',
    areaOrStreet: 'Jl. Raya Tlanakan, Pegadaian & Bongkaran',
    benchmark: 'Jl. Bongkaran, Timur Bowo Cell Deket Pohon Kelapa',
    isCod: false,
    codAmount: 0,
    status: 'pending',
    lat: -7.220727,
    lng: 113.451333,
    orderIndex: 2,
    createdAt: '2026-11-24T07:51:46.000Z'
  },
  {
    id: 'pkg-20261124-03',
    trackingNumber: 'JY2209465540',
    recipientName: 'ainun',
    recipientPhone: '08******9101',
    fullAddress: 'Pegadaian, Jalan Raya Tlanakan TK AL-AMIN TLANAKAN',
    areaOrStreet: 'Jl. Raya Tlanakan, Pegadaian & Bongkaran',
    benchmark: 'TK Al-Amin, Dekat Pegadaian',
    isCod: true,
    codAmount: 118059,
    status: 'pending',
    lat: -7.2168,
    lng: 113.4504,
    orderIndex: 3,
    createdAt: '2026-11-24T08:00:27.000Z'
  },
  {
    id: 'pkg-20261124-04',
    trackingNumber: 'JY2308192284',
    recipientName: 'Herlin.t.s',
    recipientPhone: '08******5335',
    fullAddress: 'gang KB sebelah barat TK Al-amin pegadaian TLANAKAN',
    areaOrStreet: 'Jl. Raya Tlanakan, Pegadaian & Bongkaran',
    benchmark: 'Gang KB Sebelah Barat TK Al-Amin Pegadaian',
    isCod: false,
    codAmount: 0,
    status: 'pending',
    lat: -7.2170,
    lng: 113.4501,
    orderIndex: 4,
    createdAt: '2026-11-24T08:00:13.000Z'
  },
  {
    id: 'pkg-20261124-05',
    trackingNumber: 'JY2368613685',
    recipientName: 'rusniyah',
    recipientPhone: '08******0370',
    fullAddress: 'Dusun Pos, Tlanakan, gang pegadaian depan toko ZAINAB TLANAKAN',
    areaOrStreet: 'Jl. Raya Tlanakan, Pegadaian & Bongkaran',
    benchmark: 'Gang Pegadaian Depan Toko Zainab',
    isCod: true,
    codAmount: 228462,
    status: 'pending',
    lat: -7.2174,
    lng: 113.4506,
    orderIndex: 5,
    createdAt: '2026-11-24T08:00:52.000Z'
  },
  {
    id: 'pkg-20261124-06',
    trackingNumber: 'JY2314563461',
    recipientName: 'lim 369',
    recipientPhone: '08******4908',
    fullAddress: 'toko Zainab sebelah ada jual betur TLANAKAN',
    areaOrStreet: 'Jl. Raya Tlanakan, Pegadaian & Bongkaran',
    benchmark: 'Sebelah Toko Zainab Jual Betur',
    isCod: true,
    codAmount: 40046,
    status: 'pending',
    lat: -7.2175,
    lng: 113.4507,
    orderIndex: 6,
    createdAt: '2026-11-24T08:01:20.000Z'
  },

  // =========================================================================
  // ZONE 2: Pasar Branta & Toko Wamira (5 Paket / 4 Titik Antaran)
  // =========================================================================
  {
    id: 'pkg-20261124-07',
    trackingNumber: 'JY2384347813',
    recipientName: 'Milly Aprili rukbana (Paket 1/2)',
    recipientPhone: '08******1144',
    fullAddress: 'Branta Pasisir Kel., Jalan Raya Branta Belakang pasar belakang toko wamira TLANAKAN',
    areaOrStreet: 'Pasar Branta & Toko Wamira',
    benchmark: 'Belakang Pasar, Belakang Toko Wamira',
    isCod: true,
    codAmount: 57065,
    status: 'pending',
    lat: -7.2182,
    lng: 113.4504,
    orderIndex: 7,
    createdAt: '2026-11-24T08:01:41.000Z'
  },
  {
    id: 'pkg-20261124-08',
    trackingNumber: 'JY2330172113',
    recipientName: 'Milly Aprili rukbana (Paket 2/2)',
    recipientPhone: '08******1144',
    fullAddress: 'Branta Pasisir Kel., Jalan Raya Branta Belakang pasar belakang toko wamira TLANAKAN',
    areaOrStreet: 'Pasar Branta & Toko Wamira',
    benchmark: 'Belakang Pasar, Belakang Toko Wamira',
    isCod: true,
    codAmount: 74438,
    status: 'pending',
    lat: -7.2182,
    lng: 113.4504,
    orderIndex: 8,
    createdAt: '2026-11-24T08:01:33.000Z'
  },
  {
    id: 'pkg-20261124-09',
    trackingNumber: 'JY2366365243',
    recipientName: 'cinta ayu',
    recipientPhone: '08******2598',
    fullAddress: 'Dsn. Gilin, Branta Pesisir rumah warna kuning samping wamira TLANAKAN',
    areaOrStreet: 'Pasar Branta & Toko Wamira',
    benchmark: 'Rumah Kuning Samping Wamira, Dsn. Gilin',
    isCod: true,
    codAmount: 61075,
    status: 'pending',
    lat: -7.2180,
    lng: 113.4502,
    orderIndex: 9,
    createdAt: '2026-11-24T08:01:45.000Z'
  },
  {
    id: 'pkg-20261124-10',
    trackingNumber: 'JY2350568543',
    recipientName: 'rere yubi',
    recipientPhone: '08******0053',
    fullAddress: 'RT 006 RW 003 belakang pasar gang pegadaian TLANAKAN',
    areaOrStreet: 'Pasar Branta & Toko Wamira',
    benchmark: 'RT 006 RW 003 Belakang Pasar Gang Pegadaian',
    isCod: true,
    codAmount: 176338,
    status: 'pending',
    lat: -7.2184,
    lng: 113.4508,
    orderIndex: 10,
    createdAt: '2026-11-24T08:00:17.000Z'
  },
  {
    id: 'pkg-20261124-11',
    trackingNumber: 'JY2348762123',
    recipientName: 'mulyadi',
    recipientPhone: '08******0618',
    fullAddress: 'Dsn. Gilin, Branta Pesisir selatan pasar branta pesisir TLANAKAN',
    areaOrStreet: 'Pasar Branta & Toko Wamira',
    benchmark: 'Selatan Pasar Branta Pesisir',
    isCod: true,
    codAmount: 92900,
    status: 'pending',
    lat: -7.2186,
    lng: 113.4505,
    orderIndex: 11,
    createdAt: '2026-11-24T08:00:47.000Z'
  },

  // =========================================================================
  // ZONE 3: Bandaran & Jl. Pelabuhan (5 Paket)
  // =========================================================================
  {
    id: 'pkg-20261124-12',
    trackingNumber: 'JY2385141514',
    recipientName: 'Noviasaputri',
    recipientPhone: '08******6976',
    fullAddress: 'Toko JAMALIA, Bandaran, Branta Pesisir, Tlanakan, Kabupaten Pamekasan TLANAKAN',
    areaOrStreet: 'Bandaran & Jl. Pelabuhan',
    benchmark: 'Toko Jamalia, Bandaran',
    isCod: false,
    codAmount: 0,
    status: 'pending',
    lat: -7.2190,
    lng: 113.4515,
    orderIndex: 12,
    createdAt: '2026-11-24T07:33:03.000Z'
  },
  {
    id: 'pkg-20261124-13',
    trackingNumber: 'JY2386202323',
    recipientName: 'yeyen toko ramdhani',
    recipientPhone: '08******4017',
    fullAddress: 'Tk. Al-Amin, Bandaran, Branta Pesisir TLANAKAN',
    areaOrStreet: 'Bandaran & Jl. Pelabuhan',
    benchmark: 'Tk. Al-Amin, Bandaran',
    isCod: true,
    codAmount: 226240,
    status: 'pending',
    lat: -7.2193,
    lng: 113.4512,
    orderIndex: 13,
    createdAt: '2026-11-24T08:00:23.000Z'
  },
  {
    id: 'pkg-20261124-14',
    trackingNumber: 'JY2201486062',
    recipientName: 'Shintia agustin',
    recipientPhone: '08******6333',
    fullAddress: 'Gang jamu JI. Pelabuhan Branta No.2 Dsn tengah II (depan bakso regas) TLANAKAN',
    areaOrStreet: 'Bandaran & Jl. Pelabuhan',
    benchmark: 'Depan Bakso Regas, Gang Jamu Dsn Tengah II',
    isCod: true,
    codAmount: 110247,
    status: 'pending',
    lat: -7.2202,
    lng: 113.4508,
    orderIndex: 14,
    createdAt: '2026-11-24T08:01:56.000Z'
  },
  {
    id: 'pkg-20261124-15',
    trackingNumber: 'JY2385741934',
    recipientName: 'alhanani efendi',
    recipientPhone: '08******0110',
    fullAddress: 'Jalan Pelabuhan jln pelabuhan branta pesisir TLANAKAN',
    areaOrStreet: 'Bandaran & Jl. Pelabuhan',
    benchmark: 'Jalan Pelabuhan Branta Pesisir',
    isCod: true,
    codAmount: 129280,
    status: 'pending',
    lat: -7.2208,
    lng: 113.4503,
    orderIndex: 15,
    createdAt: '2026-11-24T08:01:26.000Z'
  },
  {
    id: 'pkg-20261124-16',
    trackingNumber: 'JY2304336772',
    recipientName: 'widiyanti oktavia',
    recipientPhone: '08******7873',
    fullAddress: 'Sd Negeri Branta Paseser 3 depan sd branta 3 TLANAKAN',
    areaOrStreet: 'Bandaran & Jl. Pelabuhan',
    benchmark: 'Depan SD Negeri Branta Pesisir 3',
    isCod: true,
    codAmount: 12927,
    status: 'pending',
    lat: -7.2212,
    lng: 113.4498,
    orderIndex: 16,
    createdAt: '2026-11-24T08:01:01.000Z'
  },

  // =========================================================================
  // ZONE 4: Dusun Gilin - Gang Pertama & Bengkel Bubut (5 Paket)
  // =========================================================================
  {
    id: 'pkg-20261124-17',
    trackingNumber: 'JY2357415083',
    recipientName: 'Rizal',
    recipientPhone: '08******3884',
    fullAddress: 'Dsn. Gilin, Branta Pesisir dibelakang polsek tlanakan yang lama TLANAKAN',
    areaOrStreet: 'Dusun Gilin - Gang Pertama & Bengkel Bubut',
    benchmark: 'Dibelakang Polsek Tlanakan Lama',
    isCod: true,
    codAmount: 67064,
    status: 'pending',
    lat: -7.2182,
    lng: 113.4492,
    orderIndex: 17,
    createdAt: '2026-11-24T08:00:34.000Z'
  },
  {
    id: 'pkg-20261124-18',
    trackingNumber: 'JO0331340806',
    recipientName: 'Dandi',
    recipientPhone: '08******5539',
    fullAddress: 'Dsn gilin gang pertama ke barat rumah warna putih Desa Branta Pesisir RT/RW 002/001 TLANAKAN',
    areaOrStreet: 'Dusun Gilin - Gang Pertama & Bengkel Bubut',
    benchmark: 'Gang Pertama ke Barat Rumah Putih RT 002/001',
    isCod: true,
    codAmount: 173000,
    status: 'pending',
    lat: -7.2182497,
    lng: 113.4497645,
    orderIndex: 18,
    createdAt: '2026-11-24T07:58:09.000Z'
  },
  {
    id: 'pkg-20261124-19',
    trackingNumber: 'JY2339774054',
    recipientName: 'Moh difal',
    recipientPhone: '08******6436',
    fullAddress: 'Dsn. Gilin, Branta Pesisir, dusun Gilin gang pertama, beranta paseser 3 TLANAKAN',
    areaOrStreet: 'Dusun Gilin - Gang Pertama & Bengkel Bubut',
    benchmark: 'Dusun Gilin Gang Pertama Branta Paseser 3',
    isCod: true,
    codAmount: 15093,
    status: 'pending',
    lat: -7.2193504,
    lng: 113.4496808,
    orderIndex: 19,
    createdAt: '2026-11-24T07:56:02.000Z'
  },
  {
    id: 'pkg-20261124-20',
    trackingNumber: 'JY2301416333',
    recipientName: 'Dedi fela',
    recipientPhone: '08******8523',
    fullAddress: 'Branta pesisir, dusun gilin Masuk gang pertama, perempatan kedua belok kiri, rumah putih sebelah bengkel bubut TLANAKAN',
    areaOrStreet: 'Dusun Gilin - Gang Pertama & Bengkel Bubut',
    benchmark: 'Gang 1 Perempatan 2 ke Kiri Sebelah Bengkel Bubut',
    isCod: true,
    codAmount: 21816,
    status: 'pending',
    lat: -7.2186677,
    lng: 113.4494559,
    orderIndex: 20,
    createdAt: '2026-11-24T07:56:19.000Z'
  },
  {
    id: 'pkg-20261124-21',
    trackingNumber: 'JY2305833883',
    recipientName: 'deck fia',
    recipientPhone: '08******4387',
    fullAddress: 'branta pasisir dusun gilin belakang toko tegarrr TLANAKAN',
    areaOrStreet: 'Dusun Gilin - Gang Pertama & Bengkel Bubut',
    benchmark: 'Belakang Toko Tegar, Dusun Gilin',
    isCod: true,
    codAmount: 30906,
    status: 'pending',
    lat: -7.2195914,
    lng: 113.4499589,
    orderIndex: 21,
    createdAt: '2026-11-24T07:55:50.000Z'
  },

  // =========================================================================
  // ZONE 5: Dusun Gilin - Sekitar Masjid Al-Furqon (10 Paket)
  // =========================================================================
  {
    id: 'pkg-20261124-22',
    trackingNumber: 'JY2319709393',
    recipientName: 'Furqon Maulidi',
    recipientPhone: '08******4674',
    fullAddress: 'Jalan Pelabuhan Branta plang NU, gang kebarat Musholla Nurul Ghomam TLANAKAN',
    areaOrStreet: 'Dusun Gilin - Sekitar Masjid Al-Furqon',
    benchmark: 'Plang NU, Gang ke Barat Musholla Nurul Ghomam',
    isCod: true,
    codAmount: 30769,
    status: 'pending',
    lat: -7.2195,
    lng: 113.4488,
    orderIndex: 22,
    createdAt: '2026-11-24T08:00:38.000Z'
  },
  {
    id: 'pkg-20261124-23',
    trackingNumber: 'JY2397520984',
    recipientName: 'firdyanto',
    recipientPhone: '08******1459',
    fullAddress: 'Dsn. Gilin, Branta Pesisir dusun giling gang amal musholla Nurul ghomam TLANAKAN',
    areaOrStreet: 'Dusun Gilin - Sekitar Masjid Al-Furqon',
    benchmark: 'Gang Amal, Musholla Nurul Ghomam',
    isCod: true,
    codAmount: 79992,
    status: 'pending',
    lat: -7.2197,
    lng: 113.4486,
    orderIndex: 23,
    createdAt: '2026-11-24T08:01:30.000Z'
  },
  {
    id: 'pkg-20261124-24',
    trackingNumber: 'JY2325444153',
    recipientName: 'Nurul fadila',
    recipientPhone: '08******1785',
    fullAddress: 'Branta Pesisir, musholla Nurul ghomam dusun gilin TLANAKAN',
    areaOrStreet: 'Dusun Gilin - Sekitar Masjid Al-Furqon',
    benchmark: 'Musholla Nurul Ghomam Dusun Gilin',
    isCod: true,
    codAmount: 40652,
    status: 'pending',
    lat: -7.2198,
    lng: 113.4487,
    orderIndex: 24,
    createdAt: '2026-11-24T07:58:00.000Z'
  },
  {
    id: 'pkg-20261124-25',
    trackingNumber: 'JY2372683684',
    recipientName: 'fatimatus zahrah',
    recipientPhone: '08******2287',
    fullAddress: 'Dusun gilin ,Rujak kelang linda, Branta Pesisir (Gank amal ke barat) TLANAKAN',
    areaOrStreet: 'Dusun Gilin - Sekitar Masjid Al-Furqon',
    benchmark: 'Rujak Kelang Linda, Gang Amal ke Barat',
    isCod: false,
    codAmount: 0,
    status: 'pending',
    lat: -7.2200,
    lng: 113.4484,
    orderIndex: 25,
    createdAt: '2026-11-24T08:00:43.000Z'
  },
  {
    id: 'pkg-20261124-26',
    trackingNumber: 'JY2329053973',
    recipientName: 'Anisa fitri',
    recipientPhone: '08******7327',
    fullAddress: 'gang masjid al-furqan gilin branta pesisir TLANAKAN',
    areaOrStreet: 'Dusun Gilin - Sekitar Masjid Al-Furqon',
    benchmark: 'Gang Masjid Al-Furqan Gilin',
    isCod: true,
    codAmount: 19038,
    status: 'pending',
    lat: -7.2187,
    lng: 113.4489,
    orderIndex: 26,
    createdAt: '2026-11-24T07:56:22.000Z'
  },
  {
    id: 'pkg-20261124-27',
    trackingNumber: 'JY2318741333',
    recipientName: 'firmansyah romadhani',
    recipientPhone: '08******0516',
    fullAddress: 'Masjid Al-Furqon Branta Pesisir, Branta Pesisir dusun gilin TLANAKAN',
    areaOrStreet: 'Dusun Gilin - Sekitar Masjid Al-Furqon',
    benchmark: 'Masjid Al-Furqon Branta Pesisir Dusun Gilin',
    isCod: true,
    codAmount: 48884,
    status: 'pending',
    lat: -7.2186809,
    lng: 113.4489442,
    orderIndex: 27,
    createdAt: '2026-11-24T07:56:15.000Z'
  },
  {
    id: 'pkg-20261124-28',
    trackingNumber: 'JY2354107774',
    recipientName: 'Fkkk',
    recipientPhone: '08******7811',
    fullAddress: 'Branta Pesisir tlanakan masjid al furqon TLANAKAN',
    areaOrStreet: 'Dusun Gilin - Sekitar Masjid Al-Furqon',
    benchmark: 'Sekitar Masjid Al-Furqon Branta Pesisir',
    isCod: true,
    codAmount: 191531,
    status: 'pending',
    lat: -7.21875,
    lng: 113.4490,
    orderIndex: 28,
    createdAt: '2026-11-24T07:56:11.000Z'
  },
  {
    id: 'pkg-20261124-29',
    trackingNumber: 'JY2369870104',
    recipientName: '3 JULIANTI NAFELA PUTRI',
    recipientPhone: '08******3755',
    fullAddress: 'Dusun gilin. Jalan pelabuhan Branta pesisir. (Masuk gang pertama\\Belakang masjid al-furqon) Masuk gang pertama( lurus ada perempatan kedua ke kiri. TLANAKAN',
    areaOrStreet: 'Dusun Gilin - Sekitar Masjid Al-Furqon',
    benchmark: 'Belakang Masjid Al-Furqon, Gang 1 Perempatan 2 ke Kiri',
    isCod: true,
    codAmount: 82634,
    status: 'pending',
    lat: -7.2191,
    lng: 113.4495,
    orderIndex: 29,
    createdAt: '2026-11-24T07:56:07.000Z'
  },
  {
    id: 'pkg-20261124-30',
    trackingNumber: 'JY2348597964',
    recipientName: 'Nadjwa',
    recipientPhone: '08******2651',
    fullAddress: 'Dsn. Gilin, Branta Pesisir, Gilin, Branta Pesisir belakang Masjid Al Furqon TLANAKAN',
    areaOrStreet: 'Dusun Gilin - Sekitar Masjid Al-Furqon',
    benchmark: 'Belakang Masjid Al-Furqon, Dusun Gilin',
    isCod: true,
    codAmount: 36077,
    status: 'pending',
    lat: -7.2192738,
    lng: 113.4497708,
    orderIndex: 30,
    createdAt: '2026-11-24T07:55:32.000Z'
  },
  {
    id: 'pkg-20261124-31',
    trackingNumber: 'JY2324636223',
    recipientName: 'lidia',
    recipientPhone: '08******2416',
    fullAddress: 'belakang masjid al furqon TLANAKAN',
    areaOrStreet: 'Dusun Gilin - Sekitar Masjid Al-Furqon',
    benchmark: 'Belakang Masjid Al-Furqon',
    isCod: true,
    codAmount: 14846,
    status: 'pending',
    lat: -7.21932,
    lng: 113.44972,
    orderIndex: 31,
    createdAt: '2026-11-24T07:55:25.000Z'
  }
];

const outputPath = path.join(__dirname, '..', 'screenshot alamat paket', 'packages_24_nov_verified.json');
fs.writeFileSync(outputPath, JSON.stringify(packages24Nov, null, 2));
console.log(`Successfully generated ${packages24Nov.length} verified packages for 24 November 2026!`);

// Print Zone Summary & COD Totals
const zones = {};
let totalCod = 0;
let codCount = 0;
let nonCodCount = 0;

packages24Nov.forEach(p => {
  if (!zones[p.areaOrStreet]) zones[p.areaOrStreet] = { count: 0, cod: 0, pkgs: [] };
  zones[p.areaOrStreet].count++;
  zones[p.areaOrStreet].cod += p.codAmount;
  zones[p.areaOrStreet].pkgs.push(p);

  if (p.isCod) {
    totalCod += p.codAmount;
    codCount++;
  } else {
    nonCodCount++;
  }
});

console.log('\n--- ZONA SUMMARY ---');
for (const [z, info] of Object.entries(zones)) {
  console.log(`${z}: ${info.count} paket (COD: Rp ${info.cod.toLocaleString('id-ID')})`);
}

console.log('\n--- TOTAL KESELURUHAN ---');
console.log(`Total Paket: ${packages24Nov.length}`);
console.log(`Total Paket COD: ${codCount} (Rp ${totalCod.toLocaleString('id-ID')})`);
console.log(`Total Paket Non-COD: ${nonCodCount}`);
