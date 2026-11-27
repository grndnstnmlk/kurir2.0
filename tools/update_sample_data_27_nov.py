import json

with open('screenshot alamat paket/packages_27_nov_verified.json', 'r', encoding='utf-8') as f:
    packages_27 = json.load(f)

with open('screenshot alamat paket/session_26_nov_snapshot.json', 'r', encoding='utf-8') as f:
    packages_26 = json.load(f)

with open('screenshot alamat paket/packages_25_nov_verified.json', 'r', encoding='utf-8') as f:
    packages_25 = json.load(f)

for p in packages_25:
    p['status'] = 'delivered'
    if not p.get('deliveredAt'):
        p['deliveredAt'] = '2026-11-25T17:30:00.000Z'

cod_25_total = sum(p.get('codAmount', 0) for p in packages_25 if p.get('isCod'))

delivered_26 = [p for p in packages_26 if p.get('status') == 'delivered']
returned_26 = [p for p in packages_26 if p.get('status') == 'returned']
failed_26 = [p for p in packages_26 if p.get('status') == 'failed']
pending_26 = [p for p in packages_26 if p.get('status') in ('pending', 'rescheduled')]
cod_26_collected = sum(p.get('codAmount', 0) for p in delivered_26 if p.get('isCod'))
cod_26_target = sum(p.get('codAmount', 0) for p in packages_26 if p.get('isCod'))

zones = {}
for p in packages_27:
    z = p.get('areaOrStreet', 'Lainnya')
    if z not in zones:
        zones[z] = []
    zones[z].append(p)

def j(val):
    return json.dumps(val, ensure_ascii=False)

lines = []
lines.append("import type { CourierSettings, DeliveryPackage, DailyHistoryEntry } from '../types';")
lines.append("")
lines.append("export const ACTIVE_DELIVERY_DATE = '2026-11-27';")
lines.append("export const ACTIVE_DELIVERY_LABEL = 'Jumat, 27 November 2026';")
lines.append("export const ACTIVE_DELIVERY_SHORT_LABEL = '27 Nov';")
lines.append("")
lines.append("""export const DEFAULT_SETTINGS: CourierSettings = {
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
 * Data Antaran Aktif Hari Ini: Jumat, 27 November 2026 (Total 46 Paket / 39 Titik Antaran - Desa Branta Pesisir & Sekitarnya)
 * Diekstrak otomatis dari video rekaman layar resmi aplikasi Sprinter J&T.
 * Dikelompokkan ke dalam 6 Koridor Jalan secara searah tanpa bolak-balik.
 */
export const INITIAL_SAMPLE_PACKAGES: DeliveryPackage[] = [""")

for zone_name, pkgs in zones.items():
    lines.append("  // ==========================================")
    lines.append(f"  // {zone_name.upper()} ({len(pkgs)} Paket)")
    lines.append("  // ==========================================")
    for p in pkgs:
        lines.append("  {")
        lines.append(f"    id: {j(p['id'])},")
        lines.append(f"    trackingNumber: {j(p['trackingNumber'])},")
        lines.append(f"    recipientName: {j(p['recipientName'])},")
        lines.append(f"    recipientPhone: {j(p['recipientPhone'])},")
        lines.append(f"    fullAddress: {j(p['fullAddress'])},")
        lines.append(f"    areaOrStreet: {j(p['areaOrStreet'])},")
        if p.get('benchmark'):
            lines.append(f"    benchmark: {j(p['benchmark'])},")
        lines.append(f"    isCod: {str(p['isCod']).lower()},")
        lines.append(f"    codAmount: {p['codAmount']},")
        lines.append(f"    status: {j(p['status'])},")
        lines.append(f"    lat: {p['lat']},")
        lines.append(f"    lng: {p['lng']},")
        lines.append(f"    orderIndex: {p['orderIndex']},")
        lines.append(f"    createdAt: {j(p['createdAt'])},")
        lines.append("  },")

lines.append("];")
lines.append("")
lines.append(f"""export const INITIAL_SAMPLE_HISTORY: DailyHistoryEntry[] = [
  {{
    id: 'history-2026-11-26',
    date: '2026-11-26',
    displayDate: 'Kamis, 26 November 2026',
    totalPackages: {len(packages_26)},
    deliveredCount: {len(delivered_26)},
    returnedCount: {len(returned_26)},
    failedCount: {len(failed_26)},
    rescheduledCount: {len(pending_26)},
    codCollected: {cod_26_collected},
    totalCodTarget: {cod_26_target},
    archivedAt: '2026-11-26T18:00:00.000Z',
    notes: {j(f"Rute Branta Pesisir & Tlanakan: {len(delivered_26)} terkirim, {len(returned_26)} retur. Setoran COD kasir: Rp {cod_26_collected:,}.".replace(',', '.'))},
    packages: {json.dumps(packages_26, indent=6, ensure_ascii=False)},
  }},
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
    archivedAt: '2026-11-25T18:00:00.000Z',
    notes: 'Rute Branta Pesisir & Tlanakan selesai lancar (53 paket). Setoran COD pas.',
    packages: {json.dumps(packages_25, indent=6, ensure_ascii=False)},
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
""")

with open('src/utils/sampleData.ts', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f"Updated src/utils/sampleData.ts with {len(packages_27)} packages for 27 Nov + 26 Nov archive successfully!")
