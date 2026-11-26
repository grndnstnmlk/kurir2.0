const fs = require('fs');
const path = require('path');

const savedHouses = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'saved_houses_dump.json'), 'utf-8'));
const prev25 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'screenshot alamat paket', 'packages_25_nov_verified.json'), 'utf-8'));

function findPhoto(name, address) {
  const normName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  // 1. Check saved houses
  const house = savedHouses.find(h => {
    const hn = h.recipient_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return normName.length >= 3 && (hn.includes(normName) || normName.includes(hn));
  });
  if (house && house.photo_url) return house.photo_url;

  // 2. Check 25 Nov verified packages
  const p25 = prev25.find(p => {
    const pn = p.recipientName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return normName.length >= 3 && (pn.includes(normName) || normName.includes(pn));
  });
  if (p25 && p25.proofPhotoUrl) return p25.proofPhotoUrl;

  return undefined;
}

// 44 Packages Ordered by 5 Physical Corridors (North to South)
const rawList = [
  // =========================================================================
  // ZONA 1: Jl. Raya Tlanakan, Tinjang & Pegadaian (9 Paket)
  // =========================================================================
  {
    resi: 'JY2330400615',
    name: 'Andry Nurse',
    phone: '08******3335',
    addr: '(Ke selatan pegadaian) Dusun Mayang RT.13 RW.07 Desa Branta pesisir Kec. Tlanakan Kab. Pamekasan',
    area: '1. Jl. Raya Tlanakan, Tinjang & Pegadaian',
    bench: 'Ke Selatan Pegadaian, Dusun Mayang',
    cod: 29095,
    lat: -7.2155,
    lng: 113.4502
  },
  {
    resi: 'JY2347932905',
    name: 'Ach Samlan Arifki (Paket 1/2)',
    phone: '08******6305',
    addr: 'Sebelah barat pegadaian Branta ke selatan ada pertigaan ke 2 dari pegadaian jual betor TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Tinjang & Pegadaian',
    bench: 'Sebelah Barat Pegadaian Branta, Pertigaan Jual Betor',
    cod: 67064,
    lat: -7.2172,
    lng: 113.4502
  },
  {
    resi: 'JY2394836754',
    name: 'Ach Samlan Arifki (Paket 2/2)',
    phone: '08******6305',
    addr: 'Sebelah barat pegadaian Branta ke selatan ada pertigaan ke 2 dari pegadaian jual betor TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Tinjang & Pegadaian',
    bench: 'Sebelah Barat Pegadaian Branta, Pertigaan Jual Betor',
    cod: 22644,
    lat: -7.2172,
    lng: 113.4502
  },
  {
    resi: 'JY2325314673',
    name: 'Safira Andriyani (Paket 1/2)',
    phone: '08******7013',
    addr: 'Branta pesisir, dsn tinjang, depan kiki cell (warung nasi goreng rombong kuning) TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Tinjang & Pegadaian',
    bench: 'Depan Kiki Cell (Warung Nasi Goreng Rombong Kuning)',
    cod: 21210,
    lat: -7.2163,
    lng: 113.4510
  },
  {
    resi: 'JY2336082335',
    name: 'Safira Andriyani (Paket 2/2)',
    phone: '08******7013',
    addr: 'Masjid Al-Amin Branta Pesisir, Tinjang, Branta Pesisir depan kiki cell (nasi goreng rombong warna kuning) TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Tinjang & Pegadaian',
    bench: 'Depan Kiki Cell (Warung Nasi Goreng Rombong Kuning)',
    cod: 0,
    lat: -7.2163,
    lng: 113.4510
  },
  {
    resi: 'JY2334922104',
    name: 'Ivan Ferdandes',
    phone: '08******0555',
    addr: 'Lalapan Arela Ak Nur 55, Jalan Raya Branta sebelah timur PT FGH TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Tinjang & Pegadaian',
    bench: 'Lalapan Arela Ak Nur 55 / Sebelah Timur PT FGH',
    cod: 77164,
    lat: -7.2168,
    lng: 113.4506
  },
  {
    resi: 'JY2331202426',
    name: 'HILWATUL IMANI',
    phone: '08******2921',
    addr: 'Branta Pasisir, Jalan Raya Branta belakangnya bidan Ririn pagar coklat TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Tinjang & Pegadaian',
    bench: 'Belakang Bidan Ririn, Pagar Coklat',
    cod: 8787,
    lat: -7.2176,
    lng: 113.4503
  },
  {
    resi: 'JY2386313355',
    name: 'Amarta Dinda (Paket 1/2)',
    phone: '08******5011',
    addr: 'Jl. Raya Branta Pasisir No. 1 TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Tinjang & Pegadaian',
    bench: 'Jl. Raya Branta Pasisir No. 1',
    cod: 31310,
    lat: -7.2178,
    lng: 113.4501
  },
  {
    resi: 'JY2372614544',
    name: 'Amarta Dinda (Paket 2/2)',
    phone: '08******5011',
    addr: 'Jl. Raya Branta Pasisir No. 1 TLANAKAN',
    area: '1. Jl. Raya Tlanakan, Tinjang & Pegadaian',
    bench: 'Jl. Raya Branta Pasisir No. 1',
    cod: 0,
    lat: -7.2178,
    lng: 113.4501
  },

  // =========================================================================
  // ZONA 2: TK Al-Amin, Bengkel Sahwi & Dusun Bandaran (8 Paket)
  // =========================================================================
  {
    resi: 'JY2328389295',
    name: 'Herlin (Paket 1/3)',
    phone: '08******8262',
    addr: 'Sebelah barat TK Al-Amin (masuk gg toko biru) Desa Branta Pesisir TLANAKAN',
    area: '2. TK Al-Amin, Bengkel Sahwi & Dusun Bandaran',
    bench: 'Sebelah Barat TK Al-Amin (Masuk Gang Toko Biru)',
    cod: 41309,
    lat: -7.2175,
    lng: 113.4508
  },
  {
    resi: 'JY2354727765',
    name: 'Herlin (Paket 2/3)',
    phone: '08******8262',
    addr: 'Sebelah barat TK Al-Amin (masuk gg toko biru) Desa Branta Pesisir TLANAKAN',
    area: '2. TK Al-Amin, Bengkel Sahwi & Dusun Bandaran',
    bench: 'Sebelah Barat TK Al-Amin (Masuk Gang Toko Biru)',
    cod: 165539,
    lat: -7.2175,
    lng: 113.4508
  },
  {
    resi: 'JY2311629125',
    name: 'Herlin (Paket 3/3)',
    phone: '08******8262',
    addr: 'Sebelah barat TK Al-Amin (masuk gg toko biru) Desa Branta Pesisir TLANAKAN',
    area: '2. TK Al-Amin, Bengkel Sahwi & Dusun Bandaran',
    bench: 'Sebelah Barat TK Al-Amin (Masuk Gang Toko Biru)',
    cod: 0,
    lat: -7.2175,
    lng: 113.4508
  },
  {
    resi: 'JY2332303745',
    name: 'Agis (Paket 1/2)',
    phone: '08******3292',
    addr: 'Gang Pegadaian, TK Al-Amin Branta Pesisir, Tlanakan Pamekasan',
    area: '2. TK Al-Amin, Bengkel Sahwi & Dusun Bandaran',
    bench: 'Gang Pegadaian, Dekat TK Al-Amin',
    cod: 12918,
    lat: -7.2176,
    lng: 113.4510
  },
  {
    resi: 'JY2379289984',
    name: 'Agis (Paket 2/2)',
    phone: '08******3292',
    addr: 'Gang Pegadaian, TK Al-Amin Branta Pesisir, Tlanakan Pamekasan',
    area: '2. TK Al-Amin, Bengkel Sahwi & Dusun Bandaran',
    bench: 'Gang Pegadaian, Dekat TK Al-Amin',
    cod: 9963,
    lat: -7.2176,
    lng: 113.4510
  },
  {
    resi: 'JY2362190176',
    name: 'Mama Wan Wen',
    phone: '08******6354',
    addr: 'TK Al-Amin, Bengkel Sahwi, Branta Pesisir TLANAKAN',
    area: '2. TK Al-Amin, Bengkel Sahwi & Dusun Bandaran',
    bench: 'TK Al-Amin, Bengkel Sahwi',
    cod: 108979,
    lat: -7.2178,
    lng: 113.4512
  },
  {
    resi: 'JY2388314456',
    name: 'Sri Wahyuningsih',
    phone: '08******3985',
    addr: 'Gang Toko Ratna Sari, Dusun Bandaran Desa Branta Pesisir TLANAKAN',
    area: '2. TK Al-Amin, Bengkel Sahwi & Dusun Bandaran',
    bench: 'Gang Toko Ratna Sari, Dusun Bandaran',
    cod: 28280,
    lat: -7.2182,
    lng: 113.4515
  },
  {
    resi: 'JY2343849256',
    name: 'Ade',
    phone: '08******7625',
    addr: 'Masjid Al-Furqon Branta Pesisir, Bandaran, Branta Pesisir TLANAKAN',
    area: '2. TK Al-Amin, Bengkel Sahwi & Dusun Bandaran',
    bench: 'Masjid Al-Furqon, Dusun Bandaran',
    cod: 31664,
    lat: -7.2186,
    lng: 113.4511
  },

  // =========================================================================
  // ZONA 3: Dusun Gilin - Gang Pertama Masuk (14 Paket)
  // =========================================================================
  {
    resi: 'JY2300381565',
    name: 'Amilah (Paket 1/3)',
    phone: '08******4084',
    addr: 'Jl. Pelabuhan Branta Pesisir Dusun Gilin RT.006/RW.005 Kec. Tlanakan (gang pertama dari pertelon rumah warna hijau) TLANAKAN',
    area: '3. Dusun Gilin - Gang Pertama Masuk',
    bench: 'Gang Pertama dari Pertelon Rumah Warna Hijau',
    cod: 84113,
    lat: -7.2185,
    lng: 113.4495
  },
  {
    resi: 'JY2317201275',
    name: 'Amilah (Paket 2/3)',
    phone: '08******4084',
    addr: 'Jl. Pelabuhan Branta Pesisir Dusun Gilin RT.006/RW.005 Kec. Tlanakan (gang pertama dari pertelon rumah warna hijau) TLANAKAN',
    area: '3. Dusun Gilin - Gang Pertama Masuk',
    bench: 'Gang Pertama dari Pertelon Rumah Warna Hijau',
    cod: 0,
    lat: -7.2185,
    lng: 113.4495
  },
  {
    resi: 'JY2301059834',
    name: 'Amilah (Paket 3/3)',
    phone: '08******4084',
    addr: 'Dsn. Gilin, Branta Pesisir, Tlanakan, jl. Pelabuhan Branta Pesisir, dusun Gilin (gang pertama dari pertelon)',
    area: '3. Dusun Gilin - Gang Pertama Masuk',
    bench: 'Gang Pertama dari Pertelon Rumah Warna Hijau',
    cod: 0,
    lat: -7.2185,
    lng: 113.4495
  },
  {
    resi: 'JY2305833883',
    name: 'Deck Fia (Paket 1/3)',
    phone: '08******4387',
    addr: 'Branta Pesisir Dusun Gilin belakang toko Tegarrr TLANAKAN',
    area: '3. Dusun Gilin - Gang Pertama Masuk',
    bench: 'Belakang Toko Tegarrr, Dusun Gilin',
    cod: 30906,
    lat: -7.2188,
    lng: 113.4493
  },
  {
    resi: 'JY2308464205',
    name: 'Deck Fia (Paket 2/3)',
    phone: '08******4182',
    addr: 'Jawa Timur kab Pamekasan Tlanakan Branta Pesisir (Dusun Gilin)',
    area: '3. Dusun Gilin - Gang Pertama Masuk',
    bench: 'Dusun Gilin, Belakang Toko Tegarrr',
    cod: 37471,
    lat: -7.2188,
    lng: 113.4493
  },
  {
    resi: 'JY2358134934',
    name: 'Deck Fia (Paket 3/3)',
    phone: '08******4182',
    addr: 'Jawa Timur kab Pamekasan Tlanakan Branta Pesisir (Dusun Gilin)',
    area: '3. Dusun Gilin - Gang Pertama Masuk',
    bench: 'Dusun Gilin, Belakang Toko Tegarrr',
    cod: 36461,
    lat: -7.2188,
    lng: 113.4493
  },
  {
    resi: 'JY2321920636',
    name: 'Arofah (Paket 1/2)',
    phone: '08******6264',
    addr: 'Branta Pesisir Gang Pertama, Dusun Gilin rumah berwarna kuning & banyak tanaman di depan dan di dalam TLANAKAN',
    area: '3. Dusun Gilin - Gang Pertama Masuk',
    bench: 'Gang Pertama Dusun Gilin, Rumah Kuning Banyak Tanaman',
    cod: 99687,
    lat: -7.2190,
    lng: 113.4492
  },
  {
    resi: 'JY2329162985',
    name: 'Arofah (Paket 2/2)',
    phone: '08******6264',
    addr: 'Branta Pesisir Gang Pertama, Dusun Gilin rumah berwarna kuning & banyak tanaman di depan dan di dalam TLANAKAN',
    area: '3. Dusun Gilin - Gang Pertama Masuk',
    bench: 'Gang Pertama Dusun Gilin, Rumah Kuning Banyak Tanaman',
    cod: 44079,
    lat: -7.2190,
    lng: 113.4492
  },
  {
    resi: 'JY2301728904',
    name: 'Sonia Faradilla',
    phone: '08******1208',
    addr: 'Branta Pesisir, Jalan Raya Branta Dusun Gilin (gang pertama masuk ke barat, pagar putih maroon) TLANAKAN',
    area: '3. Dusun Gilin - Gang Pertama Masuk',
    bench: 'Gang Pertama Masuk ke Barat, Pagar Putih Maroon',
    cod: 0,
    lat: -7.2191,
    lng: 113.4490
  },
  {
    resi: 'JY2377741006',
    name: 'Taufan Efendi',
    phone: '08******2213',
    addr: 'Branta Pesisir Dusun Gilin jln. Pelabuhan gang pertama belok kanan TLANAKAN',
    area: '3. Dusun Gilin - Gang Pertama Masuk',
    bench: 'Jl. Pelabuhan Gang Pertama Belok Kanan',
    cod: 21012,
    lat: -7.2192,
    lng: 113.4489
  },
  {
    resi: 'JY2325800766',
    name: 'Emilia Fikri',
    phone: '08******4293',
    addr: 'Dsn. Gilin, Branta Pesisir, Tlanakan, gang pertama ke kanan belakang tower rumah warna biru TLANAKAN',
    area: '3. Dusun Gilin - Gang Pertama Masuk',
    bench: 'Gang Pertama ke Kanan Belakang Tower Rumah Warna Biru',
    cod: 34441,
    lat: -7.2193,
    lng: 113.4488
  },
  {
    resi: 'JY2305939753',
    name: 'Sofi Angel',
    phone: '08******7003',
    addr: 'Dusun Gilin gang pertama dari pertelon masuk terus ada perempatan ke selatan ngelangkahi rumah dua TLANAKAN',
    area: '3. Dusun Gilin - Gang Pertama Masuk',
    bench: 'Gang Pertama Pertelon, Perempatan ke Selatan 2 Rumah',
    cod: 29946,
    lat: -7.2194,
    lng: 113.4487
  },
  {
    resi: 'JY2320989755',
    name: 'Alyaa',
    phone: '08******0609',
    addr: 'Dsn. Gilin, Branta Pesisir, Tlanakan, Gilin gang pertama ke barat mentok rumah warna ijo TLANAKAN',
    area: '3. Dusun Gilin - Gang Pertama Masuk',
    bench: 'Gang Pertama ke Barat Mentok Rumah Warna Ijo',
    cod: 0,
    lat: -7.2195,
    lng: 113.4485
  },
  {
    resi: 'JY2375477694',
    name: 'Lilik',
    phone: '08******6738',
    addr: 'Jln pegadaian sebelah timur SD Branta dusun Gilin TLANAKAN',
    area: '3. Dusun Gilin - Gang Pertama Masuk',
    bench: 'Sebelah Timur SD Branta Dusun Gilin',
    cod: 56681,
    lat: -7.2192,
    lng: 113.4496
  },
  {
    resi: 'JY2368089074',
    name: 'Ika Ferissha',
    phone: '08******5151',
    addr: 'Branta Pesisir, Dusun Gilin TLANAKAN',
    area: '3. Dusun Gilin - Gang Pertama Masuk',
    bench: 'Dusun Gilin',
    cod: 35198,
    lat: -7.2196,
    lng: 113.4491
  },

  // =========================================================================
  // ZONA 4: Dusun Gilin Tengah & Balai Desa / Dusun Lunas (8 Paket)
  // =========================================================================
  {
    resi: 'JY2306473636',
    name: 'Sulalah (Feby Gilin)',
    phone: '08******5057',
    addr: 'Belakang Masjid Al-Furqon, Gilin gang pertama rumah pamong TLANAKAN',
    area: '4. Dusun Gilin Tengah & Balai Desa / Lunas',
    bench: 'Belakang Masjid Al-Furqon, Rumah Pamong',
    cod: 53429,
    lat: -7.2198,
    lng: 113.4488
  },
  {
    resi: 'JY2381338726',
    name: 'Moh. Fahri Firdausy',
    phone: '08******1140',
    addr: 'Dusun Gilin, Jalan Raya Pelabuhan Branta Pesisir, toko sumber rejeki TLANAKAN',
    area: '4. Dusun Gilin Tengah & Balai Desa / Lunas',
    bench: 'Toko Sumber Rejeki, Jl. Raya Pelabuhan Branta',
    cod: 38028,
    lat: -7.2202,
    lng: 113.4494
  },
  {
    resi: 'JY2365200586',
    name: 'Maghfira Izzani',
    phone: '08******1305',
    addr: 'Jalan Pelabuhan Branta Toko sumber rezeki TLANAKAN',
    area: '4. Dusun Gilin Tengah & Balai Desa / Lunas',
    bench: 'Toko Sumber Rezeki, Jl. Pelabuhan Branta',
    cod: 16766,
    lat: -7.2203,
    lng: 113.4494
  },
  {
    resi: 'JY2317428716',
    name: 'Fitriya',
    phone: '08******2750',
    addr: 'Balai desa Branta Pesisir ke kiri gang Lunas pertigaan gang kecil rumah ngadep utara TLANAKAN',
    area: '4. Dusun Gilin Tengah & Balai Desa / Lunas',
    bench: 'Balai Desa ke Kiri Gang Lunas, Rumah Ngadep Utara',
    cod: 62014,
    lat: -7.2217,
    lng: 113.4503
  },
  {
    resi: 'JY2345901576',
    name: 'Fais (Paket 1/2)',
    phone: '08******2320',
    addr: 'Desa Branta Pesisir warung hareudang timur jalan warna merah dan kuning atap hitam samping las besi TLANAKAN',
    area: '4. Dusun Gilin Tengah & Balai Desa / Lunas',
    bench: 'Warung Hareudang Timur Jalan (Merah Kuning Atap Hitam)',
    cod: 80295,
    lat: -7.2225,
    lng: 113.4497
  },
  {
    resi: 'JY2328983294',
    name: 'Fais (Paket 2/2)',
    phone: '08******2320',
    addr: 'Desa Branta Pesisir warung hareudang timur jalan warna merah dan kuning atap hitam samping las besi TLANAKAN',
    area: '4. Dusun Gilin Tengah & Balai Desa / Lunas',
    bench: 'Warung Hareudang Timur Jalan (Merah Kuning Atap Hitam)',
    cod: 261590,
    lat: -7.2225,
    lng: 113.4497
  },
  {
    resi: 'JY2318314056',
    name: 'Kafa',
    phone: '08******1332',
    addr: 'Jl. Pelabuhan jalan menuju dermaga ada warung warna merah sebelah kiri di pinggir nya las besi TLANAKAN',
    area: '4. Dusun Gilin Tengah & Balai Desa / Lunas',
    bench: 'Jl. Pelabuhan Menuju Dermaga Warung Merah Pinggir Las Besi',
    cod: 113349,
    lat: -7.2230,
    lng: 113.4494
  },

  // =========================================================================
  // ZONA 5: Pelabuhan & Dermaga Branta (5 Paket)
  // =========================================================================
  {
    resi: 'JY2399767702',
    name: 'Fitri (Paket 1/2)',
    phone: '08******1175',
    addr: 'Shafira Tour & Travel - Umroh & Haji Plus Pamekasan, Jalan Pelabuhan No.1, Mayang, Branta Pesisir TLANAKAN',
    area: '5. Pelabuhan, TPI & Dermaga Branta',
    bench: 'Shafira Tour & Travel, Jl. Pelabuhan No. 1',
    cod: 146955,
    lat: -7.2245,
    lng: 113.4492
  },
  {
    resi: 'JY2378945116',
    name: 'Fitri (Paket 2/2)',
    phone: '08******1175',
    addr: 'Shafira Tour & Travel - Umroh & Haji Plus Pamekasan, Jalan Pelabuhan No.1, Mayang, Branta Pesisir TLANAKAN',
    area: '5. Pelabuhan, TPI & Dermaga Branta',
    bench: 'Shafira Tour & Travel, Jl. Pelabuhan No. 1',
    cod: 62418,
    lat: -7.2245,
    lng: 113.4492
  },
  {
    resi: 'JY2314827045',
    name: 'Thania Cell (Paket 1/2)',
    phone: '08******2746',
    addr: 'Jl. Pelabuhan Branta Pesisir No. 4 (konter Thania cell) kec. Tlanakan kab. Pamekasan',
    area: '5. Pelabuhan, TPI & Dermaga Branta',
    bench: 'Konter Thania Cell No. 4, Jl. Pelabuhan Branta',
    cod: 60499,
    lat: -7.2255,
    lng: 113.4490
  },
  {
    resi: 'JY2389905914',
    name: 'Thania Cell (Paket 2/2)',
    phone: '08******1390',
    addr: 'Jalan Pelabuhan Branta Pesisir Thania cell TLANAKAN',
    area: '5. Pelabuhan, TPI & Dermaga Branta',
    bench: 'Konter Thania Cell No. 4, Jl. Pelabuhan Branta',
    cod: 50903,
    lat: -7.2255,
    lng: 113.4490
  },
  {
    resi: 'JY2315229254',
    name: 'Via',
    phone: '08******6069',
    addr: 'Branta Pasisir Kel., Jalan Raya Branta gerbang dermaga Branta TLANAKAN',
    area: '5. Pelabuhan, TPI & Dermaga Branta',
    bench: 'Gerbang Dermaga Branta Pesisir',
    cod: 19392,
    lat: -7.2265,
    lng: 113.4489
  }
];

