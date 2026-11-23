import type { SavedHousePoint, DeliveryPackage } from '../types';
import { supabase } from './supabaseClient';
import { getActiveSessionId } from './cloudSyncManager';

const STORAGE_KEY_SAVED_HOUSES = 'kurir2_saved_house_points';

/**
 * Menyimpan titik rumah ke LocalStorage dengan proteksi kuota 5MB browser.
 * Jika memori penuh karena ukuran foto Base64, foto pada data lama otomatis disusutkan
 * sementara seluruh metadata, koordinat GPS, dan patokan rumah tetap tersimpan 100%.
 */
export function saveHousesToLocalStorageSafely(houses: SavedHousePoint[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_HOUSES, JSON.stringify(houses));
  } catch (quotaError) {
    console.warn('LocalStorage quota exceeded with full photos, optimizing local cache...', quotaError);
    try {
      // Simpan foto hanya untuk 3 titik terbaru, sedangkan titik lainnya tetap aman di Cloud Supabase
      const lightweight = houses.map((h, idx) => (idx < 3 ? h : { ...h, photoUrl: undefined }));
      localStorage.setItem(STORAGE_KEY_SAVED_HOUSES, JSON.stringify(lightweight));
    } catch {
      try {
        // Jika masih penuh, simpan semua titik rumah & koordinat GPS tanpa foto di localStorage
        const noPhotos = houses.map((h) => ({ ...h, photoUrl: undefined }));
        localStorage.setItem(STORAGE_KEY_SAVED_HOUSES, JSON.stringify(noPhotos));
      } catch (finalErr) {
        console.error('Failed to cache houses to localStorage:', finalErr);
      }
    }
  }
}

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
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Set initial sample houses jika baru pertama kali
    saveHousesToLocalStorageSafely(INITIAL_SAMPLE_HOUSES);
    return INITIAL_SAMPLE_HOUSES;
  } catch (err) {
    console.error('Failed to read saved house points:', err);
    return INITIAL_SAMPLE_HOUSES;
  }
}

/**
 * Menyimpan atau memperbarui data titik rumah
 */
export function saveHousePoint(house: SavedHousePoint, sessionId?: string): SavedHousePoint[] {
  try {
    const current = getSavedHousePoints();
    const existingIndex = current.findIndex((h) => h.id === house.id);
    let updated: SavedHousePoint[];

    const finalHouse: SavedHousePoint = existingIndex >= 0
      ? { ...house, updatedAt: new Date().toISOString() }
      : { ...house, savedAt: house.savedAt || new Date().toISOString(), deliveryCount: (house.deliveryCount || 0) + 1 };

    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = finalHouse;
    } else {
      updated = [finalHouse, ...current];
    }

    saveHousesToLocalStorageSafely(updated);

    // Langsung upsert ke Cloud Supabase agar perangkat lain (PC / iPhone) langsung menerima pembaruan
    const activeSession = sessionId || getActiveSessionId();
    const singlePayload = {
      id: finalHouse.id,
      session_id: activeSession,
      recipient_name: finalHouse.recipientName,
      recipient_phone: finalHouse.recipientPhone || '',
      full_address: finalHouse.fullAddress,
      area_or_street: finalHouse.areaOrStreet || '',
      benchmark: finalHouse.benchmark || '',
      photo_url: finalHouse.photoUrl || null,
      lat: finalHouse.lat,
      lng: finalHouse.lng,
      accuracy_meters: finalHouse.accuracyMeters || null,
      notes: finalHouse.notes || '',
      saved_at: finalHouse.savedAt,
      delivery_count: finalHouse.deliveryCount || 1,
    };

    Promise.resolve(
      supabase
        .from('saved_houses')
        .upsert(singlePayload, { onConflict: 'id' })
    )
      .then(({ error }) => {
        if (error) console.warn('Supabase single house push warning:', error.message);
      })
      .catch((e: any) => console.warn('Supabase single house push error:', e));

    return updated;
  } catch (err) {
    console.error('Failed to save house point:', err);
    return getSavedHousePoints();
  }
}

/**
 * Sinkronisasi data titik rumah lokal ke Cloud Supabase
 */
