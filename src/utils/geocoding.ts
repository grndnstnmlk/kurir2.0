/**
 * Modul Geocoding cerdas untuk alamat Indonesia & wilayah Branta, Pamekasan, Madura
 * Dilengkapi cache dan fallback lokal jika offline / alamat dusun & gang pesisir.
 */

const geocodeCache: Record<string, { lat: number; lng: number }> = {};

export async function geocodeAddress(
  address: string,
  fallbackBaseLat: number = -7.2187, // Branta Tinggi & Pesisir, Pamekasan
  fallbackBaseLng: number = 113.4490
): Promise<{ lat: number; lng: number }> {
  const cleanAddr = address.trim();
  if (!cleanAddr) {
    return { lat: fallbackBaseLat, lng: fallbackBaseLng };
  }

  // 1. Cek Cache
  if (geocodeCache[cleanAddr]) {
    return geocodeCache[cleanAddr];
  }

  // 2. Coba Nominatim OpenStreetMap
  try {
    const searchQuery = cleanAddr
      .replace(/RT\s*\d+\s*\/?\s*RW\s*\d+/gi, '')
      .replace(/No\.\s*\d+/gi, '')
      .replace(/Dusun\s+/gi, '')
      .trim();

    // Tambahkan konteks Pamekasan jika belum ada di teks
    let queryWithContext = searchQuery || cleanAddr;
    if (!/pamekasan|tlanakan|madura/i.test(queryWithContext)) {
      queryWithContext += ', Pamekasan';
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      queryWithContext
    )}&countrycodes=id&limit=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Kurir2.0-Madura/1.0',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const result = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        geocodeCache[cleanAddr] = result;
        return result;
      }
    }
  } catch {
    // Jika timeout/offline, gunakan fallback cerdas
  }

  // 3. Fallback Cerdas Berdasarkan Hash Teks Alamat di sekitar Branta Pamekasan
  let hash = 0;
  for (let i = 0; i < cleanAddr.length; i++) {
    hash = (hash << 5) - hash + cleanAddr.charCodeAt(i);
    hash |= 0;
  }

  // Distribusikan dalam radius ~1-2 km dari area Branta / Tlanakan
  const latOffset = ((Math.abs(hash) % 1000) / 1000 - 0.5) * 0.025;
  const lngOffset = ((Math.abs(hash >> 3) % 1000) / 1000 - 0.5) * 0.025;

  const fallbackCoord = {
    lat: fallbackBaseLat + latOffset,
    lng: fallbackBaseLng + lngOffset,
  };

  geocodeCache[cleanAddr] = fallbackCoord;
  return fallbackCoord;
}
