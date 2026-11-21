import type { SavedHousePoint, DeliveryPackage } from '../types';

const STORAGE_KEY_SAVED_HOUSES = 'kurir2_saved_house_points';

export const INITIAL_SAMPLE_HOUSES: SavedHousePoint[] = [
  {
    id: 'house-branta-1',
    recipientName: 'H. Mat Rais (H. Rais)',
    recipientPhone: '6281234509871',
    fullAddress: 'Dusun Mayar RT 02/RW 01, Desa Branta Pesisir, Kec. Tlanakan',
    areaOrStreet: 'Dusun Mayar, Branta Pesisir',
    benchmark: 'Pagar hijau, samping dermaga TPI Branta, ada pohon mangga besar',
    lat: -7.2265,
    lng: 113.4495,
    accuracyMeters: 4.5,
    notes: 'Keluarga nelayan, kalau pagi jam 6-9 biasanya di pelabuhan jual ikan.',
    savedAt: '2026-11-20T08:30:00.000Z',
    deliveryCount: 3,
  },
  {
    id: 'house-branta-2',
    recipientName: 'Luluk',
    recipientPhone: '087812349073',
    fullAddress: 'Pelabuhan dermaga Branta pesisir dusun bandaran',
    areaOrStreet: 'Dusun Bandaran, Branta Pesisir',
    benchmark: 'Dinding berwarna coklat, pintu berwarna hitam, samping pos ronda',
    lat: -7.2255,
    lng: 113.4492,
    accuracyMeters: 3.8,
    notes: 'Langganan TikTok Shop paket baju. Rumah pas di gang kedua ke arah dermaga.',
    savedAt: '2026-11-21T07:15:00.000Z',
    deliveryCount: 1,
  },
  {
    id: 'house-branta-3',
    recipientName: 'Ibu Siti Fatimah',
    recipientPhone: '6287890123888',
    fullAddress: 'Jl. Raya Pelabuhan Branta No. 18, RT 01/RW 02, Desa Branta Pesisir',
    areaOrStreet: 'Jl. Raya Pelabuhan Branta',
    benchmark: 'Tepat di seberang Masjid Nurul Huda Branta Pesisir, pagar hitam',
    lat: -7.2240,
    lng: 113.4490,
    accuracyMeters: 5.0,
    notes: 'Buka toko sembako di teras depan. Paket bisa dititip di kasir warung.',
    savedAt: '2026-11-19T14:20:00.000Z',
    deliveryCount: 5,
  },
];

/**
 * Membaca daftar titik rumah yang tersimpan di LocalStorage
 */
export function getSavedHousePoints(): SavedHousePoint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_HOUSES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    // Set initial sample houses jika baru pertama kali
    localStorage.setItem(STORAGE_KEY_SAVED_HOUSES, JSON.stringify(INITIAL_SAMPLE_HOUSES));
    return INITIAL_SAMPLE_HOUSES;
  } catch (err) {
    console.error('Failed to read saved house points:', err);
    return INITIAL_SAMPLE_HOUSES;
  }
}

/**
 * Menyimpan atau memperbarui data titik rumah
 */
export function saveHousePoint(house: SavedHousePoint): SavedHousePoint[] {
  try {
    const current = getSavedHousePoints();
    const existingIndex = current.findIndex((h) => h.id === house.id);
    let updated: SavedHousePoint[];

    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = {
        ...house,
        updatedAt: new Date().toISOString(),
      };
    } else {
      updated = [
        {
          ...house,
          savedAt: house.savedAt || new Date().toISOString(),
          deliveryCount: (house.deliveryCount || 0) + 1,
        },
        ...current,
      ];
    }

    localStorage.setItem(STORAGE_KEY_SAVED_HOUSES, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save house point:', err);
    return getSavedHousePoints();
  }
}

/**
 * Menghapus titik rumah berdasarkan ID
 */
export function deleteHousePoint(id: string): SavedHousePoint[] {
  try {
    const current = getSavedHousePoints();
    const updated = current.filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEY_SAVED_HOUSES, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to delete house point:', err);
    return getSavedHousePoints();
  }
}

/**
 * Mengompres foto rumah agar sangat ringan (~50-80 KB)
 * sehingga ratusan foto bisa disimpan di LocalStorage tanpa membebani memori HP
 */
export function compressHousePhoto(fileOrBlob: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDimension = 800; // Cukup sangat tajam untuk melihat gerbang & tampak depan rumah
      let w = img.width;
      let h = img.height;

      if (w > maxDimension || h > maxDimension) {
        if (w > h) {
          h = Math.round((h * maxDimension) / w);
          w = maxDimension;
        } else {
          w = Math.round((w * maxDimension) / h);
          h = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);

      // Konversi ke Base64 JPEG kualitas 0.8
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      resolve(base64);
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };

    img.src = url;
  });
}

/**
 * Mengambil koordinat GPS presisi langsung dari sensor HP saat kurir berdiri di depan rumah
 */
export function getCurrentGpsLocation(): Promise<{ lat: number; lng: number; accuracy?: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS Geolocation tidak didukung di perangkat ini.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Mencocokkan paket pengantaran dengan database titik rumah tersimpan
 * Cek berdasarkan: Nama mirip, No HP sama, atau jarak koordinat sangat dekat (< 50m)
 */
export function findMatchingHouse(
  houses: SavedHousePoint[],
  pkg: Partial<DeliveryPackage>
): SavedHousePoint | undefined {
  if (!houses || houses.length === 0 || !pkg) return undefined;

  const pkgPhone = pkg.recipientPhone ? pkg.recipientPhone.replace(/\D/g, '') : '';
  const pkgName = pkg.recipientName ? pkg.recipientName.toLowerCase().trim() : '';

  for (const h of houses) {
    const hPhone = h.recipientPhone ? h.recipientPhone.replace(/\D/g, '') : '';
    // 1. Cek No HP cocok (setidaknya 8 digit terakhir sama)
    if (pkgPhone && hPhone && pkgPhone.length >= 8 && hPhone.length >= 8) {
      if (pkgPhone.endsWith(hPhone.slice(-8)) || hPhone.endsWith(pkgPhone.slice(-8))) {
        return h;
      }
    }

    // 2. Cek Nama Penerima cocok
    const hName = h.recipientName ? h.recipientName.toLowerCase().trim() : '';
    if (pkgName && hName && pkgName.length >= 3 && hName.length >= 3) {
      if (hName.includes(pkgName) || pkgName.includes(hName)) {
        return h;
      }
    }

    // 3. Cek Jarak GPS sangat dekat (< 45 meter)
    if (pkg.lat && pkg.lng && h.lat && h.lng) {
      const dLat = (pkg.lat - h.lat) * 111320;
      const dLng = (pkg.lng - h.lng) * 111320 * Math.cos((h.lat * Math.PI) / 180);
      const distMeters = Math.sqrt(dLat * dLat + dLng * dLng);
      if (distMeters < 45) {
        return h;
      }
    }
  }

  return undefined;
}
