import { supabase } from './supabaseClient';
import type { DeliveryPackage, CourierSettings, DailyHistoryEntry } from '../types';

const STORAGE_KEY_SESSION_ID = 'kurir2_sync_session_id';
export const DEFAULT_SESSION_ID = '6281295713923';

/**
 * Mengambil Session ID aktif dari URL (?session=...) atau LocalStorage
 */
export function getActiveSessionId(): string {
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSession = params.get('session') || params.get('s');
      if (urlSession && urlSession.trim().length > 0) {
        const clean = urlSession.trim();
        localStorage.setItem(STORAGE_KEY_SESSION_ID, clean);
        return clean;
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY_SESSION_ID);
    if (saved && saved.trim().length > 0) {
      return saved.trim();
    }

    // Default ke nomor WhatsApp kurir
    localStorage.setItem(STORAGE_KEY_SESSION_ID, DEFAULT_SESSION_ID);
    return DEFAULT_SESSION_ID;
  } catch {
    return DEFAULT_SESSION_ID;
  }
}

/**
 * Menyimpan Session ID baru dan memperbarui parameter URL secara halus
 */
export function setActiveSessionId(newSessionId: string): string {
  const clean = newSessionId.trim() || DEFAULT_SESSION_ID;
  try {
    localStorage.setItem(STORAGE_KEY_SESSION_ID, clean);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('session', clean);
      window.history.replaceState({}, '', url.toString());
    }
  } catch (e) {
    console.error('Failed to set active session ID:', e);
  }
  return clean;
}

/**
 * Deteksi apakah perangkat saat ini adalah Desktop/PC atau Smartphone
 */
export function getDeviceTypeLabel(): string {
  if (typeof window === 'undefined') return 'Perangkat';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iPhone';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows|Macintosh|Linux/i.test(ua)) return 'PC / Laptop';
  return 'Browser';
}

/**
 * Menyimpan sesi antaran aktif ke Supabase (Sinkronisasi Realtime ke iPhone/PC)
 */
export async function pushSessionToCloud(
  sessionId: string,
  packages: DeliveryPackage[],
  settings?: CourierSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      session_id: sessionId,
      packages: packages as any,
      settings: (settings || {}) as any,
      last_device: getDeviceTypeLabel(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('courier_sessions')
      .upsert(payload, { onConflict: 'session_id' });

    if (error) {
      console.warn('Supabase session push warning:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Session push exception:', err);
    return { success: false, error: err?.message || 'Gagal sinkron cloud' };
  }
}

/**
 * Mengambil data sesi antaran aktif dari Supabase saat aplikasi dibuka
 */
export async function fetchSessionFromCloud(
  sessionId: string
): Promise<{ success: boolean; packages?: DeliveryPackage[]; settings?: CourierSettings; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('courier_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, packages: undefined };
    }

    return {
      success: true,
      packages: Array.isArray(data.packages) ? data.packages : [],
      settings: data.settings || undefined,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal memuat sesi' };
  }
}

/**
 * Berlangganan Realtime Supabase (WebSocket)
 * Saat PC mengetik atau mengedit alamat, iPhone langsung menerima pembaruan secara otomatis!
 */
export function subscribeToSessionRealtime(
  sessionId: string,
  onRemoteChange: (packages: DeliveryPackage[], settings?: CourierSettings, lastDevice?: string) => void
) {
  try {
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courier_sessions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: any) => {
          const newData = payload.new;
          if (newData && Array.isArray(newData.packages)) {
            onRemoteChange(newData.packages, newData.settings, newData.last_device);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Failed to subscribe to realtime channel:', err);
    return () => {};
  }
}

/**
 * Berlangganan Realtime Supabase untuk Buku Titik Rumah (saved_houses)
 * Saat iPhone mengunci titik GPS rumah, PC langsung menerima dan menampilkan titik tersebut secara instan!
 */
export function subscribeToSavedHousesRealtime(
  sessionId: string,
  onRemoteChange: () => void
) {
  try {
    const channel = supabase
      .channel(`houses-realtime-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'saved_houses',
        },
        () => {
          onRemoteChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Failed to subscribe to saved_houses realtime channel:', err);
    return () => {};
  }
}

/**
 * Menyimpan rekap riwayat harian ke Supabase (Unified History)
 */
export async function pushHistoryEntryToCloud(
  sessionId: string,
  entry: DailyHistoryEntry
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      id: entry.id,
      session_id: sessionId,
      date: entry.date,
      display_date: entry.displayDate,
      packages: entry.packages as any,
      total_packages: entry.totalPackages,
      delivered_count: entry.deliveredCount,
      failed_count: entry.failedCount,
      rescheduled_count: entry.rescheduledCount,
      cod_collected: entry.codCollected,
      total_cod_target: entry.totalCodTarget,
      archived_at: entry.archivedAt,
      notes: entry.notes || null,
    };

    const { error } = await supabase
      .from('delivery_history')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('History push warning:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Mengambil seluruh riwayat harian untuk sesi ini dari Supabase
 */
export async function fetchHistoryFromCloud(
  sessionId: string
): Promise<{ success: boolean; history?: DailyHistoryEntry[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('delivery_history')
      .select('*')
      .eq('session_id', sessionId)
      .order('archived_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: true, history: [] };
    }

    const mapped: DailyHistoryEntry[] = data.map((r: any) => ({
      id: r.id,
      date: r.date,
      displayDate: r.display_date,
      packages: Array.isArray(r.packages) ? r.packages : [],
      totalPackages: r.total_packages || 0,
      deliveredCount: r.delivered_count || 0,
      failedCount: r.failed_count || 0,
      rescheduledCount: r.rescheduled_count || 0,
      codCollected: Number(r.cod_collected) || 0,
      totalCodTarget: Number(r.total_cod_target) || 0,
      archivedAt: r.archived_at,
      notes: r.notes || undefined,
    }));

    return { success: true, history: mapped };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Menghapus riwayat di Supabase
 */
export async function deleteHistoryFromCloud(id: string): Promise<void> {
  try {
    await supabase.from('delivery_history').delete().eq('id', id);
  } catch (err) {
    console.warn('Failed to delete history on cloud:', err);
  }
}
