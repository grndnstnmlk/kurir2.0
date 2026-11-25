const fs = require('fs');
const path = require('path');

const existing = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'packages_25_nov_verified.json'), 'utf-8'));

// Map of trackingNumber -> pkg
const pkgMap = new Map();
existing.forEach(p => pkgMap.set(p.trackingNumber, p));

// The exact physical road network order
const roadCorridors = [
  // =========================================================================
  // KORIDOR 1: Jl. Raya Tlanakan, Tinjang & Bongkaran (Gerbang Masuk Utara)
  // =========================================================================
  {
    resi: 'JY2317132645', // emey
    area: '1. Jl. Raya Tlanakan, Tinjang & Bongkaran',
    lat: -7.2152, lng: 113.4515
  },
  {
    resi: 'JY2325110405', // NORMA LILIS ELLY SYAFINA
    area: '1. Jl. Raya Tlanakan, Tinjang & Bongkaran',
    lat: -7.2160, lng: 113.4513
  },
  {
    resi: 'JY2114706501', // Anis Ruslan (Pom Mini)
    area: '1. Jl. Raya Tlanakan, Tinjang & Bongkaran',
    lat: -7.2165, lng: 113.4509
  },
  {
    resi: 'JD0607945589', // Wati
    area: '1. Jl. Raya Tlanakan, Tinjang & Bongkaran',
    lat: -7.2166, lng: 113.4506
  },
  {
    resi: 'JY2330400615', // Andry Nurse
    area: '1. Jl. Raya Tlanakan, Tinjang & Bongkaran',
    lat: -7.2168, lng: 113.4503
  },
  {
    resi: 'JY2361998264', // kholis rozi (HM Lombok / Bank Jatim)
    area: '1. Jl. Raya Tlanakan, Tinjang & Bongkaran',
    lat: -7.2170, lng: 113.4504
  },
  {
    resi: 'JY2385401005', // ACH SAMLAN ARIFKI (1/3)
    area: '1. Jl. Raya Tlanakan, Tinjang & Bongkaran',
    lat: -7.2172, lng: 113.4502
  },
  {
    resi: 'JY2389282215', // ACH SAMLAN ARIFKI (2/3)
    area: '1. Jl. Raya Tlanakan, Tinjang & Bongkaran',
    lat: -7.2172, lng: 113.4502
  },
  {
    resi: 'JY2365756984', // ACH SAMLAN ARIFKI (3/3)
    area: '1. Jl. Raya Tlanakan, Tinjang & Bongkaran',
    lat: -7.2172, lng: 113.4502
  },
  {
    resi: 'JY2342551774', // giran rud (Pegadaian gang Toko Jamalia)
    area: '1. Jl. Raya Tlanakan, Tinjang & Bongkaran',
    lat: -7.2174, lng: 113.4505
  },

  // =========================================================================
  // KORIDOR 2: Dusun Gilin - Gang Pertama & Pertelon Masuk (Sisi Barat Utara)
  // =========================================================================
  {
    resi: 'JY2361775425', // Ulfi (gang pertama dari pertelon)
    area: '2. Dusun Gilin - Gang Pertama Masuk',
    lat: -7.2182, lng: 113.4497
  },
  {
    resi: 'JY2339774054', // Moh difal (gang pertama dekat SDN Branta 3)
    area: '2. Dusun Gilin - Gang Pertama Masuk',
    lat: -7.2185, lng: 113.4495
  },
  {
    resi: 'JY2305833883', // deck fia (belakang Toko Tegar)
    area: '2. Dusun Gilin - Gang Pertama Masuk',
    lat: -7.2188, lng: 113.4493
  },

  // =========================================================================
  // KORIDOR 3: Dusun Gilin - Plang NU & Masjid Al-Furqon (Sisi Barat Tengah)
  // =========================================================================
  {
    resi: 'JY2345965644', // Laily Rahmati (sebelah utara plang NU)
    area: '3. Dusun Gilin - Plang NU & Masjid Al-Furqon',
    lat: -7.2192, lng: 113.4491
  },
  {
    resi: 'JY2372683684', // fatimatus zahrah (Rujak Kelang Linda gang amal ke barat)
    area: '3. Dusun Gilin - Plang NU & Masjid Al-Furqon',
    lat: -7.2194, lng: 113.4487
  },
  {
    resi: 'JY2380772665', // MOH.FAHRI FIRDAUSY (Toko Sumber Rejeki sebelah Masjid Al-Furqon)
    area: '3. Dusun Gilin - Plang NU & Masjid Al-Furqon',
    lat: -7.2196, lng: 113.4489
  },
  {
    resi: 'JY2039636378', // Fina Mawatiningsih (Jl Pelabuhan Gilin)
    area: '3. Dusun Gilin - Plang NU & Masjid Al-Furqon',
    lat: -7.2197, lng: 113.4492
  },
  {
    resi: 'JY2393549784', // HILWATUL IMANI (belakang praktek Bidan Ririn)
    area: '3. Dusun Gilin - Plang NU & Masjid Al-Furqon',
    lat: -7.2198, lng: 113.4488
  },
  {
    resi: 'JY2302116655', // Diana Arika (TK Al-Amin Branta Pesisir Kampung KB)
    area: '3. Dusun Gilin - Plang NU & Masjid Al-Furqon',
    lat: -7.2199, lng: 113.4485
  },
  {
    resi: 'JY2303243634', // Renata (Kampung KB Jamu Hj Miski)
    area: '3. Dusun Gilin - Plang NU & Masjid Al-Furqon',
    lat: -7.2200, lng: 113.4484
  },
  {
    resi: 'JY2345944614', // iLisma (1/2) (Toko Jamu Hj Miski)
    area: '3. Dusun Gilin - Plang NU & Masjid Al-Furqon',
    lat: -7.2201, lng: 113.4486
  },
  {
    resi: 'JY2396327113', // iLisma (2/2) (Toko Jamu Hj Miski)
    area: '3. Dusun Gilin - Plang NU & Masjid Al-Furqon',
    lat: -7.2201, lng: 113.4486
  },

  // =========================================================================
  // KORIDOR 4: Bandaran & Dsn Tengah (Sisi Timur Jl. Pelabuhan)
  // =========================================================================
  {
    resi: 'JY2365329314', // Shadilaaa (Dsn Tengah 1, Gang Macho RT 04 RW 02)
    area: '4. Bandaran & Dsn Tengah (Sisi Timur)',
    lat: -7.2195, lng: 113.4508
  },
  {
    resi: 'JY2201486062', // Shintia agustin (Gang Jamu Dsn Tengah II depan Bakso Regas)
    area: '4. Bandaran & Dsn Tengah (Sisi Timur)',
    lat: -7.2201, lng: 113.4507
  },
  {
    resi: 'JY2369547074', // busar (Dusun Bandaran RT 11 RW 06)
    area: '4. Bandaran & Dsn Tengah (Sisi Timur)',
    lat: -7.2203, lng: 113.4513
  },
  {
    resi: 'JY2356845934', // SI. (Siti) (Dusun Bandaran RT 11 RW 06)
    area: '4. Bandaran & Dsn Tengah (Sisi Timur)',
    lat: -7.2204, lng: 113.4514
  },
  {
    resi: 'JY2358610394', // ria firda (1/3) (Dusun Bandaran RT 11 RW 06 Masjid Al-Amin)
    area: '4. Bandaran & Dsn Tengah (Sisi Timur)',
    lat: -7.2205, lng: 113.4518
  },
  {
    resi: 'JY2329651404', // ria firda (2/3) (Dusun Bandaran RT 11 RW 06 Masjid Al-Amin)
    area: '4. Bandaran & Dsn Tengah (Sisi Timur)',
    lat: -7.2205, lng: 113.4518
  },
  {
    resi: 'JY2392234005', // ria firda (3/3) (Dusun Bandaran RT 11 RW 06 Masjid Al-Amin)
    area: '4. Bandaran & Dsn Tengah (Sisi Timur)',
    lat: -7.2205, lng: 113.4518
  },
  {
    resi: 'JY2303657055', // Shellynovelianti (Jalan Pelabuhan Bandaran)
    area: '4. Bandaran & Dsn Tengah (Sisi Timur)',
    lat: -7.2208, lng: 113.4505
  },
  {
    resi: 'JY2322013874', // Sutan Taqdir Ali S (Musholla Al-Kautsar Bandaran)
    area: '4. Bandaran & Dsn Tengah (Sisi Timur)',
    lat: -7.2210, lng: 113.4510
  },
  {
    resi: 'JY2305114214', // Dede ratna (Sebelum Musholla Al-Kautsar Warung Ratna Kelang)
    area: '4. Bandaran & Dsn Tengah (Sisi Timur)',
    lat: -7.2211, lng: 113.4509
  },

  // =========================================================================
  // KORIDOR 5: Balai Desa & Dusun Lunas (Tengah - Selatan)
  // =========================================================================
  {
    resi: 'JY2332673585', // Disa (Gerbang Balai Desa ke timur rumah ungu)
    area: '5. Balai Desa & Dusun Lunas',
    lat: -7.2213, lng: 113.4507
  },
  {
    resi: 'JY2390296874', // zril (Balai Desa Branta Pesisir)
    area: '5. Balai Desa & Dusun Lunas',
    lat: -7.2215, lng: 113.4506
  },
  {
    resi: 'JY2373348914', // chandrasingaraja (Dusun Lunas ke timur Balai Desa)
    area: '5. Balai Desa & Dusun Lunas',
    lat: -7.2216, lng: 113.4508
  },
  {
    resi: 'JY2306116556', // BUSTANIL FIRDAUSI (Dusun Lunas belakang Balai Desa)
    area: '5. Balai Desa & Dusun Lunas',
    lat: -7.2217, lng: 113.4504
  },
  {
    resi: 'JY2329110605', // ria firda (Paket Lunas dekat Balai Desa)
    area: '5. Balai Desa & Dusun Lunas',
    lat: -7.2218, lng: 113.4503
  },
  {
    resi: 'JY2336388883', // fithujjet (1/2) (Jl Branta Pesisir Dusun Lunas RT 01 RW 01)
    area: '5. Balai Desa & Dusun Lunas',
    lat: -7.2219, lng: 113.4502
  },
  {
    resi: 'JY2307143905', // fithujjet (2/2) (Jl Branta Pesisir Dusun Lunas RT 01 RW 01)
    area: '5. Balai Desa & Dusun Lunas',
    lat: -7.2219, lng: 113.4502
  },
  {
    resi: 'JY2359250465', // handri farisi / Ezik (Dusun Lunas RT 01 RW 01)
    area: '5. Balai Desa & Dusun Lunas',
    lat: -7.2220, lng: 113.4501
  },
  {
    resi: 'JY2311228434', // zahwa is (Dusun Lunas Gang Ria Firda)
    area: '5. Balai Desa & Dusun Lunas',
    lat: -7.2221, lng: 113.4503
  },
  {
    resi: 'JY2350238454', // wiwik hasanah (1/2) (Dsn Lunas RT 1 RW 1)
    area: '5. Balai Desa & Dusun Lunas',
    lat: -7.2208, lng: 113.4502
  },
  {
    resi: 'JY2393287874', // wiwik hasanah (2/2) (Dsn Lunas RT 1 RW 1)
    area: '5. Balai Desa & Dusun Lunas',
    lat: -7.2208, lng: 113.4502
  },
  {
    resi: 'JY2339651105', // ummi barokah (Jalan Raya Branta Dusun Lunas RT 01 RW 01)
    area: '5. Balai Desa & Dusun Lunas',
    lat: -7.2223, lng: 113.4500
  },
  {
    resi: 'JY2309081774', // cintami (Dusun Lunas RT 02 RW 01)
    area: '5. Balai Desa & Dusun Lunas',
    lat: -7.2224, lng: 113.4501
  },
  {
    resi: 'JY2385670835', // Les wiko (Jalan Pelabuhan Dusun Lunas timur Rujak Kelang Bak Kur)
    area: '5. Balai Desa & Dusun Lunas',
    lat: -7.2226, lng: 113.4499
  },

  // =========================================================================
  // KORIDOR 6: Pelabuhan, TPI & Dermaga Branta (Ujung Selatan)
  // =========================================================================
  {
    resi: 'JY2385741934', // alhanani efendi (Jalan Pelabuhan poros)
    area: '6. Pelabuhan, TPI & Dermaga Branta',
    lat: -7.2245, lng: 113.4498
  },
  {
    resi: 'JY2305814852', // Atikah Titik (Pelabuhan Branta pasar ikan TPI)
    area: '6. Pelabuhan, TPI & Dermaga Branta',
    lat: -7.2254, lng: 113.4493
  },
  {
    resi: 'JY2305115566', // Rujak Kelang Lek bibeh (Warung Pojok Rujak Kelang Lek Bibeh TPI)
    area: '6. Pelabuhan, TPI & Dermaga Branta',
    lat: -7.2256, lng: 113.4491
  },
  {
    resi: 'JY2315229254', // Via (Gerbang Dermaga Branta Pesisir ada lorong)
    area: '6. Pelabuhan, TPI & Dermaga Branta',
    lat: -7.2265, lng: 113.4489
  },
  {
    resi: 'JY2354964304', // ddok (Pelabuhan Dermaga ke barat Hj Muhalli)
    area: '6. Pelabuhan, TPI & Dermaga Branta',
    lat: -7.2267, lng: 113.4487
  },
  {
    resi: 'JY2306110531', // Fina khairul laili (Bandaran ke barat Gerbang Dermaga H Muhalli)
    area: '6. Pelabuhan, TPI & Dermaga Branta',
    lat: -7.2268, lng: 113.4488
  },
  {
    resi: 'JY2322594124', // jihan amir (Dermaga Branta dekat rumah H Muhalli / Tus)
    area: '6. Pelabuhan, TPI & Dermaga Branta',
    lat: -7.2270, lng: 113.4486
  }
];

