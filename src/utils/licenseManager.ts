import { supabase, type LicenseRecord } from './supabaseClient';

const STORAGE_KEY_LICENSE = 'kurir2_license_v1';
const STORAGE_KEY_DEVICE = 'kurir2_device_id_v1';
const STORAGE_KEY_TRIAL = 'kurir2_trial_used_v1';

export interface LocalLicenseInfo {
  code: string;
  buyerName?: string;
  expiresAt: string;
  isTrial?: boolean;
  status: 'active' | 'expired' | 'revoked';
  activatedAt: string;
}

/**
 * Mengambil atau membuat identitas unik perangkat (Device Fingerprint)
 * untuk mencegah 1 kode langganan dibagikan ke banyak HP kurir lain
 */
export function getOrCreateDeviceId(): string {
  try {
    let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE);
    if (!deviceId) {
      deviceId =
        'dev-' +
        Math.random().toString(36).substring(2, 9) +
        '-' +
        Date.now().toString(36);
      localStorage.setItem(STORAGE_KEY_DEVICE, deviceId);
    }
    return deviceId;
  } catch {
    return 'dev-default-fallback';
  }
}

/**
 * Mengambil status lisensi yang tersimpan lokal di HP
 */
export function getLocalLicense(): LocalLicenseInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LICENSE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Menghitung sisa hari aktif
 */
export function getDaysRemaining(expiresAt: string): number {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Mengecek apakah lisensi saat ini masih aktif dan berlaku
 */
export function isLicenseValid(license: LocalLicenseInfo | null): boolean {
  if (!license) return false;
  if (license.status !== 'active') return false;
  const exp = new Date(license.expiresAt).getTime();
  return exp > Date.now();
}

/**
 * Aktivasi Kode Akses Bulanan via Database Supabase
 */
export async function activateLicenseCode(
  inputCode: string
): Promise<{ success: boolean; message: string; license?: LocalLicenseInfo }> {
  const cleanCode = inputCode.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, message: 'Masukkan kode akses terlebih dahulu.' };
  }

  const deviceId = getOrCreateDeviceId();

  try {
    // 1. Ambil data lisensi dari Supabase
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('code', cleanCode)
      .maybeSingle();

    if (error) {
      console.error('Supabase query error:', error);
      return {
        success: false,
        message: 'Gagal menghubungkan ke server lisensi. Periksa koneksi internet Anda.',
      };
    }

    if (!data) {
      return {
        success: false,
        message: 'Kode akses tidak ditemukan atau salah ketik. Pastikan kode benar.',
      };
    }

    const lic = data as LicenseRecord;

    // 2. Cek status
    if (lic.status === 'revoked') {
      return {
        success: false,
        message: 'Kode akses ini telah dinonaktifkan oleh admin.',
      };
    }

    // 3. Cek penguncian perangkat (Anti-sharing)
    if (lic.device_id && lic.device_id !== deviceId) {
      return {
        success: false,
        message:
          'Kode akses ini sudah terdaftar di HP kurir lain. Hubungi admin jika Anda berganti HP.',
      };
    }

    // 4. Hitung tanggal kadaluarsa
    const now = new Date();
    let expiresAt = lic.expires_at ? new Date(lic.expires_at) : null;
    const durationDays = lic.duration_days || 30;

    // Jika baru pertama kali diaktifkan, mulai hitung dari sekarang
    if (!lic.activated_at || !expiresAt) {
      expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // Simpan aktivasi ke Supabase
      await supabase
        .from('licenses')
        .update({
          activated_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          device_id: deviceId,
          status: 'active',
        })
        .eq('id', lic.id);
    } else {
      // Jika kode sudah pernah aktif, pastikan belum expired
      if (expiresAt.getTime() <= now.getTime()) {
        return {
          success: false,
          message:
            'Masa aktif kode ini telah berakhir. Silakan hubungi admin untuk perpanjangan Rp 100rb/bulan.',
        };
      }

      // Pastikan device_id terkunci
      if (!lic.device_id) {
        await supabase
          .from('licenses')
          .update({ device_id: deviceId })
          .eq('id', lic.id);
      }
    }

    const localInfo: LocalLicenseInfo = {
      code: lic.code,
      buyerName: lic.buyer_name || undefined,
      expiresAt: expiresAt.toISOString(),
      isTrial: false,
      status: 'active',
      activatedAt: lic.activated_at || now.toISOString(),
    };

    localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(localInfo));

    return {
      success: true,
      message: `Aktivasi berhasil! Masa aktif Anda berlaku ${getDaysRemaining(
        expiresAt.toISOString()
      )} hari ke depan.`,
      license: localInfo,
    };
  } catch (e: any) {
    console.error('License activation exception:', e);
    return {
      success: false,
      message: 'Terjadi kesalahan sistem aktivasi: ' + (e.message || 'Unknown error'),
    };
  }
}

