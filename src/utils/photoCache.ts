/**
 * Penyimpanan cache foto rumah berbasis IndexedDB (kapasitas ratusan MB)
 * agar foto tidak terhapus oleh batas kuota 5 MB milik LocalStorage browser.
 */

const DB_NAME = 'kurir2_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'house_photos';

export interface CachedHousePhoto {
  id: string;
  photoUrl: string;
  updatedAt?: string;
}

function openPhotoDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function savePhotoToCache(
  id: string,
  photoUrl: string,
  updatedAt?: string
): Promise<void> {
  if (!id || !photoUrl) return;
  await savePhotosBatchToCache([{ id, photoUrl, updatedAt }]);
}

export async function savePhotosBatchToCache(entries: CachedHousePhoto[]): Promise<void> {
  const valid = entries.filter((e) => e.id && e.photoUrl);
  if (valid.length === 0) return;

  const db = await openPhotoDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const item of valid) {
        store.put({
          id: item.id,
          photoUrl: item.photoUrl,
          updatedAt: item.updatedAt,
        });
      }
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

export async function getAllCachedPhotos(): Promise<Record<string, { photoUrl: string; updatedAt?: string }>> {
  const db = await openPhotoDb();
  if (!db) return {};

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const map: Record<string, { photoUrl: string; updatedAt?: string }> = {};
        const rows = Array.isArray(req.result) ? req.result : [];
        for (const r of rows) {
          if (r && r.id && r.photoUrl) {
            map[r.id] = { photoUrl: r.photoUrl, updatedAt: r.updatedAt };
          }
        }
        db.close();
        resolve(map);
      };
      req.onerror = () => {
        db.close();
        resolve({});
      };
    } catch {
      db.close();
      resolve({});
    }
  });
}

export async function deletePhotoFromCache(id: string): Promise<void> {
  if (!id) return;
  const db = await openPhotoDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}