const packages = rawList.map((item, idx) => {
  const isCod = item.cod > 0;
  const photo = findPhoto(item.name, item.addr);
  const pkg = {
    id: `pkg-20261126-${String(idx + 1).padStart(2, '0')}`,
    trackingNumber: item.resi,
    recipientName: item.name,
    recipientPhone: item.phone,
    fullAddress: item.addr,
    areaOrStreet: item.area,
    benchmark: item.bench,
    isCod,
    codAmount: item.cod,
    codAmountWithMarkup: isCod ? Math.round(item.cod * 1.1) : 0,
    status: 'pending',
    lat: item.lat,
    lng: item.lng,
    orderIndex: idx + 1,
    createdAt: '2026-11-26T08:00:00.000Z'
  };

  if (photo) {
    pkg.proofPhotoUrl = photo;
  }

  return pkg;
});

console.log(`Generated ${packages.length} verified packages for 26 November 2026!`);
console.log(`COD packages: ${packages.filter(p => p.isCod).length}`);
console.log(`Non-COD packages: ${packages.filter(p => !p.isCod).length}`);
console.log(`Packages with house photo: ${packages.filter(p => p.proofPhotoUrl).length}`);

const outPath = path.join(__dirname, '..', 'screenshot alamat paket', 'packages_26_nov_verified.json');
fs.writeFileSync(outPath, JSON.stringify(packages, null, 2), 'utf-8');
console.log(`Saved to ${outPath}`);
