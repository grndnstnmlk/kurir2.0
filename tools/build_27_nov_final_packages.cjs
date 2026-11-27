const fs = require('fs');
const path = require('path');

// 46 Verified Packages for Friday, 27 November 2026 (Extracted from Recording-2026-11-27-083957.mp4)
// Matches official J&T Sprinter app count: Sedang Delivery(46) across 39 stops.
// Organized cleanly into 6 physical road corridors across Branta Pesisir & Tlanakan (North -> South, West Macho -> East Lunas -> Dermaga).

const rawList = [
  // =========================================================================
  // ZONA 1: Jl. Raya Tlanakan, Tinjang & Jl. Pelabuhan Utara (3 Paket)
  // =========================================================================
  {
    resi: 'JY2384373096',
    name: 'WAHDINI MILADIA',
    phone: '08******0175',
    addr: 'Jalan Raya Branta Pesisir, Tlanakan, Dusun Tinjang, Rujak Kelang Bak Fat TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Tinjang & Pelabuhan Utara',
    bench: 'Dusun Tinjang, Rujak Kelang Bak Fat',
    cod: 29189,
    lat: -7.2165,
    lng: 113.4502
  },
  {
    resi: 'JY2340805568',
    name: 'Kafa',
    phone: '08******1332',
    addr: 'Jl. Pelabuhan jalan menuju dermaga ada warung warna merah sebelah kiri di pinggirnya las besi TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Tinjang & Pelabuhan Utara',
    bench: 'Jl. Pelabuhan Warung Merah Pinggir Las Besi',
    cod: 166933,
    lat: -7.21705,
    lng: 113.45040
  },
  {
    resi: 'JY2323923786',
    name: 'Citra Fiber',
    phone: '08******5111',
    addr: 'Jalan Pelabuhan Branta Pesisir, Rumah RI Fiber TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Tinjang & Pelabuhan Utara',
    bench: 'Jl. Pelabuhan Branta Pesisir, Rumah RI Fiber',
    cod: 92920,
    lat: -7.2185,
    lng: 113.4498
  },

  // =========================================================================
  // ZONA 2: Dusun Tengah & Sekitar Masjid At-Taqwa / Nurul Fatih (7 Paket)
  // =========================================================================
  {
    resi: 'JY2337945456',
    name: 'Hadeh Riskan Pamong',
    phone: '08******7934',
    addr: 'Dusun Tengah 1 depan Musholla Nurul Fatih, Desa Branta Pesisir TLANAKAN',
    area: '2. Dusun Tengah & Masjid At-Taqwa',
    bench: 'Depan Musholla Nurul Fatih, Dusun Tengah 1',
    cod: 57368,
    lat: -7.2196,
    lng: 113.4494
  },
  {
    resi: 'JY2335264657',
    name: 'Yanto',
    phone: '08******7330',
    addr: 'Desa Branta Pesisir Dusun Tengah 1 TLANAKAN',
    area: '2. Dusun Tengah & Masjid At-Taqwa',
    bench: 'Dusun Tengah 1, Branta Pesisir',
    cod: 76255,
    lat: -7.21985,
    lng: 113.44925
  },
  {
    resi: 'JY2352148552',
    name: 'Izza',
    phone: '08******0953',
    addr: 'Belakang Masjid Taqwa, Branta Pesisir, Kec. Tlanakan, Kab. Pamekasan TLANAKAN',
    area: '2. Dusun Tengah & Masjid At-Taqwa',
    bench: 'Belakang Masjid At-Taqwa',
    cod: 78224,
    lat: -7.2202,
    lng: 113.4496
  },
  {
    resi: 'JY2349245846',
    name: 'Kevan Kevan (Paket 1/2)',
    phone: '08******1946',
    addr: 'Dusun Tengah 2, RT.06/RW.04, di belakang Masjid Taqwa TLANAKAN',
    area: '2. Dusun Tengah & Masjid At-Taqwa',
    bench: 'Belakang Masjid At-Taqwa, Dusun Tengah 2 RT 06/04',
    cod: 12423,
    lat: -7.2203,
    lng: 113.4497
  },
  {
    resi: 'JY2368191787',
    name: 'Kevan Kevan (Paket 2/2)',
    phone: '08******1946',
    addr: 'Dusun Tengah 2, RT.06/RW.04, di belakang Masjid Taqwa TLANAKAN',
    area: '2. Dusun Tengah & Masjid At-Taqwa',
    bench: 'Belakang Masjid At-Taqwa, Dusun Tengah 2 RT 06/04',
    cod: 16463,
    lat: -7.2203,
    lng: 113.4497
  },
  {
    resi: 'JY2384955636',
    name: 'Ibu Agama',
    phone: '08******3282',
    addr: 'Masjid At-Taqwa, Gang Masjid Taqwa, Branta Pesisir TLANAKAN',
    area: '2. Dusun Tengah & Masjid At-Taqwa',
    bench: 'Gang Masjid At-Taqwa',
    cod: 101,
    lat: -7.2201,
    lng: 113.4499
  },
  {
    resi: 'JY2301625717',
    name: 'Finda',
    phone: '08******1960',
    addr: 'Pelabuhan Branta, Jalan Pelabuhan Branta Pesisir, Masjid Taqwa TLANAKAN',
    area: '2. Dusun Tengah & Masjid At-Taqwa',
    bench: 'Jl. Pelabuhan Branta, Sekitar Masjid Taqwa',
    cod: 36966,
    lat: -7.2204,
    lng: 113.4495
  },

  // =========================================================================
  // ZONA 3: Dusun Mayang, Bandaran RT 11 & Gang Macho (14 Paket)
  // =========================================================================
  {
    resi: 'JY2331079366',
    name: 'Farida',
    phone: '08******1667',
    addr: 'Gang Macho, Dusun Mayang, Branta Pesisir TLANAKAN',
    area: '3. Dusun Mayang & Koridor Gang Macho',
    bench: 'Gang Macho, Dusun Mayang',
    cod: 32800,
    lat: -7.2206,
    lng: 113.44845
  },
  {
    resi: 'JY2367780937',
    name: 'Novi Zevanya',
    phone: '08******6748',
    addr: 'Mayang, Branta Pesisir, Kab. Pamekasan, Gang Macho TLANAKAN',
    area: '3. Dusun Mayang & Koridor Gang Macho',
    bench: 'Dusun Mayang, Gang Macho',
    cod: 138738,
    lat: -7.2207,
    lng: 113.4484
  },
  {
    resi: 'JY2313369945',
    name: 'Radha, Raja',
    phone: '08******2713',
    addr: 'Branta Pasisir Kel., Jalan Raya Branta Gg. Macho, Dusun Mayang TLANAKAN',
    area: '3. Dusun Mayang & Koridor Gang Macho',
    bench: 'Jl. Raya Branta, Gg. Macho Dusun Mayang',
    cod: 73124,
    lat: -7.2208,
    lng: 113.44835
  },
  {
    resi: 'JY2351109236',
    name: 'Mamanya Gibran',
    phone: '08******3379',
    addr: 'Branta Pesisir Dusun Mayang Gang Macho TLANAKAN',
    area: '3. Dusun Mayang & Koridor Gang Macho',
    bench: 'Dusun Mayang, Gang Macho',
    cod: 19897,
    lat: -7.2209,
    lng: 113.4483
  },
  {
    resi: 'JY2309698935',
    name: 'Cindy (Paket 1/3)',
    phone: '08******4249',
    addr: 'Pamekasan Tlanakan Branta Pasisir Dusun Mayang Jalan Gg. Macho TLANAKAN',
    area: '3. Dusun Mayang & Koridor Gang Macho',
    bench: 'Jalan Gg. Macho, Dusun Mayang',
    cod: 13433,
    lat: -7.2210,
    lng: 113.44825
  },
  {
    resi: 'JY2302198945',
    name: 'Cindy (Paket 2/3)',
    phone: '08******4249',
    addr: 'Pamekasan Tlanakan Branta Pasisir Dusun Mayang Jalan Gg. Macho TLANAKAN',
    area: '3. Dusun Mayang & Koridor Gang Macho',
    bench: 'Jalan Gg. Macho, Dusun Mayang',
    cod: 0,
    lat: -7.2210,
    lng: 113.44825
  },
  {
    resi: 'JY2304875327',
    name: 'Cindy (Paket 3/3)',
    phone: '08******4249',
    addr: 'Pamekasan Tlanakan Branta Pasisir Dusun Mayang Jalan Gg. Macho TLANAKAN',
    area: '3. Dusun Mayang & Koridor Gang Macho',
    bench: 'Jalan Gg. Macho, Dusun Mayang',
    cod: 14443,
    lat: -7.2210,
    lng: 113.44825
  },
  {
    resi: 'JY2338299726',
    name: 'Kiran Haza',
    phone: '08******9575',
    addr: 'Jalan Branta Pasisir, Dusun Tengah 1, Gang Macho Kec. Tlanakan Kab. Pamekasan TLANAKAN',
    area: '3. Dusun Mayang & Koridor Gang Macho',
    bench: 'Dusun Tengah 1, Gang Macho',
    cod: 29447,
    lat: -7.2211,
    lng: 113.4482
  },
  {
    resi: 'JY2356939086',
    name: 'Chieka Annajwa (Paket 1/2)',
    phone: '08******8051',
    addr: 'Branta Pasisir, Dusun Mayang Gang Macho di depan Warung Angker TLANAKAN',
    area: '3. Dusun Mayang & Koridor Gang Macho',
    bench: 'Gang Macho, Depan Warung Angker',
    cod: 25351,
    lat: -7.2212,
    lng: 113.4483
  },
  {
    resi: 'JY2395222617',
    name: 'Chieka Annajwa (Paket 2/2)',
    phone: '08******8051',
    addr: 'Branta Pasisir, Dusun Mayang Gang Macho di depan Warung Angker TLANAKAN',
    area: '3. Dusun Mayang & Koridor Gang Macho',
    bench: 'Gang Macho, Depan Warung Angker',
    cod: 48789,
    lat: -7.2212,
    lng: 113.4483
  },
  {
    resi: 'JY2388596687',
    name: 'ALDI RAMBO',
    phone: '08******2589',
    addr: 'Bandaran, Branta Pesisir, Kec. Tlanakan, Kab. Pamekasan, Gang Macho TLANAKAN',
    area: '3. Dusun Mayang & Koridor Gang Macho',
    bench: 'Bandaran, Gang Macho',
    cod: 27676,
    lat: -7.2213,
    lng: 113.4484
  },
  {
    resi: 'JY2304937865',
    name: 'Is Mahhur',
    phone: '08******1382',
    addr: 'Branta Pesisir Gang Macho TLANAKAN',
    area: '3. Dusun Mayang & Koridor Gang Macho',
    bench: 'Gang Macho, Branta Pesisir',
    cod: 54237,
    lat: -7.2214,
    lng: 113.4485
  },
  {
    resi: 'JY2350669845',
    name: 'Ulpaaa',
    phone: '08******6787',
    addr: 'Jl. Pelabuhan No. 15, Gang Macho, Branta Pesisir TLANAKAN',
    area: '3. Dusun Mayang & Koridor Gang Macho',
    bench: 'Jl. Pelabuhan No. 15, Gang Macho',
    cod: 71609,
    lat: -7.2215,
    lng: 113.4486
  },
  {
    resi: 'JY2329726816',
    name: 'Baitul Sunar',
    phone: '08******5685',
    addr: 'Branta Pesisir, Dusun Bandaran RT 11 RW 06, Gang Macho ke selatan TLANAKAN',
    area: '3. Dusun Mayang & Koridor Gang Macho',
    bench: 'Dusun Bandaran RT 11 RW 06, Gang Macho ke Selatan',
    cod: 34945,
    lat: -7.22165,
    lng: 113.4487
  },

  // =========================================================================
  // ZONA 4: Bandaran Timur (Al-Amin/Al-Kautsar) & Balai Desa / Gg. Anggrek (6 Paket)
  // =========================================================================
  {
    resi: 'JY2306984206',
    name: 'Ria Firda',
    phone: '08******9648',
    addr: 'Branta Pesisir, Dusun Bandaran RT 11 RW 06, Masjid Al-Amin ke timur mentok TLANAKAN',
    area: '4. Bandaran Timur, Balai Desa & Gg. Anggrek',
    bench: 'Dusun Bandaran RT 11/06, Masjid Al-Amin ke Timur Mentok',
    cod: 46258,
    lat: -7.22120,
    lng: 113.45099
  },
  {
    resi: 'JY2358871867',
    name: 'Ruslannaniss',
    phone: '08******4686',
    addr: 'Jalan Pelabuhan Branta, ke timur balai mentok ketimur sampai tikungan ke kiri, jalan kecil deretan rumah Ria Firda TLANAKAN',
    area: '4. Bandaran Timur, Balai Desa & Gg. Anggrek',
    bench: 'Timur Balai Mentok Tikungan Kiri, Deretan Rumah Ria Firda',
    cod: 34945,
    lat: -7.22125,
    lng: 113.45105
  },
  {
    resi: 'JY2326443137',
    name: 'Dede Ratna',
    phone: '08******4214',
    addr: 'Branta Pesisir sebelum Musholla Al-Kautsar ada warung penjual Ratna kelang (di telfon ya om) TLANAKAN',
    area: '4. Bandaran Timur, Balai Desa & Gg. Anggrek',
    bench: 'Sebelum Musholla Al-Kautsar, Warung Ratna Kelang',
    cod: 16867,
    lat: -7.22110,
    lng: 113.45090
  },
  {
    resi: 'JY2355245156',
    name: 'Anisa FK',
    phone: '08******0734',
    addr: 'Branta Pasisir, Dusun Lunas, belakang Balai Desa TLANAKAN',
    area: '4. Bandaran Timur, Balai Desa & Gg. Anggrek',
    bench: 'Belakang Balai Desa, Dusun Lunas',
    cod: 16766,
    lat: -7.22175,
    lng: 113.45015
  },
  {
    resi: 'JY2385098565',
    name: 'Ledi Fatika',
    phone: '08******3944',
    addr: 'Branta Pasisir, Jalan Pelabuhan Dusun Lunas Gang Anggrek belakang Balai Desa TLANAKAN',
    area: '4. Bandaran Timur, Balai Desa & Gg. Anggrek',
    bench: 'Gang Anggrek Belakang Balai Desa',
    cod: 177760,
    lat: -7.22190,
    lng: 113.45010
  },
  {
    resi: 'JY2382957375',
    name: 'Imam Surya',
    phone: '08******9944',
    addr: 'Jln Pelabuhan Gg. Anggrek 5A, Branta Pesisir Timur Balai Desa TLANAKAN',
    area: '4. Bandaran Timur, Balai Desa & Gg. Anggrek',
    bench: 'Gg. Anggrek 5A, Timur Balai Desa',
    cod: 106060,
    lat: -7.22185,
    lng: 113.45025
  },

  // =========================================================================
  // ZONA 5: Dusun Lunas (Timur Balai Desa, Bowo Cell & Gg. Es Batu) (14 Paket)
  // =========================================================================
  {
    resi: 'JY2380497505',
    name: 'Iik Nindy',
    phone: '08******3389',
    addr: 'Ke timur gang Balai Desa Branta Pesisir, Dsn. Lunas TLANAKAN',
    area: '5. Dusun Lunas, Bowo Cell & Gg. Es Batu',
    bench: 'Gang Balai Desa ke Timur, Dusun Lunas',
    cod: 10452,
    lat: -7.22135,
    lng: 113.45075
  },
  {
    resi: 'JY2339248557',
    name: 'Imell',
    phone: '08******0044',
    addr: 'Branta Pesisir, Dusun Lunas ke timur Balai Desa TLANAKAN',
    area: '5. Dusun Lunas, Bowo Cell & Gg. Es Batu',
    bench: 'Ke Timur Balai Desa, Dusun Lunas',
    cod: 24654,
    lat: -7.22140,
    lng: 113.45090
  },
  {
    resi: 'JY2315054217',
    name: 'Denispiping',
    phone: '08******0985',
    addr: 'Ke timur Balai Desa Branta Pesisir Dusun Lunas RT 01 RW 01 Desa Branta Pesisir Tlanakan Pamekasan TLANAKAN',
    area: '5. Dusun Lunas, Bowo Cell & Gg. Es Batu',
    bench: 'Timur Balai Desa, Dusun Lunas RT 01 RW 01',
    cod: 16967,
    lat: -7.22133,
    lng: 113.45115
  },
  {
    resi: 'JY2375139966',
    name: 'Danasafir123 (Paket 1/2)',
    phone: '08******4929',
    addr: 'Branta Pesisir, Dusun Lunas RT 001 RW 001 TLANAKAN',
    area: '5. Dusun Lunas, Bowo Cell & Gg. Es Batu',
    bench: 'Dusun Lunas RT 001 RW 001',
    cod: 21715,
    lat: -7.22134,
    lng: 113.45130
  },
  {
    resi: 'JY2394308465',
    name: 'Danasafir123 (Paket 2/2)',
    phone: '08******4929',
    addr: 'Branta Pesisir, Dusun Lunas RT 001 RW 001 TLANAKAN',
    area: '5. Dusun Lunas, Bowo Cell & Gg. Es Batu',
    bench: 'Dusun Lunas RT 001 RW 001',
    cod: 26866,
    lat: -7.22134,
    lng: 113.45130
  },
  {
    resi: 'JY2349808405',
    name: 'Chandrasingaraja6',
    phone: '08******6318',
    addr: 'Ila Dusun Lunas ke timur Balai Desa TLANAKAN',
    area: '5. Dusun Lunas, Bowo Cell & Gg. Es Batu',
    bench: 'Dusun Lunas ke Timur Balai Desa',
    cod: 57191,
    lat: -7.22144,
    lng: 113.45143
  },
  {
    resi: 'JY2334523697',
    name: 'Candra Ila',
    phone: '08******6318',
    addr: 'Branta Pesisir, Dusun Lunas TLANAKAN',
    area: '5. Dusun Lunas, Bowo Cell & Gg. Es Batu',
    bench: 'Dusun Lunas (Satu Kontak Chandrasingaraja)',
    cod: 55449,
    lat: -7.22144,
    lng: 113.45143
  },
  {
    resi: 'JY2323131886',
    name: 'Nur Sugik',
    phone: '08******2591',
    addr: 'Jl. Pelabuhan Branta Pasisir, Dsn. Lunas, Bowo Cell mentok belok kanan dikit TLANAKAN',
    area: '5. Dusun Lunas, Bowo Cell & Gg. Es Batu',
    bench: 'Bowo Cell Mentok Belok Kanan Dikit, Dsn Lunas',
    cod: 62721,
    lat: -7.22148,
    lng: 113.45050
  },
  {
    resi: 'JY2332277065',
    name: 'Desi Rahman',
    phone: '08******9330',
    addr: 'Branta Pesisir, Jalan Raya Branta, Dusun Lunas ketimur Bowo Cell TLANAKAN',
    area: '5. Dusun Lunas, Bowo Cell & Gg. Es Batu',
    bench: 'Dusun Lunas ke Timur Bowo Cell',
    cod: 119332,
    lat: -7.22152,
    lng: 113.45068
  },
  {
    resi: 'JY2325542216',
    name: 'Diva Aulia Yasmin',
    phone: '08******4412',
    addr: 'Branta Pasisir, Dsn Lunas, Pamekasan, Tlanakan, Jawa Timur TLANAKAN',
    area: '5. Dusun Lunas, Bowo Cell & Gg. Es Batu',
    bench: 'Dusun Lunas, Branta Pesisir',
    cod: 11558,
    lat: -7.22200,
    lng: 113.45020
  },
  {
    resi: 'JY2356546945',
    name: 'Cintami (Paket 1/2)',
    phone: '08******1173',
    addr: 'Dusun Lunas RT 02 RW 01, Branta Pesisir Tlanakan Pamekasan TLANAKAN',
    area: '5. Dusun Lunas, Bowo Cell & Gg. Es Batu',
    bench: 'Dusun Lunas RT 02 RW 01',
    cod: 117200,
    lat: -7.22240,
    lng: 113.45010
  },
  {
    resi: 'JY2319004337',
    name: 'Cintami (Paket 2/2)',
    phone: '08******1173',
    addr: 'Dusun Lunas RT 02 RW 01, Branta Pesisir Tlanakan Pamekasan TLANAKAN',
    area: '5. Dusun Lunas, Bowo Cell & Gg. Es Batu',
    bench: 'Dusun Lunas RT 02 RW 01',
    cod: 51912,
    lat: -7.22240,
    lng: 113.45010
  },
  {
    resi: 'JY2330725496',
    name: 'Darul (Paket 1/2)',
    phone: '08******6339',
    addr: 'Branta Pesisir Dusun Lunas Gg. Es Batu TLANAKAN',
    area: '5. Dusun Lunas, Bowo Cell & Gg. Es Batu',
    bench: 'Dusun Lunas, Gg. Es Batu',
    cod: 24339,
    lat: -7.22270,
    lng: 113.44985
  },
  {
    resi: 'JY2322459396',
    name: 'Darul (Paket 2/2)',
    phone: '08******6339',
    addr: 'Branta Pesisir Dusun Lunas Gg. Es Batu TLANAKAN',
    area: '5. Dusun Lunas, Bowo Cell & Gg. Es Batu',
    bench: 'Dusun Lunas, Gg. Es Batu',
    cod: 30672,
    lat: -7.22270,
    lng: 113.44985
  },

  // =========================================================================
  // ZONA 6: Pelabuhan Selatan & Dermaga Branta (2 Paket)
  // =========================================================================
  {
    resi: 'JY2343587915',
    name: "Holla'e",
    phone: '08******2500',
    addr: 'Warung pojok Buk Sipol atau rumah Pak Sunah, Branta Pesisir TLANAKAN',
    area: '6. Pelabuhan & Dermaga Branta',
    bench: 'Warung Pojok Buk Sipol / Rumah Pak Sunah',
    cod: 14443,
    lat: -7.2248,
    lng: 113.4492
  },
  {
    resi: 'JY2350631127',
    name: 'Rahmatullah',
    phone: '08******6634',
    addr: 'Branta Pesisir, Kab. Pamekasan, Gerbang Dermaga ke barat TLANAKAN',
    area: '6. Pelabuhan & Dermaga Branta',
    bench: 'Gerbang Dermaga Branta ke Barat',
    cod: 37975,
    lat: -7.2265,
    lng: 113.4488
  }
];

