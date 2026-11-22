export type PackageStatus = 'pending' | 'delivered' | 'rescheduled' | 'failed' | 'returned';

export type RouteStrategy =
  | 'optimal-tsp'
  | 'cluster-sweep'
  | 'farthest-first'
  | 'nearest-first';

export interface DeliveryPackage {
  id: string;
  trackingNumber: string; // No Resi (misal JX... / JP...)
  recipientName: string;
  recipientPhone: string;
  fullAddress: string;
  areaOrStreet: string; // Nama jalan / gang / perumahan utama
  benchmark?: string; // Patokan (misal "depan musholla")
  isCod: boolean;
  codAmount: number; // Dalam Rupiah
  status: PackageStatus;
  statusNotes?: string;
  proofPhotoUrl?: string;
  lat: number;
  lng: number;
  orderIndex: number; // Urutan stop pengantaran (1, 2, 3...)
  createdAt: string;
  deliveredAt?: string;
  returnedAt?: string;
  returnReason?: string; // Misal: "Permintaan Pembeli (Retur Saja)" | "Ditolak / Batal Pesan" | "Tidak Merespon (3x Percobaan)"
  deliveryAttempts?: number; // 1, 2, 3 (percobaan antaran)
}

export interface CourierSettings {
  courierName: string;
  dropPointName: string;
  dropPointAddress: string;
  dropPointLat: number;
  dropPointLng: number;
  defaultStrategy: RouteStrategy;
  customWhatsAppTemplate: string;
  adminWhatsAppNumber?: string; // Nomor WhatsApp pemilik untuk penjualan lisensi Rp 100rb
}

export interface ParsedResiData {
  trackingNumber?: string;
  recipientName?: string;
  recipientPhone?: string;
  fullAddress?: string;
  areaOrStreet?: string;
  benchmark?: string;
  isCod: boolean;
  codAmount: number;
}

export interface DailyHistoryEntry {
  id: string; // e.g. "history-2026-11-20"
  date: string; // "2026-11-20"
  displayDate: string; // "Kamis, 20 November 2026"
  packages: DeliveryPackage[];
  totalPackages: number;
  deliveredCount: number;
  returnedCount?: number;
  failedCount: number;
  rescheduledCount: number;
  codCollected: number;
  totalCodTarget: number;
  archivedAt: string;
  notes?: string;
}

export interface SavedHousePoint {
  id: string;
  recipientName: string;
  recipientPhone: string;
  fullAddress: string;
  areaOrStreet: string;
  benchmark: string; // Ciri khas rumah / patokan
  photoUrl?: string; // Foto tampak depan rumah (Base64 JPEG ringan)
  lat: number;
  lng: number;
  accuracyMeters?: number;
  notes?: string; // Catatan khusus kurir (misal: "Orangnya melaut pagi, titip Bu RT")
  savedAt: string;
  updatedAt?: string;
  deliveryCount?: number;
}