console.log(`Re-ordering ${roadCorridors.length} packages according to actual road network...`);

const orderedPackages = roadCorridors.map((rc, idx) => {
  const p = pkgMap.get(rc.resi);
  if (!p) {
    console.error(`Error: Resi ${rc.resi} not found in existing!`);
    return null;
  }
  return {
    ...p,
    id: `pkg-20261125-${String(idx + 1).padStart(2, '0')}`,
    areaOrStreet: rc.area,
    lat: rc.lat,
    lng: rc.lng,
    orderIndex: idx + 1
  };
}).filter(Boolean);

console.log(`Successfully ordered ${orderedPackages.length} packages.`);

fs.writeFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'packages_25_nov_verified.json'), JSON.stringify(orderedPackages, null, 2));

// Print summary per koridor
const areas = {};
orderedPackages.forEach(p => {
  if (!areas[p.areaOrStreet]) areas[p.areaOrStreet] = { count: 0, cod: 0 };
  areas[p.areaOrStreet].count++;
  areas[p.areaOrStreet].cod += p.codAmount;
});

console.log('\n--- KORIDOR JALAN FISIK ---');
for (const [a, info] of Object.entries(areas)) {
  console.log(`${a}: ${info.count} paket (COD: Rp ${info.cod.toLocaleString('id-ID')})`);
}