/**
 * Aktivasi Masa Uji Coba Gratis 2 Hari (Free Trial)
 */
export function startFreeTrial(): {
  success: boolean;
  message: string;
  license?: LocalLicenseInfo;
} {
  try {
    const trialUsed = localStorage.getItem(STORAGE_KEY_TRIAL);
    if (trialUsed) {
      return {
        success: false,
        message: 'Perangkat ini sudah pernah menggunakan masa uji coba gratis.',
      };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 hari

    const trialInfo: LocalLicenseInfo = {
      code: 'FREE-TRIAL-2HARI',
      buyerName: 'Kurir Uji Coba',
      expiresAt: expiresAt.toISOString(),
      isTrial: true,
      status: 'active',
      activatedAt: now.toISOString(),
    };

    localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(trialInfo));
    localStorage.setItem(STORAGE_KEY_TRIAL, 'true');

    return {
      success: true,
      message: 'Masa uji coba gratis 2 hari berhasil diaktifkan! Selamat mencoba.',
      license: trialInfo,
    };
  } catch (e: any) {
    return {
      success: false,
      message: 'Gagal mengaktifkan masa uji coba: ' + e.message,
    };
  }
}

/**
 * Sinkronisasi status lisensi lokal secara berkala dengan Supabase (Background Check)
 */
export async function syncLicenseWithCloud(): Promise<LocalLicenseInfo | null> {
  const local = getLocalLicense();
  if (!local || local.isTrial) return local;

  try {
    const { data } = await supabase
      .from('licenses')
      .select('*')
      .eq('code', local.code)
      .maybeSingle();

    if (data) {
      const lic = data as LicenseRecord;
      const now = new Date().getTime();
      const exp = lic.expires_at ? new Date(lic.expires_at).getTime() : 0;

      let newStatus: 'active' | 'expired' | 'revoked' = lic.status;
      if (exp <= now) {
        newStatus = 'expired';
      }

      const updated: LocalLicenseInfo = {
        code: lic.code,
        buyerName: lic.buyer_name || undefined,
        expiresAt: lic.expires_at || local.expiresAt,
        isTrial: false,
        status: newStatus,
        activatedAt: lic.activated_at || local.activatedAt,
      };

      localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(updated));
      return updated;
    }
  } catch {
    // Jika offline di jalan, tetap percayai status lokal
  }
  return local;
}

/**
 * Fungsi Pemilik (Admin): Membuat Kode Lisensi Baru di Supabase
 */
export async function createAdminLicense(
  code: string,
  buyerName: string,
  buyerPhone: string,
  durationDays: number = 30
): Promise<{ success: boolean; message: string; code?: string }> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, message: 'Kode lisensi tidak boleh kosong.' };
  }

  try {
    const { error } = await supabase.from('licenses').insert({
      code: cleanCode,
      buyer_name: buyerName.trim() || 'Pembeli',
      buyer_phone: buyerPhone.trim() || '',
      duration_days: durationDays,
      status: 'active',
    });

    if (error) {
      if (error.code === '23505') {
        return { success: false, message: 'Kode ini sudah pernah dibuat sebelumnya. Gunakan kode lain.' };
      }
      return { success: false, message: 'Gagal membuat kode: ' + error.message };
    }

    return {
      success: true,
      message: `Kode ${cleanCode} berhasil dibuat di Supabase (Aktif ${durationDays} hari)!`,
      code: cleanCode,
    };
  } catch (e: any) {
    return { success: false, message: 'Error: ' + e.message };
  }
}
