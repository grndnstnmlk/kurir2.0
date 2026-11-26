import json

with open('screenshot alamat paket/packages_26_nov_verified.json', 'r', encoding='utf-8') as f:
    packages = json.load(f)

with open('screenshot alamat paket/packages_25_nov_verified.json', 'r', encoding='utf-8') as f:
    packages_25 = json.load(f)

cod_25_total = sum(p.get('codAmount', 0) for p in packages_25)

# Group by zone for clean readability
zones = {}
for p in packages:
    z = p.get('areaOrStreet', 'Lainnya')
    if z not in zones:
        zones[z] = []
    zones[z].append(p)

ts_output = """import type { CourierSettings, DeliveryPackage, DailyHistoryEntry } from '../types';

export const DEFAULT_SETTINGS: CourierSettings = {
  courierName: 'Sprinter J&T Branta Pamekasan',
  dropPointName: 'J&T Express Drop Point Pamekasan (Trunojoyo)',
  dropPointAddress: 'Jl. P. Trunojoyo No. 331, Pamekasan, Madura',
  dropPointLat: -7.1642,
  dropPointLng: 113.4819,
  defaultStrategy: 'cluster-sweep', // Bawa Sekaligus per Area / Dusun agar tidak bolak-balik ke motor
  adminWhatsAppNumber: '6281295713923',
  customWhatsAppTemplate:
    'Halo Kak【{NAMA}】,\\nSaya dari J&T Express, Mau konfirmasi paket {TIPE_PAKET}dengan nomor resi【{RESI}】ke alamat:\\n【{ALAMAT}】\\n\\n{INFO_TOTAL}\\nMohon konfirmasinya ya, apakah benar pesanan ini milik Kakak?\\n\\nTerima kasih',
};

/**
 * Data Antaran Aktif Hari Ini: 26 November 2026 (Total 44 Paket / 34 Titik Antaran - Desa Branta Pesisir & Sekitarnya)
 * Diekstrak otomatis dari video rekaman layar resmi aplikasi Sprinter J&T.
 * Dikelompokkan ke dalam 5 Zona / Koridor berurutan dari Utara ke Selatan menuju Pelabuhan Branta.
 */
export const INITIAL_SAMPLE_PACKAGES: DeliveryPackage[] = [
"""

for zone_name, pkgs in zones.items():
    ts_output += f"  // ==========================================\n"
    ts_output += f"  // {zone_name.upper()} ({len(pkgs)} Paket)\n"
    ts_output += f"  // ==========================================\n"
    for p in pkgs:
        ts_output += "  {\n"
        ts_output += f"    id: '{p['id']}',\n"
        ts_output += f"    trackingNumber: '{p['trackingNumber']}',\n"
        ts_output += f"    recipientName: '{p['recipientName']}',\n"
        ts_output += f"    recipientPhone: '{p['recipientPhone']}',\n"
        ts_output += f"    fullAddress: '{p['fullAddress']}',\n"
        ts_output += f"    areaOrStreet: '{p['areaOrStreet']}',\n"
        if 'benchmark' in p and p['benchmark']:
            bench_escaped = p['benchmark'].replace("'", "\\'")
            ts_output += f"    benchmark: '{bench_escaped}',\n"
        ts_output += f"    isCod: {str(p['isCod']).lower()},\n"
        ts_output += f"    codAmount: {p['codAmount']},\n"
        ts_output += f"    status: '{p['status']}',\n"
        ts_output += f"    lat: {p['lat']},\n"
        ts_output += f"    lng: {p['lng']},\n"
        ts_output += f"    orderIndex: {p['orderIndex']},\n"
        ts_output += f"    createdAt: '{p['createdAt']}',\n"
        ts_output += "  },\n"

ts_output += f"""];

export const INITIAL_SAMPLE_HISTORY: DailyHistoryEntry[] = [
  {{
    id: 'history-sample-2026-11-25',
    date: '2026-11-25',
    displayDate: 'Rabu, 25 November 2026',
    totalPackages: {len(packages_25)},
    deliveredCount: {len(packages_25)},
    failedCount: 0,
    rescheduledCount: 0,
    codCollected: {cod_25_total},
    totalCodTarget: {cod_25_total},
    archivedAt: '2026-11-25T17:45:00.000Z',
    notes: 'Rute Branta Pesisir & Tlanakan selesai lancar. Setoran COD pas.',
    packages: [],
  }},
  {{
    id: 'history-sample-2026-11-24',
    date: '2026-11-24',
    displayDate: 'Senin, 24 November 2026',
    totalPackages: 31,
    deliveredCount: 31,
    failedCount: 0,
    rescheduledCount: 0,
    codCollected: 2353099,
    totalCodTarget: 2353099,
    archivedAt: '2026-11-24T17:45:00.000Z',
    notes: 'Rute Branta Pesisir & Tlanakan selesai lancar. Setoran COD pas.',
    packages: [],
  }},
  {{
    id: 'history-sample-2026-11-23',
    date: '2026-11-23',
    displayDate: 'Minggu, 23 November 2026',
    totalPackages: 37,
    deliveredCount: 37,
    failedCount: 0,
    rescheduledCount: 0,
    codCollected: 1834000,
    totalCodTarget: 1834000,
    archivedAt: '2026-11-23T17:45:00.000Z',
    notes: 'Rute Branta Pesisir & Tlanakan selesai lancar. Setoran COD pas.',
    packages: [],
  }},
  {{
    id: 'history-sample-2026-11-22',
    date: '2026-11-22',
    displayDate: 'Sabtu, 22 November 2026',
    totalPackages: 36,
    deliveredCount: 36,
    failedCount: 0,
    rescheduledCount: 0,
    codCollected: 1845000,
    totalCodTarget: 1845000,
    archivedAt: '2026-11-22T17:45:00.000Z',
    notes: 'Rute Branta Pesisir & Tlanakan selesai lancar sebelum maghrib. Setoran COD pas.',
    packages: [],
  }},
  {{
    id: 'history-sample-yesterday',
    date: '2026-11-21',
    displayDate: 'Jumat, 21 November 2026',
    totalPackages: 8,
    deliveredCount: 8,
    failedCount: 0,
    rescheduledCount: 0,
    codCollected: 485000,
    totalCodTarget: 485000,
    archivedAt: '2026-11-21T17:45:00.000Z',
    notes: 'Rute Branta Pesisir & Tlanakan selesai lancar. Setoran COD pas.',
    packages: [],
  }},
];
"""

with open('src/utils/sampleData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_output)

print(f"Updated src/utils/sampleData.ts with {len(packages)} packages for 26 Nov successfully!")