const packages = rawList.map((item, idx) => {
  const isCod = item.cod > 0;
  return {
    id: `pkg-20261127-${String(idx + 1).padStart(2, '0')}`,
    trackingNumber: item.resi,
    recipientName: item.name,
    recipientPhone: item.phone,
    fullAddress: item.addr,
    areaOrStreet: item.area,
    benchmark: item.bench,
    isCod,
    codAmount: item.cod,
    status: 'pending',
    lat: item.lat,
    lng: item.lng,
    orderIndex: idx + 1,
    createdAt: '2026-11-27T08:00:00.000Z'
  };
});

// Sanity validation against OCR cards_27_nov.json
const ocrCards = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'cards_27_nov.json'), 'utf-8'));
const ocrResiSet = new Set(ocrCards.map(c => c.trackingNumber));
const finalResiSet = new Set(packages.map(p => p.trackingNumber));

const missingInFinal = [...ocrResiSet].filter(r => !finalResiSet.has(r));
const extraInFinal = [...finalResiSet].filter(r => !ocrResiSet.has(r));
if (missingInFinal.length || extraInFinal.length || packages.length !== 46) {
  console.error('MISMATCH!', { missingInFinal, extraInFinal, len: packages.length });
  process.exit(1);
}

// Verify every COD matches OCR card
packages.forEach(p => {
  const oc = ocrCards.find(c => c.trackingNumber === p.trackingNumber);
  if (!oc || oc.codAmount !== p.codAmount) {
    console.error('COD MISMATCH for', p.trackingNumber, 'final=', p.codAmount, 'ocr=', oc && oc.codAmount);
    process.exit(1);
  }
});

const codCount = packages.filter(p => p.isCod).length;
const nonCodCount = packages.filter(p => !p.isCod).length;
const totalBaseCod = packages.reduce((s, p) => s + p.codAmount, 0);

console.log(`Generated & 100% cross-verified ${packages.length} packages for 27 November 2026!`);
console.log(`COD: ${codCount} paket | Non-COD: ${nonCodCount} paket | Total Setoran COD Asli: Rp ${totalBaseCod.toLocaleString('id-ID')}`);

const outPath = path.join(__dirname, '..', 'screenshot alamat paket', 'packages_27_nov_verified.json');
fs.writeFileSync(outPath, JSON.stringify(packages, null, 2), 'utf-8');
console.log(`Saved to ${outPath}`);
