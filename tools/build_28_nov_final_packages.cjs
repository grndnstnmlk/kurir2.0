const fs = require('fs');
const path = require('path');

// 69 Verified Packages for Saturday, 28 November 2026 (Extracted from Recording-2026-11-28-093839.mp4)
// Matches official J&T Sprinter app count: Sedang Delivery(69).
// Organized cleanly into 6 physical road corridors across Branta Pesisir & Tlanakan.

const rawList = [
  // =========================================================================
  // ZONA 1: Jl. Raya Tlanakan, Pegadaian & Pasar Branta (8 Paket)
  // =========================================================================
  {
    resi: 'JY2313303088',
    name: 'Amarta Dinda',
    phone: '08******5011',
    addr: 'Jl. Branta Pasisir No. 1 TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Pegadaian & Pasar Branta',
    bench: 'Jl. Branta Pasisir No. 1',
    cod: 59438,
    lat: -7.2178,
    lng: 113.4501
  },
  {
    resi: 'JY2351820157',
    name: 'Ach Samlan Arifki',
    phone: '08******6305',
    addr: 'Sebelah barat Pegadaian ke selatan sebelum Toko Zainab (Betor) TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Pegadaian & Pasar Branta',
    bench: 'Barat Pegadaian Sebelum Toko Zainab (Betor)',
    cod: 44051,
    lat: -7.2172,
    lng: 113.4502
  },
  {
    resi: 'JY2348403178',
    name: 'Wilda Yuliani Sucipto (Paket 1/2)',
    phone: '08******9605',
    addr: 'Pegadaian, Jl. Raya Tlanakan, Bandaran, Branta Pesisir, rumah pertama di belakang pasar timur Pegadaian (Gudang ikan) TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Pegadaian & Pasar Branta',
    bench: 'Belakang Pasar Timur Pegadaian (Gudang Ikan)',
    cod: 94939,
    lat: -7.2181,
    lng: 113.4498
  },
  {
    resi: 'JY2322001618',
    name: 'Wilda Yuliani Sucipto (Paket 2/2)',
    phone: '08******9605',
    addr: 'Pegadaian, Jl. Raya Tlanakan, Bandaran, Branta Pesisir, rumah pertama di belakang pasar timur Pegadaian (Gudang ikan) TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Pegadaian & Pasar Branta',
    bench: 'Belakang Pasar Timur Pegadaian (Gudang Ikan)',
    cod: 77938,
    lat: -7.2181,
    lng: 113.4498
  },
  {
    resi: 'JY2335248878',
    name: 'Anis Surur',
    phone: '08******0659',
    addr: 'Dsn. Gilin, Branta Pesisir, belakang Pegadaian gang pasar rumah warna kuning pagar hitam TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Pegadaian & Pasar Branta',
    bench: 'Belakang Pegadaian Gg. Pasar, Rumah Kuning Pagar Hitam',
    cod: 69185,
    lat: -7.2183,
    lng: 113.4496
  },
  {
    resi: 'JY2372867717',
    name: 'Anisa',
    phone: '08******5619',
    addr: 'Pasar Branta, Jl. Raya Branta Belakang Pasar, Gang Pegadaian, Branta Pesisir (RT.06/RW.03) TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Pegadaian & Pasar Branta',
    bench: 'Belakang Pasar Branta, Gang Pegadaian RT 06/03',
    cod: 28965,
    lat: -7.2186,
    lng: 113.4495
  },
  {
    resi: 'JY2377045577',
    name: 'Erin (Paket 1/2)',
    phone: '08******6150',
    addr: 'Belakang Pasar Branta Pesisir, selatan Wanita Mart TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Pegadaian & Pasar Branta',
    bench: 'Belakang Pasar, Selatan Wanita Mart',
    cod: 0,
    lat: -7.2191,
    lng: 113.4497
  },
  {
    resi: 'JY2390216586',
    name: 'Erin (Paket 2/2)',
    phone: '08******6150',
    addr: 'Belakang Pasar Branta Pesisir, selatan Wanita Mart TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Pegadaian & Pasar Branta',
    bench: 'Belakang Pasar, Selatan Wanita Mart',
    cod: 0,
    lat: -7.2191,
    lng: 113.4497
  },
  {
    resi: 'JY2319911917',
    name: 'Milly Aprili Rukbana',
    phone: '087712082744',
    addr: 'Branta Pasisir Kel., Jalan Raya Branta Belakang Pasar, belakang Toko Wamira TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Pegadaian & Pasar Branta',
    bench: 'Belakang Pasar, Belakang Toko Wamira',
    cod: 305256,
    lat: -7.22074403151731,
    lng: 113.450260804421
  },

  // =========================================================================
  // ZONA 2: Dusun Gilin Utara & Gang Pertama (Polsek Lama, SDN Branta 3, Toko Zainab) (9 Paket)
  // =========================================================================
  {
    resi: 'JY2358079887',
    name: 'ZALBOYY (Rizal)',
    phone: '08******3884',
    addr: 'Dsn. Gilin, Branta Pesisir di belakang Polsek Tlanakan yang lama / Dusun Gilin gang pertama TLANAKAN',
    area: '2. Dusun Gilin Utara & Gang Pertama',
    bench: 'Belakang Polsek Tlanakan Lama, Dsn. Gilin Gg. Pertama',
    cod: 66549,
    lat: -7.21783381310194,
    lng: 113.449114793269
  },
  {
    resi: 'JY2319663888',
    name: 'lim 369',
    phone: '08******4908',
    addr: 'Toko Zainab sebelah ada jual betor, Branta Pesisir TLANAKAN',
    area: '2. Dusun Gilin Utara & Gang Pertama',
    bench: 'Sebelah Toko Zainab (Jual Betor)',
    cod: 17225,
    lat: -7.21896325962909,
    lng: 113.448191899395
  },
  {
    resi: 'JY2388844608',
    name: 'Kharisma DA',
    phone: '08******6006',
    addr: 'Gang sebelah Toko Zainab, utara SDN Branta 3 TLANAKAN',
    area: '2. Dusun Gilin Utara & Gang Pertama',
    bench: 'Gg. Sebelah Toko Zainab, Utara SDN Branta 3',
    cod: 24745,
    lat: -7.2188,
    lng: 113.4484
  },
  {
    resi: 'JY2338322768',
    name: 'Fenn',
    phone: '08******2663',
    addr: 'Jalan Pelabuhan Branta gang pertama dari pertelon TLANAKAN',
    area: '2. Dusun Gilin Utara & Gang Pertama',
    bench: 'Jl. Pelabuhan Branta, Gg. Pertama dari Pertelon',
    cod: 41713,
    lat: -7.2184,
    lng: 113.4494
  },
  {
    resi: 'JY2394079026',
    name: 'Bunga',
    phone: '08******4645',
    addr: 'Jln Pelabuhan, gang pertama dari pertelon Kampung Gilin TLANAKAN',
    area: '2. Dusun Gilin Utara & Gang Pertama',
    bench: 'Gg. Pertama dari Pertelon Kampung Gilin',
    cod: 0,
    lat: -7.2185,
    lng: 113.4493
  },
  {
    resi: 'JY2383745077',
    name: 'Tar Islah',
    phone: '08******6966',
    addr: 'Tlanakan, Jalan Raya Branta Gang pertama, Dsn. Gilin, Ds. Branta Pesisir (Rumah Pink) TLANAKAN',
    area: '2. Dusun Gilin Utara & Gang Pertama',
    bench: 'Gg. Pertama Dsn. Gilin (Rumah Pink)',
    cod: 28078,
    lat: -7.2187,
    lng: 113.4492
  },
  {
    resi: 'JY2344922258',
    name: 'Aqilah Afriyana Hasyim',
    phone: '08******1874',
    addr: 'Gang pertama Dusun Gilin Branta Pesisir di depan Toko Pabrik Kerupuk rumah kuning TLANAKAN',
    area: '2. Dusun Gilin Utara & Gang Pertama',
    bench: 'Gg. Pertama Dsn. Gilin, Depan Pabrik Kerupuk Rumah Kuning',
    cod: 21816,
    lat: -7.2190,
    lng: 113.4490
  },
  {
    resi: 'JY2347796637',
    name: 'Nadiaaffa',
    phone: '08******5812',
    addr: 'Branta Pesisir gang pertama, Dusun Gilin rumah cat putih Kec. Tlanakan Kab. Pamekasan TLANAKAN',
    area: '2. Dusun Gilin Utara & Gang Pertama',
    bench: 'Gg. Pertama Dusun Gilin, Rumah Cat Putih',
    cod: 173719,
    lat: -7.2192,
    lng: 113.4489
  },
  {
    resi: 'JY2379214638',
    name: 'Erna Megawati',
    phone: '085331124475',
    addr: 'Desa Branta Pesisir, Dusun Gilin gang pertama pagar putih TLANAKAN',
    area: '2. Dusun Gilin Utara & Gang Pertama',
    bench: 'Dusun Gilin Gang Pertama Pagar Putih',
    cod: 46358,
    lat: -7.22196767884299,
    lng: 113.448863005933
  },

  // =========================================================================
  // ZONA 3: Dusun Gilin Tengah, Toko Violet & TK Al-Amin (20 Paket)
  // =========================================================================
  {
    resi: 'JY2386175358',
    name: 'Daudrasyidramadhan',
    phone: '08******1331',
    addr: 'Desa Branta Pesisir, Dusun Gilin, Toko Hasil Murni TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'Toko Hasil Murni, Dusun Gilin',
    cod: 24058,
    lat: -7.2193,
    lng: 113.4487
  },
  {
    resi: 'JY2389762800',
    name: 'Syakilla Nazla (Paket 1/2)',
    phone: '08******4044',
    addr: 'Jln belakang Pasar Branta, Dusun Gilin (timurnya gudang ikan kering) Branta Pesisir TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'Dusun Gilin, Timurnya Gudang Ikan Kering',
    cod: 42650,
    lat: -7.2191,
    lng: 113.4493
  },
  {
    resi: 'JY2351357187',
    name: 'Syakilla Nazla (Paket 2/2)',
    phone: '08******4044',
    addr: 'Jln belakang Pasar Branta, Dusun Gilin (timurnya gudang ikan kering) Branta Pesisir TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'Dusun Gilin, Timurnya Gudang Ikan Kering',
    cod: 25452,
    lat: -7.2191,
    lng: 113.4493
  },
  {
    resi: 'JY2398624547',
    name: 'Asit',
    phone: '08******4113',
    addr: 'Dsn. Gilin, Branta Pesisir, belakang Toko Violet TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'Belakang Toko Violet, Dsn. Gilin',
    cod: 203136,
    lat: -7.2194,
    lng: 113.4486
  },
  {
    resi: 'JY1831047119',
    name: 'Risie',
    phone: '08******7878',
    addr: 'Dusun Gilin, Branta Pesisir, dekat Jamu H. Miski, belakang Toko Violet TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'Belakang Toko Violet, Dekat Jamu H. Miski',
    cod: 95445,
    lat: -7.2195,
    lng: 113.4486
  },
  {
    resi: 'JY2362570117',
    name: 'Lyon Astah',
    phone: '08******0731',
    addr: 'Bandaran, Branta Pesisir, Kec. Tlanakan, Toko Violet TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'Toko Violet, Branta Pesisir',
    cod: 21210,
    lat: -7.21955,
    lng: 113.44865
  },
  {
    resi: 'JY2332240608',
    name: 'Ainun (Paket 1/2)',
    phone: '081929752235',
    addr: 'Pegadaian, Jalan Raya Tlanakan TK Al-Amin TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'Sekitar TK Al-Amin, Jl. Raya Tlanakan',
    cod: 124734,
    lat: -7.21963275029296,
    lng: 113.447926756517
  },
  {
    resi: 'JY2371110408',
    name: 'Ainun (Paket 2/2)',
    phone: '081929752235',
    addr: 'Pegadaian, Jalan Raya Tlanakan TK Al-Amin TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'Sekitar TK Al-Amin, Jl. Raya Tlanakan',
    cod: 129280,
    lat: -7.21963275029296,
    lng: 113.447926756517
  },
  {
    resi: 'JY2352542768',
    name: 'Mughoffar Branta',
    phone: '08******5252',
    addr: 'Sebelah utara TK Al-Amin, Dusun Gilin Desa Branta Pesisir TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'Sebelah Utara TK Al-Amin, Dsn. Gilin',
    cod: 11559,
    lat: -7.2196,
    lng: 113.4485
  },
  {
    resi: 'JY2370456816',
    name: 'Ririf (Paket 1/2)',
    phone: '08******5417',
    addr: 'Jln Branta Pesisir Pasar Branta Kampung KB TK Al-Amin Branta Pesisir TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'Kampung KB TK Al-Amin Branta Pesisir',
    cod: 32239,
    lat: -7.2197,
    lng: 113.4485
  },
  {
    resi: 'JY2366911547',
    name: 'Ririf (Paket 2/2)',
    phone: '08******5417',
    addr: 'Jln Branta Pesisir Pasar Branta Kampung KB TK Al-Amin Branta Pesisir TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'Kampung KB TK Al-Amin Branta Pesisir',
    cod: 28810,
    lat: -7.2197,
    lng: 113.4485
  },
  {
    resi: 'JY2332376096',
    name: 'Tria Qonita',
    phone: '08******9407',
    addr: 'Branta Pasisir TK Al-Amin, Dusun Gilin (belakang bengkel) TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'TK Al-Amin Dsn. Gilin (Belakang Bengkel)',
    cod: 21815,
    lat: -7.2198,
    lng: 113.4484
  },
  {
    resi: 'JY2396877847',
    name: 'Yeyen Toko Ramdhani',
    phone: '08******4061',
    addr: 'TK Al-Amin, Bandaran, Branta Pesisir TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'Dekat TK Al-Amin, Bandaran',
    cod: 82217,
    lat: -7.21985,
    lng: 113.44855
  },
  {
    resi: 'JY2355701487',
    name: 'Azimah',
    phone: '08******9513',
    addr: 'MTs Swasta Al-Amin Branta Pesisir, Jalan Bandaran TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'MTs Swasta Al-Amin, Jl. Bandaran',
    cod: 0,
    lat: -7.21995,
    lng: 113.4487
  },
  {
    resi: 'JY2396573276',
    name: 'Fatimatus Zahrah',
    phone: '08******2287',
    addr: 'Dusun Gilin, Rujak Kelang Linda, Branta Pesisir (Gang Amal ke barat) TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'Rujak Kelang Linda, Gang Amal ke Barat',
    cod: 20806,
    lat: -7.2194,
    lng: 113.4487
  },
  {
    resi: 'JY2389335487',
    name: 'Ifa Rosi',
    phone: '08******0221',
    addr: 'Depan Gang Amal-Amal, Dusun Gilin, Branta Pesisir TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'Depan Gang Amal-Amal',
    cod: 0,
    lat: -7.21945,
    lng: 113.4488
  },
  {
    resi: 'JY2396848887',
    name: 'Putri Hosnan',
    phone: '08******4109',
    addr: 'Dekat rumah Betran, Dusun Gilin, Branta Pesisir TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'Dekat Rumah Betran, Dusun Gilin',
    cod: 52923,
    lat: -7.2196,
    lng: 113.4489
  },
  {
    resi: 'JY2303407406',
    name: 'SintaHardiyanti',
    phone: '08******4475',
    addr: 'Dsn. Gilin, Branta Pesisir, Tlanakan, Pamekasan TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'Dusun Gilin, Branta Pesisir',
    cod: 0,
    lat: -7.2197,
    lng: 113.4490
  },
  {
    resi: 'JY2323575696',
    name: 'Kirana Putri',
    phone: '08******3068',
    addr: 'Desa Branta Pesisir, Dusun Gilin, Tlanakan, Kab. Pamekasan TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'Dusun Gilin, Branta Pesisir',
    cod: 198970,
    lat: -7.2198,
    lng: 113.4491
  },
  {
    resi: 'JY2397653628',
    name: 'K. NAWAWI NY ZAINIYAH',
    phone: '08******0590',
    addr: 'Dsn. Gilin Kenik, Branta Pesisir (K. Nawawi Ny. Zainiyah) TLANAKAN',
    area: '3. Dusun Gilin, Toko Violet & TK Al-Amin',
    bench: 'Dusun Gilin Kenik',
    cod: 0,
    lat: -7.2199,
    lng: 113.4492
  },

  // =========================================================================
  // ZONA 4: Dusun Mayang, Gang Macho & Sekitar Masjid Taqwa / Al-Furqon (18 Paket)
  // =========================================================================
  {
    resi: 'JY2313369945',
    name: 'Radha, Raja',
    phone: '08******2713',
    addr: 'Branta Pasisir Kel., Jalan Raya Branta Gg. Macho, Dusun Mayang TLANAKAN',
    area: '4. Dusun Mayang, Jl. Pelabuhan & Masjid Al-Furqon',
    bench: 'Jl. Raya Branta, Gg. Macho Dusun Mayang',
    cod: 73124,
    lat: -7.2208,
    lng: 113.44835
  },
  {
    resi: 'JY2335979656',
    name: 'Roni',
    phone: '08******4922',
    addr: 'Branta Pesisir, Jalan Raya Branta Jln Pelabuhan Dusun Gilin TLANAKAN',
    area: '4. Dusun Mayang, Jl. Pelabuhan & Masjid Al-Furqon',
    bench: 'Jl. Raya Branta / Jl. Pelabuhan Dsn. Gilin',
    cod: 22725,
    lat: -7.2195,
    lng: 113.4493
  },
  {
    resi: 'JY2352701688',
    name: 'Hasanah',
    phone: '08******6490',
    addr: 'Jln Raya Pelabuhan Branta Pesisir, Kec. Tlanakan, Kab. Pamekasan TLANAKAN',
    area: '4. Dusun Mayang, Jl. Pelabuhan & Masjid Al-Furqon',
    bench: 'Jln Raya Pelabuhan Branta Pesisir',
    cod: 15468,
    lat: -7.2197,
    lng: 113.4494
  },
  {
    resi: 'JY2320069936',
    name: 'Laili Lutfana',
    phone: '08******3605',
    addr: 'Jalan Pelabuhan, Branta Pesisir, Tlanakan (Dusun Gilin) rumah warna abu-abu pagar TLANAKAN',
    area: '4. Dusun Mayang, Jl. Pelabuhan & Masjid Al-Furqon',
    bench: 'Jl. Pelabuhan, Rumah Abu-Abu Pagar',
    cod: 0,
    lat: -7.21985,
    lng: 113.44945
  },
  {
    resi: 'JY2390485477',
    name: 'Maghfira Izzani (Paket 1/2)',
    phone: '08******1305',
    addr: 'Jalan Pelabuhan Branta, Toko Sumber Rezeki TLANAKAN',
    area: '4. Dusun Mayang, Jl. Pelabuhan & Masjid Al-Furqon',
    bench: 'Jl. Pelabuhan Branta, Toko Sumber Rezeki',
    cod: 61004,
    lat: -7.2196,
    lng: 113.4490
  },
  {
    resi: 'JY2311484158',
    name: 'Maghfira Izzani (Paket 2/2)',
    phone: '08******1305',
    addr: 'Jalan Pelabuhan Branta, Toko Sumber Rezeki TLANAKAN',
    area: '4. Dusun Mayang, Jl. Pelabuhan & Masjid Al-Furqon',
    bench: 'Jl. Pelabuhan Branta, Toko Sumber Rezeki',
    cod: 26260,
    lat: -7.2196,
    lng: 113.4490
  },
  {
    resi: 'JY2378232528',
    name: 'MOH.FAHRI FIRDAUSY (Paket 1/2)',
    phone: '08******1140',
    addr: 'Dusun Gilin, Jalan Raya Pelabuhan Branta Pesisir, Toko Sumber Rejeki TLANAKAN',
    area: '4. Dusun Mayang, Jl. Pelabuhan & Masjid Al-Furqon',
    bench: 'Toko Sumber Rejeki Sebelah Masjid Al-Furqon',
    cod: 52076,
    lat: -7.21975953113329,
    lng: 113.450284981645
  },
  {
    resi: 'JY2373429877',
    name: 'MOH.FAHRI FIRDAUSY (Paket 2/2)',
    phone: '08******1140',
    addr: 'Dusun Gilin, Jalan Raya Pelabuhan Branta Pesisir, Toko Sumber Rejeki TLANAKAN',
    area: '4. Dusun Mayang, Jl. Pelabuhan & Masjid Al-Furqon',
    bench: 'Toko Sumber Rejeki Sebelah Masjid Al-Furqon',
    cod: 36966,
    lat: -7.21975953113329,
    lng: 113.450284981645
  },
  {
    resi: 'JY2348471718',
    name: 'PPPPP',
    phone: '08******8728',
    addr: 'Jamu Tradisional H. Miski, Gang Masjid Taqwa, Branta Pesisir TLANAKAN',
    area: '4. Dusun Mayang, Jl. Pelabuhan & Masjid Al-Furqon',
    bench: 'Gang Masjid Taqwa, Jamu H. Miski',
    cod: 101,
    lat: -7.2201,
    lng: 113.4499
  },
  {
    resi: 'JY2312143397',
    name: 'Nurul Fadila',
    phone: '08******7789',
    addr: 'Branta Pesisir, Musholla Nurul Ghomam Dusun Gilin TLANAKAN',
    area: '4. Dusun Mayang, Jl. Pelabuhan & Masjid Al-Furqon',
    bench: 'Musholla Nurul Ghomam, Dusun Gilin',
    cod: 123709,
    lat: -7.21988450198556,
    lng: 113.449866189829
  },
  {
    resi: 'JY2333608396',
    name: 'Mutmainnah (Paket 1/3)',
    phone: '085236418317',
    addr: 'Branta Pesisir Tlanakan Masjid Al-Furqon TLANAKAN',
    area: '4. Dusun Mayang, Jl. Pelabuhan & Masjid Al-Furqon',
    bench: 'Dekat Masjid Al-Furqon',
    cod: 15200,
    lat: -7.21868085171327,
    lng: 113.448944217235
  },
  {
    resi: 'JY2346895558',
    name: 'Mutmainnah (Paket 2/3)',
    phone: '085236418317',
    addr: 'Branta Pesisir Tlanakan Masjid Al-Furqon TLANAKAN',
    area: '4. Dusun Mayang, Jl. Pelabuhan & Masjid Al-Furqon',
    bench: 'Dekat Masjid Al-Furqon',
    cod: 82030,
    lat: -7.21868085171327,
    lng: 113.448944217235
  },
  {
    resi: 'JY2316577018',
    name: 'Mutmainnah (Paket 3/3)',
    phone: '085236418317',
    addr: 'Branta Pesisir Tlanakan Masjid Al-Furqon TLANAKAN',
    area: '4. Dusun Mayang, Jl. Pelabuhan & Masjid Al-Furqon',
    bench: 'Dekat Masjid Al-Furqon',
    cod: 25250,
    lat: -7.21868085171327,
    lng: 113.448944217235
  },
  {
    resi: 'JY2352022557',
    name: 'H Doni. Fia',
    phone: '08******7778',
    addr: 'Sebelum Masjid Al-Furqon Branta Pesisir, Bandaran, rumahnya pagar putih TLANAKAN',
    area: '4. Dusun Mayang, Jl. Pelabuhan & Masjid Al-Furqon',
    bench: 'Sebelum Masjid Al-Furqon, Pagar Putih',
    cod: 152465,
    lat: -7.2191,
    lng: 113.4496
  },
  {
    resi: 'JY2327474457',
    name: 'Adeee',
    phone: '08******7625',
    addr: 'Masjid Al-Furqon Branta Pesisir, Bandaran, Branta Pesisir TLANAKAN',
    area: '4. Dusun Mayang, Jl. Pelabuhan & Masjid Al-Furqon',
    bench: 'Masjid Al-Furqon, Bandaran',
    cod: 100874,
    lat: -7.2192755982611,
    lng: 113.449667947509
  },
  {
    resi: 'JY2334651378',
    name: 'MUTAMMIMAH',
    phone: '08******9139',
    addr: 'Masjid Al-Furqon Branta Pesisir, Bandaran, belakang Masjid Al-Furqon TLANAKAN',
    area: '4. Dusun Mayang, Jl. Pelabuhan & Masjid Al-Furqon',
    bench: 'Belakang Masjid Al-Furqon, Bandaran',
    cod: 59998,
    lat: -7.21935,
    lng: 113.44975
  },
  {
    resi: 'JY2342629048',
    name: 'Lilik Said',
    phone: '08******9596',
    addr: 'Masjid Al-Furqon Branta Pesisir, Dusun Tinjang belakang rumah besar timur jalan, Rujak Kelang TLANAKAN',
    area: '4. Dusun Mayang, Jl. Pelabuhan & Masjid Al-Furqon',
    bench: 'Belakang Rumah Besar Timur Jalan / Masjid Al-Furqon',
    cod: 21058,
    lat: -7.2195,
    lng: 113.4499
  },
  {
    resi: 'JY2389617167',
    name: 'Risa Anisiyah',
    phone: '08******0139',
    addr: 'Branta Pasisir Gang As-Sholihin TLANAKAN',
    area: '4. Dusun Mayang, Jl. Pelabuhan & Masjid Al-Furqon',
    bench: 'Gang As-Sholihin, Branta Pesisir',
    cod: 51550,
    lat: -7.2197,
    lng: 113.4501
  },

  // =========================================================================
  // ZONA 5: Dusun Tengah II, Gang Jamu Ny. Candi & Bakso Regas (11 Paket)
  // =========================================================================
  {
    resi: 'JY2312561827',
    name: 'Niswatul Ummah - Afif (Paket 1/2)',
    phone: '08******6702',
    addr: 'Dsn. Tengah II, Branta Pesisir, Tlanakan, Pamekasan TLANAKAN',
    area: '5. Dusun Tengah II & Gang Jamu Ny. Candi',
    bench: 'Dusun Tengah II, Branta Pesisir',
    cod: 20895,
    lat: -7.2200,
    lng: 113.4505
  },
  {
    resi: 'JY2335943028',
    name: 'Niswatul Ummah - Afif (Paket 2/2)',
    phone: '08******6702',
    addr: 'Dsn. Tengah II, Branta Pesisir, Tlanakan, Pamekasan TLANAKAN',
    area: '5. Dusun Tengah II & Gang Jamu Ny. Candi',
    bench: 'Dusun Tengah II, Branta Pesisir',
    cod: 81417,
    lat: -7.2200,
    lng: 113.4505
  },
  {
    resi: 'JY2342174087',
    name: 'Irfan Afandi',
    phone: '08******2753',
    addr: 'Jamu Tradisional Ny. Candi Branta Pesisir, Bakso Regas TLANAKAN',
    area: '5. Dusun Tengah II & Gang Jamu Ny. Candi',
    bench: 'Gg. Jamu Ny. Candi, Dekat Bakso Regas',
    cod: 10403,
    lat: -7.2201,
    lng: 113.4507
  },
  {
    resi: 'JY2391190438',
    name: 'H LUKMAN',
    phone: '08******9190',
    addr: 'Branta Pesisir, Dusun Tengah Dua Gang Jamu Ny. Candi TLANAKAN',
    area: '5. Dusun Tengah II & Gang Jamu Ny. Candi',
    bench: 'Dusun Tengah II, Gang Jamu Ny. Candi',
    cod: 84897,
    lat: -7.2202,
    lng: 113.4508
  },
  {
    resi: 'JY2280947566',
    name: 'Masruroh (Paket 1/2)',
    phone: '08******5388',
    addr: 'Kampung Gilin, Gg. Jamu Ny. Candi Branta Pesisir, Kec. Tlanakan TLANAKAN',
    area: '5. Dusun Tengah II & Gang Jamu Ny. Candi',
    bench: 'Gang Jamu Ny. Candi, Branta Pesisir',
    cod: 45753,
    lat: -7.22025,
    lng: 113.4506
  },
  {
    resi: 'JY2318241397',
    name: 'Masruroh (Paket 2/2)',
    phone: '08******5388',
    addr: 'Kampung Gilin, Gg. Jamu Ny. Candi Branta Pesisir, Kec. Tlanakan TLANAKAN',
    area: '5. Dusun Tengah II & Gang Jamu Ny. Candi',
    bench: 'Gang Jamu Ny. Candi, Branta Pesisir',
    cod: 55246,
    lat: -7.22025,
    lng: 113.4506
  },
  {
    resi: 'JY2327549606',
    name: 'Halisa (Paket 1/2)',
    phone: '08******4034',
    addr: 'Branta Pasisir Kampung Tengah 2, Gang Nyah Candih pertigaan sebelah barat TLANAKAN',
    area: '5. Dusun Tengah II & Gang Jamu Ny. Candi',
    bench: 'Kampung Tengah 2, Gg. Nyah Candih Pertigaan Barat',
    cod: 16665,
    lat: -7.22035,
    lng: 113.45045
  },
  {
    resi: 'JY2144795437',
    name: 'Halisa (Paket 2/2)',
    phone: '08******4034',
    addr: 'Branta Pasisir Kampung Tengah 2, Gang Nyah Candih pertigaan sebelah barat TLANAKAN',
    area: '5. Dusun Tengah II & Gang Jamu Ny. Candi',
    bench: 'Kampung Tengah 2, Gg. Nyah Candih Pertigaan Barat',
    cod: 0,
    lat: -7.22035,
    lng: 113.45045
  },
  {
    resi: 'JY2344989227',
    name: 'Miftahus Surur (Paket 1/2)',
    phone: '08******6656',
    addr: 'Jln Nya Candih, Toko Pakan Burung Kicau 88, Branta Pesisir TLANAKAN',
    area: '5. Dusun Tengah II & Gang Jamu Ny. Candi',
    bench: 'Jln Nya Candih, Toko Pakan Burung Kicau 88',
    cod: 12927,
    lat: -7.22045,
    lng: 113.45035
  },
  {
    resi: 'JY2335545666',
    name: 'Miftahus Surur (Paket 2/2)',
    phone: '08******6656',
    addr: 'Jln Nya Candih, Toko Pakan Burung Kicau 88, Branta Pesisir TLANAKAN',
    area: '5. Dusun Tengah II & Gang Jamu Ny. Candi',
    bench: 'Jln Nya Candih, Toko Pakan Burung Kicau 88',
    cod: 33815,
    lat: -7.22045,
    lng: 113.45035
  },

  // =========================================================================
  // ZONA 6: Balai Desa Branta Pesisir, Gang Anggrek & Dusun Lunas (3 Paket)
  // =========================================================================
  {
    resi: 'JY2315657717',
    name: 'Agustin Nur Ziyadatur Rahmah',
    phone: '08******6531',
    addr: 'Branta Pesisir, Balai Desa Branta Pesisir TLANAKAN',
    area: '6. Balai Desa, Dusun Lunas & Gang Anggrek',
    bench: 'Balai Desa Branta Pesisir',
    cod: 15251,
    lat: -7.22170957686482,
    lng: 113.450384718156
  },
  {
    resi: 'JY2355245156',
    name: 'Anisa FK',
    phone: '08******0734',
    addr: 'Branta Pasisir, Dusun Lunas, belakang Balai Desa TLANAKAN',
    area: '6. Balai Desa, Dusun Lunas & Gang Anggrek',
    bench: 'Belakang Balai Desa, Dusun Lunas',
    cod: 16766,
    lat: -7.22175,
    lng: 113.45015
  },
  {
    resi: 'JD0608432812',
    name: 'Zuhdi Amin',
    phone: '08******3939',
    addr: 'Jalan Pelabuhan Gang Anggrek No. 5A, Branta Pesisir (rumah warna kuning lantai biru) TLANAKAN',
    area: '6. Balai Desa, Dusun Lunas & Gang Anggrek',
    bench: 'DFOD Ongkir — Gg. Anggrek No. 5A, Rumah Kuning Lantai Biru',
    cod: 16800,
    lat: -7.22185,
    lng: 113.45025
  }
];