export async function syncHousesWithSupabase(sessionId?: string): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  try {
    const localHouses = getSavedHousePoints();
    if (localHouses.length === 0) return { success: true, count: 0 };

    const activeSession = sessionId || getActiveSessionId();

    const payload = localHouses.map((h) => ({
      id: h.id,
      session_id: activeSession,
      recipient_name: h.recipientName,
      recipient_phone: h.recipientPhone,
      full_address: h.fullAddress,
      area_or_street: h.areaOrStreet,
      benchmark: h.benchmark,
      photo_url: h.photoUrl || null,
      lat: h.lat,
      lng: h.lng,
      accuracy_meters: h.accuracyMeters || null,
      notes: h.notes,
      saved_at: h.savedAt,
      delivery_count: h.deliveryCount || 1,
    }));

    const { error } = await supabase
      .from('saved_houses')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: payload.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Gagal sinkron cloud' };
  }
}

/**
 * Mengambil data titik rumah dari Cloud Supabase (untuk sinkronisasi PC & iPhone)
 */
export async function fetchHousesFromSupabase(sessionId?: string): Promise<{
  success: boolean;
  houses?: SavedHousePoint[];
  error?: string;
}> {
  try {
    const activeSession = sessionId || getActiveSessionId();
    let query = supabase
      .from('saved_houses')
      .select('*')
      .order('saved_at', { ascending: false });

    if (activeSession) {
      query = query.or(`session_id.eq.${activeSession},session_id.is.null`);
    }

    let { data, error } = await query;

    // Fallback: Jika filter sesi tidak menghasilkan data, ambil seluruh titik rumah tersimpan di database
    if (!data || data.length === 0) {
      const fallback = await supabase
        .from('saved_houses')
        .select('*')
        .order('saved_at', { ascending: false });
      if (fallback.data && fallback.data.length > 0) {
        data = fallback.data;
        error = fallback.error;
      }
    }

    if (error) {
      console.warn('Supabase fetch houses warning:', error.message);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      const localHouses = getSavedHousePoints();
      return { success: true, houses: localHouses };
    }

    const remoteHouses: SavedHousePoint[] = data.map((r: any) => ({
      id: r.id,
      recipientName: r.recipient_name,
      recipientPhone: r.recipient_phone || '',
      fullAddress: r.full_address,
      areaOrStreet: r.area_or_street || '',
      benchmark: r.benchmark || '',
      photoUrl: r.photo_url || undefined,
      lat: Number(r.lat),
      lng: Number(r.lng),
      accuracyMeters: r.accuracy_meters ? Number(r.accuracy_meters) : undefined,
      notes: r.notes || '',
      savedAt: r.saved_at || new Date().toISOString(),
      deliveryCount: r.delivery_count || 1,
    }));

    // Gabungkan dengan data lokal (merge) agar tidak ada data yang hilang
    const localHouses = getSavedHousePoints();
    const map = new Map<string, SavedHousePoint>();
    
    // Utamakan remote houses yang tersimpan di Cloud Supabase
    remoteHouses.forEach((h) => map.set(h.id, h));
    
    // Pertahankan titik rumah lokal jika ada yang belum terunggah
    localHouses.forEach((h) => {
      if (!map.has(h.id)) {
        map.set(h.id, h);
      }
    });

    const merged: SavedHousePoint[] = Array.from(map.values()).sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );

    saveHousesToLocalStorageSafely(merged);
    return { success: true, houses: merged };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal memuat dari cloud' };
  }
}

/**
 * Menghapus titik rumah berdasarkan ID (Lokal & Supabase Cloud)
 */
