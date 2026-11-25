import type { DeliveryPackage, RouteStrategy } from '../types';

/**
 * Format angka ke format mata uang Rupiah Indonesia (Rp xx.xxx)
 */
export function formatRupiah(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
}

export interface CodCalculation {
  baseAmount: number;
  courierFee: number;
  totalAmount: number;
  formattedBase: string;
  formattedFee: string;
  formattedTotal: string;
}

/**
 * Mencari semua paket milik penerima yang sama (nama penerima sama atau nomor HP sama)
 */
export function getSiblingPackages(
  targetPkg: DeliveryPackage | null | undefined,
  allPackages: DeliveryPackage[]
): DeliveryPackage[] {
  if (!targetPkg || !allPackages || allPackages.length === 0) return [];

  const cleanTargetName = (targetPkg.recipientName || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
  const targetPhone = (targetPkg.recipientPhone || '').replace(/\D/g, '');

  return allPackages.filter((p) => {
    // 1. Cocokkan No HP jika ada minimal 8 digit angka
    const pPhone = (p.recipientPhone || '').replace(/\D/g, '');
    if (targetPhone.length >= 8 && pPhone.length >= 8) {
      if (targetPhone.endsWith(pPhone.slice(-8)) || pPhone.endsWith(targetPhone.slice(-8))) {
        return true;
      }
    }

    // 2. Cocokkan Nama Penerima yang sudah dibersihkan
    const cleanPName = (p.recipientName || '')
      .toLowerCase()
      .replace(/\(.*?\)/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .trim();

    if (cleanTargetName.length >= 3 && cleanPName.length >= 3) {
      if (cleanTargetName === cleanPName) return true;
      const wTarget = cleanTargetName.split(/\s+/).filter((w) => w.length >= 3);
      const wP = cleanPName.split(/\s+/).filter((w) => w.length >= 3);
      if (wTarget.length >= 2 && wP.length >= 2) {
        const matches = wTarget.filter((w) => wP.includes(w));
        if (matches.length >= 2) return true;
      }
      if (wTarget.length === 1 && wP.length === 1 && wTarget[0] === wP[0]) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Menghitung total tagihan COD gabungan dari kumpulan paket milik penerima yang sama
 */
export function calculateCombinedCodTotal(packages: DeliveryPackage[]): {
  totalCodAmount: number;
  totalBaseCod: number;
  totalCourierFee: number;
  codPackagesCount: number;
  nonCodPackagesCount: number;
  formattedTotal: string;
} {
  let totalCodAmount = 0;
  let totalBaseCod = 0;
  let totalCourierFee = 0;
  let codPackagesCount = 0;
  let nonCodPackagesCount = 0;

  for (const pkg of packages) {
    if (pkg.isCod && pkg.codAmount > 0) {
      const calc = calculateCodWithCourierFee(pkg.codAmount);
      totalCodAmount += calc.totalAmount;
      totalBaseCod += calc.baseAmount;
      totalCourierFee += calc.courierFee;
      codPackagesCount++;
    } else {
      nonCodPackagesCount++;
    }
  }

  return {
    totalCodAmount,
    totalBaseCod,
    totalCourierFee,
    codPackagesCount,
    nonCodPackagesCount,
    formattedTotal: formatRupiah(totalCodAmount),
  };
}

/**
 * Menghitung Biaya Pengantaran Kurir (10% dari harga COD, dibulatkan ke ribuan terdekat)
 * Contoh:
 * - Rp 45.000 -> 10% = Rp 4.500 -> dibulatkan jadi Rp 5.000 -> Total Tagihan: Rp 50.000
 * - Rp 68.000 -> 10% = Rp 6.800 -> dibulatkan jadi Rp 7.000 -> Total Tagihan: Rp 75.000
 * - Rp 35.000 -> 10% = Rp 3.500 -> dibulatkan jadi Rp 4.000 -> Total Tagihan: Rp 39.000
 * - Rp 110.000 -> 10% = Rp 11.000 -> dibulatkan jadi Rp 11.000 -> Total Tagihan: Rp 121.000
 */
export function calculateCodWithCourierFee(
  baseCodAmount: number,
  percentage: number = 10,
  roundToThousands: boolean = true
): CodCalculation {
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

/**
 * Menghasilkan blok pesan info COD untuk template balasan WhatsApp kepada pembeli/penerima:
 * Hanya menampilkan TOTAL tagihan saja kepada pembeli (sudah termasuk biaya pengantaran kurir 10% dibulatkan ke ribuan)
 * tanpa menampilkan rincian biaya ongkir kurir kepada pembeli.
 */
export function formatCodWhatsAppInfo(
  isCod: boolean,
  codAmount: number,
  percentage: number = 10,
  roundToThousands: boolean = true
): string {
  if (!isCod || codAmount <= 0) {
    return '🏷️ *Paket Non-COD (Sudah Lunas)* (Tinggal serah terima paket).';
  }

  const calc = calculateCodWithCourierFee(codAmount, percentage, roundToThousands);

  return `🏷️ *Paket COD (Bayar di Tempat):* *${calc.formattedTotal}* (Mohon siapkan uang pas ya Kak 🙏).`;
}

/**
 * Format Pesan Notifikasi Delivery Resmi J&T Express (Sesuai Standar Chat Sprinter Asli):
 *
 * Contoh COD:
 * "Halo Kak【Diana Laili】,
 * Saya dari J&T Express, Mau konfirmasi paket COD dengan nomor resi【JY2379468922】ke alamat:
 * 【Dermaga branta pesisir  desa branta pesisir,kecamatan tlanakan kabupaten pamekasan TLANAKAN PAMEKASAN JAWA TIMUR】
 *
 * Totalnya Rp【230,218】
 * Mohon konfirmasinya ya, apakah benar pesanan ini milik Kakak?
 *
 * Terima kasih"
 */
export function generateJntDeliveryMessage(
  pkg: DeliveryPackage,
  customTemplate?: string
): string {
  const rawRecipient = pkg.recipientName ? pkg.recipientName.trim() : 'Kak';
  const cleanRecipient = rawRecipient.replace(/^kak\s+/i, '').trim() || 'Kak';

  const rawCod = pkg.codAmount || 0;
  const isCodPkg = Boolean(pkg.isCod && rawCod > 0);

  // Total tagihan COD sudah ditambahkan dengan biaya pengantaran kurir 10% (sesuai nominal "Tagih" di aplikasi)
  const calc = calculateCodWithCourierFee(rawCod);
  const totalCod = calc.totalAmount;
  const formattedCodNumber = new Intl.NumberFormat('en-US').format(totalCod);
  const formattedBaseNumber = new Intl.NumberFormat('en-US').format(rawCod);
  const formattedFeeNumber = new Intl.NumberFormat('en-US').format(calc.courierFee);

  const tipePaket = isCodPkg ? 'COD ' : '';
  const infoTotal = isCodPkg
    ? `Totalnya Rp【${formattedCodNumber}】`
    : 'Paket Non-COD (Sudah Lunas)';

  // Format Standar Resmi J&T Sprinter
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

/**
 * Format Pesan Notifikasi WhatsApp J&T untuk Penerima dengan Banyak Paket Sekaligus:
 */
export function generateMultiPackageJntMessage(
  packages: DeliveryPackage[]
): string {
  if (!packages || packages.length === 0) return '';
  if (packages.length === 1) return generateJntDeliveryMessage(packages[0]);

  const firstPkg = packages[0];
  const rawRecipient = firstPkg.recipientName ? firstPkg.recipientName.trim() : 'Kak';
  const cleanRecipient = rawRecipient
    .replace(/\(.*?\)/g, '')
    .replace(/^kak\s+/i, '')
    .trim() || 'Kak';

  const combined = calculateCombinedCodTotal(packages);
  const formattedGrandTotal = new Intl.NumberFormat('en-US').format(combined.totalCodAmount);

  // Daftar rincian resi
  const packageLines = packages
    .map((pkg, idx) => {
      if (pkg.isCod && pkg.codAmount > 0) {
        const calc = calculateCodWithCourierFee(pkg.codAmount);
        const formattedNum = new Intl.NumberFormat('en-US').format(calc.totalAmount);
        return `${idx + 1}. Resi【${pkg.trackingNumber}】(COD Rp【${formattedNum}】)`;
      }
      return `${idx + 1}. Resi【${pkg.trackingNumber}】(Non-COD / Lunas)`;
    })
    .join('\n');

  const infoTotal =
    combined.codPackagesCount > 0
      ? `Total Keseluruhan (${packages.length} Paket): Rp【${formattedGrandTotal}】`
      : `Total (${packages.length} Paket): Non-COD (Semua Lunas)`;

  return `Halo Kak【${cleanRecipient}】,
Saya dari J&T Express, Mau konfirmasi pengantaran ${packages.length} paket ke alamat:
【${firstPkg.fullAddress}】

Rincian Paket:
${packageLines}

${infoTotal}
Mohon konfirmasinya ya, apakah benar pesanan ini milik Kakak?

Terima kasih`;
}

/**
 * Menghitung jarak lurus antara dua koordinat bumi menggunakan rumus Haversine (dalam km)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius bumi dalam km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Menghitung total jarak keseluruhan rute dari Drop Point melewati semua stop (dalam km)
 */
export function calculateTotalRouteDistanceKm(
  dropPointLat: number,
  dropPointLng: number,
  packages: DeliveryPackage[]
): number {
  if (packages.length === 0) return 0;
  let total = calculateDistanceKm(
    dropPointLat,
    dropPointLng,
    packages[0].lat,
    packages[0].lng
  );

  for (let i = 0; i < packages.length - 1; i++) {
    total += calculateDistanceKm(
      packages[i].lat,
      packages[i].lng,
      packages[i + 1].lat,
      packages[i + 1].lng
    );
  }
  return total;
}

/**
 * Menghitung estimasi waktu perjalanan kurir motor:
 * - Kecepatan rata-rata motor di jalan dusun/gang: 25 km/jam
 * - Waktu serah terima paket / transaksi COD di lokasi: ~3 menit per paket
 */
export function calculateEstimatedTravelTime(
  totalDistanceKm: number,
  packageCount: number
): { totalMinutes: number; displayText: string } {
  if (packageCount === 0) {
    return { totalMinutes: 0, displayText: '0 Menit' };
  }

  const ridingMinutes = (totalDistanceKm / 25) * 60;
  const deliveryMinutes = packageCount * 3;
  const total = Math.round(ridingMinutes + deliveryMinutes);

  if (total < 60) {
    return { totalMinutes: total, displayText: `~${total} Menit` };
  }
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return {
    totalMinutes: total,
    displayText: mins > 0 ? `~${hours} Jam ${mins} Mnt` : `~${hours} Jam`,
  };
}

/**
 * Memeriksa apakah dua garis koordinat saling berpotongan (criss-crossing / bolak-balik)
 */
function ccw(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number]
): boolean {
  return (p3[1] - p1[1]) * (p2[0] - p1[0]) > (p2[1] - p1[1]) * (p3[0] - p1[0]);
}

export function linesIntersect(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  p4: [number, number]
): boolean {
  return (
    ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
  );
}

/**
 * Menghitung jumlah jalur silang (backtracking intersections) dalam urutan rute
 */
export function countRouteIntersections(
  dropPointLat: number,
  dropPointLng: number,
  packages: DeliveryPackage[]
): number {
  if (packages.length < 3) return 0;
  const points: [number, number][] = [
    [dropPointLat, dropPointLng],
    ...packages.map((p) => [p.lat, p.lng] as [number, number]),
  ];

  let intersections = 0;
  for (let i = 0; i < points.length - 1; i++) {
    for (let j = i + 2; j < points.length - 1; j++) {
      if (i === 0 && j === points.length - 2) continue; // adjacent in cycle
      if (
        linesIntersect(points[i], points[i + 1], points[j], points[j + 1])
      ) {
        intersections++;
      }
    }
  }
  return intersections;
}

/**
 * 2-Opt Local Search Heuristic:
 * Mengeliminasi seluruh jalur bersilang (criss-crossing) sehingga rute kurir
 * tidak pernah bolak-balik di jalan yang sama.
 */
function solveOpenTour2Opt(
  originLat: number,
  originLng: number,
  initialTour: DeliveryPackage[]
): DeliveryPackage[] {
  if (initialTour.length <= 2) return initialTour;

  let tour = [...initialTour];
  let improved = true;
  let iterations = 0;
  const maxIterations = 200;

  // Evaluasi total jarak open path dari origin
  const pathDistance = (list: DeliveryPackage[]) => {
    let d = calculateDistanceKm(originLat, originLng, list[0].lat, list[0].lng);
    for (let i = 0; i < list.length - 1; i++) {
      d += calculateDistanceKm(
        list[i].lat,
        list[i].lng,
        list[i + 1].lat,
        list[i + 1].lng
      );
    }
    return d;
  };

  let bestDistance = pathDistance(tour);

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < tour.length - 1; i++) {
      for (let j = i + 1; j < tour.length; j++) {
        // Balik sub-segment antara i dan j
        const newTour = [
          ...tour.slice(0, i),
          ...tour.slice(i, j + 1).reverse(),
          ...tour.slice(j + 1),
        ];

        const newDist = pathDistance(newTour);
        if (newDist < bestDistance - 0.0001) {
          tour = newTour;
          bestDistance = newDist;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  return tour;
}

/**
 * 1. Algoritma Optimal TSP (Hemat Waktu & Anti Bolak-Balik) - Rekomendasi Utama:
 * Menggabungkan Nearest Insertion + 2-Opt Local Search untuk menghasilkan rute
 * dengan jarak tempuh paling minim dan ZERO self-intersections.
 */
function optimizeTspNoBacktrack(
  packages: DeliveryPackage[],
  dropPointLat: number,
  dropPointLng: number
): DeliveryPackage[] {
  const remaining = [...packages];
  const tour: DeliveryPackage[] = [];

  // Langkah 1: Greedy Nearest Insertion awal
  let curLat = dropPointLat;
  let curLng = dropPointLng;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = calculateDistanceKm(
        curLat,
        curLng,
        remaining[i].lat,
        remaining[i].lng
      );
      if (d < minDist) {
        minDist = d;
        bestIdx = i;
      }
    }
    const nextPkg = remaining.splice(bestIdx, 1)[0];
    tour.push(nextPkg);
    curLat = nextPkg.lat;
    curLng = nextPkg.lng;
  }

  // Langkah 2: 2-Opt Swap untuk menghilangkan semua jalur silang
  return solveOpenTour2Opt(dropPointLat, dropPointLng, tour);
}

export interface AreaClusterGroup {
  areaName: string;
  packages: DeliveryPackage[];
  totalPackages: number;
  deliveredCount: number;
  pendingCount: number;
  totalCodAmount: number;
}

/**
 * Mengelompokkan paket berdasarkan Area / Dusun / Gang untuk pengambilan paket sekaligus dari motor (Batch Pickup).
 */
export function groupPackagesByArea(packages: DeliveryPackage[]): AreaClusterGroup[] {
  const map = new Map<string, DeliveryPackage[]>();
  packages.forEach((pkg) => {
    const area = pkg.areaOrStreet?.trim() || 'Lainnya';
    if (!map.has(area)) {
      map.set(area, []);
    }
    map.get(area)!.push(pkg);
  });

  return Array.from(map.entries()).map(([areaName, pkgs]) => {
    const deliveredCount = pkgs.filter((p) => p.status === 'delivered').length;
    const pendingCount = pkgs.filter((p) => p.status === 'pending').length;
    const totalCodAmount = pkgs
      .filter((p) => p.isCod)
      .reduce((sum, p) => sum + p.codAmount, 0);

    return {
      areaName,
      packages: pkgs,
      totalPackages: pkgs.length,
      deliveredCount,
      pendingCount,
      totalCodAmount,
    };
  });
}

/**
 * 2. Algoritma Cluster Sweep (Tersusun per Dusun / Blok - Satu Arah):
 * Mengelompokkan paket berdasarkan Dusun / Area jalan utama.
 * Kurir menyelesaikan SEMUA paket dalam 1 dusun sampai tuntas sebelum pindah
 * ke dusun berikutnya dalam koridor satu arah yang berurutan.
 */
function optimizeClusterSweep(
  packages: DeliveryPackage[],
  dropPointLat: number,
  dropPointLng: number
): DeliveryPackage[] {
  // Kelompokkan paket berdasarkan area/dusun
  const clusterMap: Record<string, DeliveryPackage[]> = {};

  packages.forEach((pkg) => {
    // Normalisasi nama dusun / jalan
    let key = pkg.areaOrStreet.trim();
    if (!key) {
      key = 'Lainnya';
    }
    if (!clusterMap[key]) {
      clusterMap[key] = [];
    }
    clusterMap[key].push(pkg);
  });

  // Hitung titik tengah (centroid) tiap cluster
  const clusters = Object.keys(clusterMap).map((key) => {
    const pkgs = clusterMap[key];
    const avgLat = pkgs.reduce((sum, p) => sum + p.lat, 0) / pkgs.length;
    const avgLng = pkgs.reduce((sum, p) => sum + p.lng, 0) / pkgs.length;
    return {
      key,
      packages: pkgs,
      centroidLat: avgLat,
      centroidLng: avgLng,
      distanceFromDropPoint: calculateDistanceKm(
        dropPointLat,
        dropPointLng,
        avgLat,
        avgLng
      ),
    };
  });

  // Urutkan cluster secara koridor (dari terdekat drop point menuju cluster terjauh)
  clusters.sort((a, b) => a.distanceFromDropPoint - b.distanceFromDropPoint);

  // Di dalam tiap cluster, susun paket menggunakan 2-Opt agar lancar tanpa bolak-balik
  const result: DeliveryPackage[] = [];
  let curLat = dropPointLat;
  let curLng = dropPointLng;

  clusters.forEach((cluster) => {
    const sortedClusterPkgs = solveOpenTour2Opt(
      curLat,
      curLng,
      cluster.packages
    );
    result.push(...sortedClusterPkgs);

    if (sortedClusterPkgs.length > 0) {
      const lastPkg = sortedClusterPkgs[sortedClusterPkgs.length - 1];
      curLat = lastPkg.lat;
      curLng = lastPkg.lng;
    }
  });

  return result;
}

/**
 * 3. Algoritma Farthest-First (Titik Terjauh Mundur Pulang - Halus):
 * Kurir langsung melaju ke titik paling ujung / batas terluar wilayah pengantaran,
 * lalu menyelesaikan antaran secara bertahap mundur kembali ke arah gudang / rumah.
 * Dioptimalkan dengan 2-Opt agar perjalanan mundur tidak zigzag.
 */
function optimizeFarthestFirst(
  packages: DeliveryPackage[],
  dropPointLat: number,
  dropPointLng: number
): DeliveryPackage[] {
  // Temukan titik paling jauh dari drop point
  let farthestIdx = 0;
  let maxDist = -1;

  for (let i = 0; i < packages.length; i++) {
    const d = calculateDistanceKm(
      dropPointLat,
      dropPointLng,
      packages[i].lat,
      packages[i].lng
    );
    if (d > maxDist) {
      maxDist = d;
      farthestIdx = i;
    }
  }

  const remaining = [...packages];
  const farthestPkg = remaining.splice(farthestIdx, 1)[0];
  const tour: DeliveryPackage[] = [farthestPkg];

  let curLat = farthestPkg.lat;
  let curLng = farthestPkg.lng;

  // Dari titik terjauh, susun yang mengarah mundur ke Drop Point
  while (remaining.length > 0) {
    let bestIdx = 0;
    let minScore = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const distFromCurrent = calculateDistanceKm(
        curLat,
        curLng,
        remaining[i].lat,
        remaining[i].lng
      );
      const distToDropPoint = calculateDistanceKm(
        remaining[i].lat,
        remaining[i].lng,
        dropPointLat,
        dropPointLng
      );

      // Prioritaskan paket yang dekat dan semakin mendekat ke Drop Point
      const score = distFromCurrent * 1.8 + distToDropPoint * 0.8;
      if (score < minScore) {
        minScore = score;
        bestIdx = i;
      }
    }

    const nextPkg = remaining.splice(bestIdx, 1)[0];
    tour.push(nextPkg);
    curLat = nextPkg.lat;
    curLng = nextPkg.lng;
  }

  // Terapkan 2-Opt dari titik awal terjauh
  return solveOpenTour2Opt(farthestPkg.lat, farthestPkg.lng, tour);
}

/**
 * Fungsi Utama Optimasi Rute Pengantaran
 */
export function optimizeDeliveryRoute(
  packages: DeliveryPackage[],
  dropPointLat: number,
  dropPointLng: number,
  strategy: RouteStrategy = 'optimal-tsp'
): DeliveryPackage[] {
  if (packages.length <= 1) {
    return packages.map((pkg, idx) => ({ ...pkg, orderIndex: idx + 1 }));
  }

  let ordered: DeliveryPackage[] = [];

  switch (strategy) {
    case 'optimal-tsp':
      ordered = optimizeTspNoBacktrack(packages, dropPointLat, dropPointLng);
      break;

    case 'cluster-sweep':
      ordered = optimizeClusterSweep(packages, dropPointLat, dropPointLng);
      break;

    case 'farthest-first':
      ordered = optimizeFarthestFirst(packages, dropPointLat, dropPointLng);
      break;

    case 'nearest-first':
    default:
      // Nearest-first dengan 2-Opt smoothing
      ordered = optimizeTspNoBacktrack(packages, dropPointLat, dropPointLng);
      break;
  }

  // Berikan nomor urut stop pengantaran (Stop #01, #02, dst)
  return ordered.map((pkg, idx) => ({
    ...pkg,
    orderIndex: idx + 1,
  }));
}

/**
 * Menghitung jarak stop saat ini dari titik sebelumnya (Drop Point atau Stop N-1)
 */
export function getStopLegInfo(
  currentPkg: DeliveryPackage,
  prevPkg: DeliveryPackage | null,
  dropPointLat: number,
  dropPointLng: number
): { distanceMeters: number; distanceKm: number; text: string; estMinutes: number } {
  const fromLat = prevPkg ? prevPkg.lat : dropPointLat;
  const fromLng = prevPkg ? prevPkg.lng : dropPointLng;
  const distKm = calculateDistanceKm(fromLat, fromLng, currentPkg.lat, currentPkg.lng);
  const distMeters = Math.round(distKm * 1000);
  const estMins = Math.max(1, Math.round((distKm / 25) * 60));

  let text = '';
  if (distMeters < 1000) {
    text = `+${distMeters} m (${estMins} mnt)`;
  } else {
    text = `+${distKm.toFixed(1)} km (${estMins} mnt)`;
  }

  return {
    distanceMeters: distMeters,
    distanceKm: distKm,
    text,
    estMinutes: estMins,
  };
}

/**
 * Buat URL Google Maps Universal untuk navigasi 1 tujuan
 */
export function getSingleNavigationUrl(
  lat: number,
  lng: number,
  address: string
): string {
  if (lat && lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    address
  )}`;
}

/**
 * Buat URL Google Maps Multi-Stop (Maksimal 9 waypoints Google Maps)
 * Disusun secara berurutan agar Google Maps menavigasi tanpa bolak-balik
 */
export function getMultiStopNavigationUrl(
  startLat: number,
  startLng: number,
  packages: DeliveryPackage[]
): string {
  if (packages.length === 0) return '';
  const last = packages[packages.length - 1];
  const waypoints = packages
    .slice(0, -1)
    .slice(0, 8)
    .map((p) => `${p.lat},${p.lng}`)
    .join('|');

  let url = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${last.lat},${last.lng}`;
  if (waypoints) {
    url += `&waypoints=${waypoints}`;
  }
  return url;
}