const packages = rawList.map((item, idx) => {
  const isCod = item.cod > 0;
  return {
    id: `pkg-20261128-${String(idx + 1).padStart(2, '0')}`,
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
    createdAt: '2026-11-28T09:00:00.000Z'
  };
});

// Sanity validation against OCR cards_28_nov.json
const ocrCards = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'cards_28_nov.json'), 'utf-8'));
const ocrResiSet = new Set(ocrCards.map(c => c.trackingNumber));
const finalResiSet = new Set(packages.map(p => p.trackingNumber));

const missingInFinal = [...ocrResiSet].filter(r => !finalResiSet.has(r));
const extraInFinal = [...finalResiSet].filter(r => !ocrResiSet.has(r));
if (missingInFinal.length || extraInFinal.length || packages.length !== 69) {
  console.error('MISMATCH!', { missingInFinal, extraInFinal, len: packages.length });
  process.exit(1);
}

// Verify every COD matches OCR card (allowing JD0608432812 DFOD 16800)
packages.forEach(p => {
  const oc = ocrCards.find(c => c.trackingNumber === p.trackingNumber);
  if (p.trackingNumber === 'JD0608432812') {
    if (p.codAmount !== 16800) {
      console.error('DFOD MISMATCH for JD0608432812');
      process.exit(1);
    }
    return;
  }
  if (!oc || oc.codAmount !== p.codAmount) {
    console.error('COD MISMATCH for', p.trackingNumber, 'final=', p.codAmount, 'ocr=', oc && oc.codAmount);
    process.exit(1);
  }
});

const codCount = packages.filter(p => p.isCod).length;
const nonCodCount = packages.filter(p => !p.isCod).length;
const totalBaseCod = packages.reduce((s, p) => s + p.codAmount, 0);

console.log(`Generated & 100% cross-verified ${packages.length} packages for 28 November 2026!`);
console.log(`COD/DFOD: ${codCount} paket | Non-COD: ${nonCodCount} paket | Total Setoran COD+DFOD: Rp ${totalBaseCod.toLocaleString('id-ID')}`);

const outPath = path.join(__dirname, '..', 'screenshot alamat paket', 'packages_28_nov_verified.json');
fs.writeFileSync(outPath, JSON.stringify(packages, null, 2), 'utf-8');
console.log(`Saved to ${outPath}`);
