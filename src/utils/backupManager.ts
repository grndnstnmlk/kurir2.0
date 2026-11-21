import type { SavedHousePoint, CourierSettings, DailyHistoryEntry } from '../types';
import { getSavedHousePoints } from './houseManager';

const STORAGE_KEY_PACKAGES = 'kurir2_packages_v1';
const STORAGE_KEY_SETTINGS = 'kurir2_settings_v1';
const STORAGE_KEY_HISTORY = 'kurir2_history_v1';
const STORAGE_KEY_SAVED_HOUSES = 'kurir2_saved_house_points';

export interface FullAppBackup {
  version: string;
  appName: string;
  exportedAt: string;
  savedHouses: SavedHousePoint[];
  settings?: CourierSettings;
  history?: DailyHistoryEntry[];
}

/**
 * Meminta browser HP agar mengunci memori penyimpanan (Anti-Hapus Otomatis oleh Sistem)
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`Persistent storage granted: ${isPersisted}`);
      return isPersisted;
    } catch (e) {
      console.warn('Storage persist request error:', e);
      return false;
    }
  }
  return false;
}

/**
 * Mengecek apakah penyimpanan browser saat ini sudah berstatus persisten
 */
export async function isStoragePersisted(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persisted) {
    try {
      return await navigator.storage.persisted();
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Ekspor seluruh data titik rumah, profil, dan riwayat menjadi file backup (.json)
 * Bisa disimpan di Google Drive, WhatsApp, atau memori HP
 */
export function exportAppBackup(): void {
  try {
    const savedHouses = getSavedHousePoints();
    const settingsRaw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    const historyRaw = localStorage.getItem(STORAGE_KEY_HISTORY);

    const backupData: FullAppBackup = {
      version: '2.0',
      appName: 'Kurir 2.0 Branta Pamekasan',
      exportedAt: new Date().toISOString(),
      savedHouses,
      settings: settingsRaw ? JSON.parse(settingsRaw) : undefined,
      history: historyRaw ? JSON.parse(historyRaw) : undefined,
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup-Kurir2-TitikRumah-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export backup:', err);
    alert('Gagal mengekspor file cadangan data.');
  }
}

/**
 * Impor & pulihkan seluruh data titik rumah dan riwayat dari file backup (.json)
 */
export function importAppBackup(
  file: File
): Promise<{ success: boolean; message: string; houseCount?: number }> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as FullAppBackup;

        if (!data || !Array.isArray(data.savedHouses)) {
          resolve({
            success: false,
            message: 'Format file tidak valid. Pastikan memilih file backup Kurir 2.0 (.json).',
          });
          return;
        }

        // Simpan titik rumah
        localStorage.setItem(STORAGE_KEY_SAVED_HOUSES, JSON.stringify(data.savedHouses));

        // Pulihkan settings jika ada
        if (data.settings) {
          localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(data.settings));
        }

        // Pulihkan riwayat jika ada
        if (data.history && Array.isArray(data.history)) {
          localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(data.history));
        }

        resolve({
          success: true,
          message: `Berhasil memulihkan ${data.savedHouses.length} titik rumah dan riwayat!`,
          houseCount: data.savedHouses.length,
        });
      } catch (err) {
        console.error('Failed to parse backup file:', err);
        resolve({
          success: false,
          message: 'Gagal membaca file cadangan. File mungkin rusak atau bukan format JSON.',
        });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, message: 'Gagal membuka file cadangan dari HP.' });
    };

    reader.readAsText(file);
  });
}
