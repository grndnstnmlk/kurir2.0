export type PackageStatus = 'pending' | 'delivered' | 'rescheduled' | 'failed';

export type RouteStrategy = 'farthest-first' | 'nearest-first' | 'cluster-loop';

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
}

export interface CourierSettings {
  courierName: string;
  dropPointName: string;
  dropPointAddress: string;
  dropPointLat: number;
  dropPointLng: number;
  defaultStrategy: RouteStrategy;
  customWhatsAppTemplate: string;
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
  failedCount: number;
  rescheduledCount: number;
  codCollected: number;
  totalCodTarget: number;
  archivedAt: string;
  notes?: string;
}