export function deleteHousePoint(id: string): SavedHousePoint[] {
  try {
    const current = getSavedHousePoints();
    const updated = current.filter((h) => h.id !== id);
    saveHousesToLocalStorageSafely(updated);

    // Hapus juga di cloud Supabase
    Promise.resolve(
      supabase
        .from('saved_houses')
        .delete()
        .eq('id', id)
    )
      .then(() => {})
      .catch((err: any) => console.warn('Failed to delete house on cloud:', err));

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
 * Catat titik GPS instan saat kurir berdiri di lokasi (1-tap, tanpa modal/form/foto)
 * Memperbarui data titik rumah dan menyimpannya langsung ke LocalStorage
 */
export async function quickRecordCurrentGpsPoint(
  pkg?: Partial<DeliveryPackage>,
  customLabel?: string
): Promise<{ savedHouse: SavedHousePoint; updatedList: SavedHousePoint[] }> {
  const loc = await getCurrentGpsLocation();
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

  const currentHouses = getSavedHousePoints();
  const matched = pkg ? findMatchingHouse(currentHouses, pkg) : undefined;
  const isMatchValid = matched && pkg && isSameCustomer(matched, pkg);

  const houseId = isMatchValid ? matched.id : (pkg?.id ? `house-pkg-${pkg.id}` : `house-gps-${Date.now()}`);
  
  const recipientName =
    pkg?.recipientName?.trim() ||
    customLabel?.trim() ||
    (isMatchValid ? matched?.recipientName : undefined) ||
    `Titik Lokasi (${dateStr}, ${timeStr})`;

  const fullAddress =
    pkg?.fullAddress?.trim() ||
    (isMatchValid ? matched?.fullAddress : undefined) ||
    pkg?.areaOrStreet ||
    `Titik GPS (${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)})`;

  const areaOrStreet =
    pkg?.areaOrStreet?.trim() ||
    (isMatchValid ? matched?.areaOrStreet : undefined) ||
    'Branta Pamekasan';

  const newHousePoint: SavedHousePoint = {
    id: houseId,
    recipientName,
    recipientPhone: pkg?.recipientPhone?.trim() || (isMatchValid ? matched?.recipientPhone : '') || '',
    fullAddress,
    areaOrStreet,
    benchmark: (isMatchValid ? matched?.benchmark : undefined) || 'Titik dikunci instan di lokasi kurir (1-tap)',
    photoUrl: isMatchValid ? matched?.photoUrl : undefined,
    lat: loc.lat,
    lng: loc.lng,
    accuracyMeters: loc.accuracy,
    notes: (isMatchValid ? matched?.notes : undefined) || `Dikunci langsung pada ${dateStr} jam ${timeStr} (Akurasi: ±${Math.round(loc.accuracy || 4)}m)`,
    savedAt: (isMatchValid ? matched?.savedAt : undefined) || now.toISOString(),
    deliveryCount: ((isMatchValid ? matched?.deliveryCount : 0) || 0) + 1,
  };

  const updatedList = saveHousePoint(newHousePoint);
  return { savedHouse: newHousePoint, updatedList };
}

/**
 * Memeriksa apakah data titik rumah tersimpan benar-benar milik pelanggan yang sama
 * (berdasarkan ID paket langsung, kecocokan No HP, atau kesamaan nama penerima)
 */
export function isSameCustomer(
  house: SavedHousePoint,
  pkg: Partial<DeliveryPackage>
): boolean {
  if (!house || !pkg) return false;

  // 1. Cocokkan ID Paket Langsung
  if (pkg.id && (house.id === `house-pkg-${pkg.id}` || house.id.includes(pkg.id))) {
    return true;
  }

  // 2. Cocokkan No HP (minimal 8 digit identik, abaikan sensor *)
  const pkgPhone = pkg.recipientPhone ? pkg.recipientPhone.replace(/\D/g, '') : '';
  const hPhone = house.recipientPhone ? house.recipientPhone.replace(/\D/g, '') : '';
  if (pkgPhone.length >= 8 && hPhone.length >= 8) {
    if (pkgPhone.endsWith(hPhone.slice(-8)) || hPhone.endsWith(pkgPhone.slice(-8))) {
      return true;
    }
  }

  // 3. Cocokkan Nama Penerima
  const cleanPkgName = (pkg.recipientName || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();

  const cleanHName = (house.recipientName || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();

  if (cleanPkgName.length >= 3 && cleanHName.length >= 3) {
    if (cleanHName === cleanPkgName) return true;

    const wordsPkg = cleanPkgName.split(/\s+/).filter((w) => w.length >= 3);
    const wordsH = cleanHName.split(/\s+/).filter((w) => w.length >= 3);

    // Jika nama terdiri dari 2 kata atau lebih (cth: "Diana Laili"), harus ada kecocokan signifikan
    if (wordsPkg.length >= 2 && wordsH.length >= 2) {
      const matchWords = wordsPkg.filter((wp) => wordsH.some((wh) => wh === wp));
      // Jika memiliki 2 kata yang sama, baru dianggap pelanggan yang sama (menghindari "Diana Laili" vs "Haulatul Laili")
      if (matchWords.length >= 2) return true;
      return false;
    }

    // Jika 1 kata (cth: "Luluk" vs "Luluk"), cocokkan secara persis
    if (wordsPkg.length === 1 && wordsH.length === 1 && wordsPkg[0] === wordsH[0]) {
      return true;
    }
  }

  return false;
}

/**
 * Mencocokkan paket pengantaran dengan database titik rumah tersimpan
 * Cek HANYA berdasarkan: ID paket yang sama, No HP yang cocok, atau Nama pelanggan yang cocok.
 * PERHATIAN: Jarak GPS saja (< 45m) TIDAK BOLEH mencocokkan tetangga yang berbeda orang!
 */
export function findMatchingHouse(
  houses: SavedHousePoint[],
  pkg: Partial<DeliveryPackage>
): SavedHousePoint | undefined {
  if (!houses || houses.length === 0 || !pkg) return undefined;

  // 1. Prioritas Utama: ID paket langsung
  if (pkg.id) {
    const directId = houses.find((h) => h.id === `house-pkg-${pkg.id}` || h.id.includes(pkg.id!));
    if (directId) return directId;
  }

  // 2. Prioritas Kedua: No HP cocok (minimal 8 digit)
  const pkgPhone = pkg.recipientPhone ? pkg.recipientPhone.replace(/\D/g, '') : '';
  if (pkgPhone.length >= 8) {
    const phoneMatch = houses.find((h) => {
      const hPhone = h.recipientPhone ? h.recipientPhone.replace(/\D/g, '') : '';
      return hPhone.length >= 8 && (pkgPhone.endsWith(hPhone.slice(-8)) || hPhone.endsWith(pkgPhone.slice(-8)));
    });
    if (phoneMatch) return phoneMatch;
  }

  // 3. Prioritas Ketiga: Nama penerima cocok secara ketat
  const nameMatch = houses.find((h) => isSameCustomer(h, pkg));
  if (nameMatch) return nameMatch;

  return undefined;
}

/**
 * Alur Cepat 1-Langkah: Foto Rumah -> Kunci GPS -> Paket Selesai Kirim
 * Dipanggil saat kurir memfoto rumah penerima di depan lokasi.
 * 1. Mengambil foto rumah & mengompresnya (~50-80 KB)
 * 2. Mengunci titik GPS lokasi kurir secara presisi
 * 3. Menyimpan titik rumah ke buku katalog & push otomatis ke Supabase
 * 4. Mengembalikan data titik rumah yang diperbarui
 */
export async function deliverWithHousePhoto(
  pkg: DeliveryPackage,
  photoFile: File,
  customGps?: { lat: number; lng: number; accuracy?: number }
): Promise<{ savedHouse: SavedHousePoint; updatedHouses: SavedHousePoint[] }> {
  // 1. Kompres foto rumah
  const photoUrl = await compressHousePhoto(photoFile);

  // 2. Ambil GPS saat ini jika belum ada
  let lat = customGps?.lat ?? pkg.lat;
  let lng = customGps?.lng ?? pkg.lng;
  let accuracy = customGps?.accuracy;

  try {
    const loc = await getCurrentGpsLocation();
    lat = loc.lat;
    lng = loc.lng;
    accuracy = loc.accuracy;
  } catch (e) {
    console.warn('Could not get fresh GPS, using existing package coordinates:', e);
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

  const currentHouses = getSavedHousePoints();
  const matched = findMatchingHouse(currentHouses, pkg);
  const isMatchValid = matched && isSameCustomer(matched, pkg);

  // Kunci ID: Selalu berikan ID tersendiri untuk paket ini jika bukan penerima yang sama persis
  const houseId = isMatchValid ? matched.id : `house-pkg-${pkg.id}`;

  const houseToSave: SavedHousePoint = {
    id: houseId,
    recipientName: pkg.recipientName || (isMatchValid ? matched.recipientName : 'Pelanggan J&T'),
    recipientPhone: pkg.recipientPhone || (isMatchValid ? matched.recipientPhone : '') || '',
    fullAddress: pkg.fullAddress || (isMatchValid ? matched.fullAddress : '') || '',
    areaOrStreet: pkg.areaOrStreet || (isMatchValid ? matched.areaOrStreet : 'Branta Pamekasan'),
    benchmark: (isMatchValid && matched.benchmark) ? matched.benchmark : `Rumah ${pkg.recipientName}`,
    photoUrl, // Foto rumah milik paket ini
    lat,
    lng,
    accuracyMeters: accuracy,
    notes: `Paket ${pkg.trackingNumber} berhasil diantar pada ${dateStr} jam ${timeStr}`,
    savedAt: (isMatchValid && matched.savedAt) ? matched.savedAt : now.toISOString(),
    updatedAt: now.toISOString(),
    deliveryCount: ((isMatchValid ? matched.deliveryCount : 0) || 0) + 1,
  };

  const updatedHouses = saveHousePoint(houseToSave);
  return { savedHouse: houseToSave, updatedHouses };
}
