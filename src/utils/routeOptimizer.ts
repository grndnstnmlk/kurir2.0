import type { DeliveryPackage, RouteStrategy } from '../types';

/**
 * Menghitung jarak lurus antara dua koordinat bumi menggunakan rumus Haversine (dalam km)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
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
 * Mengoptimalkan urutan pengantaran paket berdasarkan strategi yang dipilih
 */
export function optimizeDeliveryRoute(
  packages: DeliveryPackage[],
  dropPointLat: number,
  dropPointLng: number,
  strategy: RouteStrategy
): DeliveryPackage[] {
  if (packages.length <= 1) {
    return packages.map((pkg, idx) => ({ ...pkg, orderIndex: idx + 1 }));
  }

  const list = [...packages];

  if (strategy === 'farthest-first') {
    let farthestIndex = 0;
    let maxDist = -1;

    for (let i = 0; i < list.length; i++) {
      const dist = calculateDistanceKm(
        dropPointLat,
        dropPointLng,
        list[i].lat,
        list[i].lng
      );
      if (dist > maxDist) {
        maxDist = dist;
        farthestIndex = i;
      }
    }

    const ordered: DeliveryPackage[] = [];
    const remaining = [...list];

    let current = remaining.splice(farthestIndex, 1)[0];
    ordered.push(current);

    while (remaining.length > 0) {
      let bestIdx = 0;
      let minScore = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const distFromCurrent = calculateDistanceKm(
          current.lat,
          current.lng,
          remaining[i].lat,
          remaining[i].lng
        );
        const distToDropPoint = calculateDistanceKm(
          remaining[i].lat,
          remaining[i].lng,
          dropPointLat,
          dropPointLng
        );

        const score = distFromCurrent * 1.5 + distToDropPoint * 0.5;
        if (score < minScore) {
          minScore = score;
          bestIdx = i;
        }
      }

      current = remaining.splice(bestIdx, 1)[0];
      ordered.push(current);
    }

    return ordered.map((pkg, idx) => ({
      ...pkg,
      orderIndex: idx + 1,
    }));
  } else if (strategy === 'nearest-first') {
    const ordered: DeliveryPackage[] = [];
    const remaining = [...list];
    let curLat = dropPointLat;
    let curLng = dropPointLng;

    while (remaining.length > 0) {
      let nearestIdx = 0;
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
          nearestIdx = i;
        }
      }

      const nextPkg = remaining.splice(nearestIdx, 1)[0];
      curLat = nextPkg.lat;
      curLng = nextPkg.lng;
      ordered.push(nextPkg);
    }

    return ordered.map((pkg, idx) => ({
      ...pkg,
      orderIndex: idx + 1,
    }));
  } else {
    const sorted = [...list].sort((a, b) => {
      if (a.areaOrStreet.toLowerCase() === b.areaOrStreet.toLowerCase()) {
        return a.recipientName.localeCompare(b.recipientName);
      }
      return a.areaOrStreet.localeCompare(b.areaOrStreet);
    });

    return sorted.map((pkg, idx) => ({
      ...pkg,
      orderIndex: idx + 1,
    }));
  }
}

/**
 * Buat URL Google Maps Universal untuk navigasi 1 tujuan
 */
export function getSingleNavigationUrl(lat: number, lng: number, address: string): string {
  if (lat && lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

/**
 * Buat URL Google Maps Multi-Stop (Maksimal 9 waypoints Google Maps)
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
