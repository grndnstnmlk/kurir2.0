import type { SavedHousePoint, DeliveryPackage } from '../types';
import { supabase } from './supabaseClient';
import { getActiveSessionId } from './cloudSyncManager';

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

    localStorage.setItem(STORAGE_KEY_SAVED_HOUSES, JSON.stringify(updated));

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

    const { data, error } = await query;

    if (error) {
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

    localStorage.setItem(STORAGE_KEY_SAVED_HOUSES, JSON.stringify(merged));
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
    localStorage.setItem(STORAGE_KEY_SAVED_HOUSES, JSON.stringify(updated));

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

  const houseId = matched?.id || (pkg?.id ? `house-pkg-${pkg.id}` : `house-gps-${Date.now()}`);
  
  const recipientName =
    pkg?.recipientName?.trim() ||
    customLabel?.trim() ||
    matched?.recipientName ||
    `Titik Lokasi (${dateStr}, ${timeStr})`;

  const fullAddress =
    pkg?.fullAddress?.trim() ||
    matched?.fullAddress ||
    pkg?.areaOrStreet ||
    `Titik GPS (${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)})`;

  const areaOrStreet =
    pkg?.areaOrStreet?.trim() ||
    matched?.areaOrStreet ||
    'Branta Pamekasan';

  const newHousePoint: SavedHousePoint = {
    id: houseId,
    recipientName,
    recipientPhone: pkg?.recipientPhone?.trim() || matched?.recipientPhone || '',
    fullAddress,
    areaOrStreet,
    benchmark: matched?.benchmark || 'Titik dikunci instan di lokasi kurir (1-tap)',
    photoUrl: matched?.photoUrl,
    lat: loc.lat,
    lng: loc.lng,
    accuracyMeters: loc.accuracy,
    notes: matched?.notes || `Dikunci langsung pada ${dateStr} jam ${timeStr} (Akurasi: ±${Math.round(loc.accuracy || 4)}m)`,
    savedAt: matched?.savedAt || now.toISOString(),
    deliveryCount: (matched?.deliveryCount || 0) + 1,
  };

  const updatedList = saveHousePoint(newHousePoint);
  return { savedHouse: newHousePoint, updatedList };
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
