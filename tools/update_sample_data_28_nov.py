import json

with open('screenshot alamat paket/packages_28_nov_verified.json', 'r', encoding='utf-8') as f:
    packages_28 = json.load(f)

with open('screenshot alamat paket/session_27_nov_snapshot.json', 'r', encoding='utf-8') as f:
    packages_27 = json.load(f)

with open('screenshot alamat paket/session_26_nov_snapshot.json', 'r', encoding='utf-8') as f:
    packages_26 = json.load(f)

with open('screenshot alamat paket/packages_25_nov_verified.json', 'r', encoding='utf-8') as f:
    packages_25 = json.load(f)

for p in packages_25:
    p['status'] = 'delivered'
    if not p.get('deliveredAt'):
        p['deliveredAt'] = '2026-11-25T17:30:00.000Z'

# Strip heavy base64 photo blobs from INITIAL_SAMPLE_HISTORY to keep bundle small
def strip_photos(pkgs):
    out = []
    for p in pkgs:
        cp = dict(p)
        if isinstance(cp.get('proofPhotoUrl'), str) and cp['proofPhotoUrl'].startswith('data:'):
            cp.pop('proofPhotoUrl', None)
        out.append(cp)
    return out

packages_27_clean = strip_photos(packages_27)
packages_26_clean = strip_photos(packages_26)

def hist_stats(pkgs):
    delivered = [p for p in pkgs if p.get('status') == 'delivered']
    returned = [p for p in pkgs if p.get('status') == 'returned']
    failed = [p for p in pkgs if p.get('status') == 'failed']
    pending = [p for p in pkgs if p.get('status') in ('pending', 'rescheduled')]
    cod_collected = sum(p.get('codAmount', 0) for p in delivered if p.get('isCod'))
    cod_target = sum(p.get('codAmount', 0) for p in pkgs if p.get('isCod'))
    return delivered, returned, failed, pending, cod_collected, cod_target

del_27, ret_27, fail_27, pend_27, cod_col_27, cod_tgt_27 = hist_stats(packages_27_clean)
del_26, ret_26, fail_26, pend_26, cod_col_26, cod_tgt_26 = hist_stats(packages_26_clean)
cod_25_total = sum(p.get('codAmount', 0) for p in packages_25 if p.get('isCod'))

zones = {}
for p in packages_28:
    z = p.get('areaOrStreet', 'Lainnya')
    zones.setdefault(z, []).append(p)

def j(val):
    return json.dumps(val, ensure_ascii=False)

lines = []
lines.append("import type { CourierSettings, DeliveryPackage, DailyHistoryEntry } from '../types';")
lines.append("")
lines.append("export const ACTIVE_DELIVERY_DATE = '2026-11-28';")
lines.append("export const ACTIVE_DELIVERY_LABEL = 'Sabtu, 28 November 2026';")
lines.append("export const ACTIVE_DELIVERY_SHORT_LABEL = '28 Nov';")
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
 * Data Antaran Aktif Hari Ini: Sabtu, 28 November 2026 (Total 69 Paket - Desa Branta Pesisir & Sekitarnya)
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
    id: 'history-2026-11-27',
    date: '2026-11-27',
    displayDate: 'Jumat, 27 November 2026',
    totalPackages: {len(packages_27_clean)},
    deliveredCount: {len(del_27)},
    returnedCount: {len(ret_27)},
    failedCount: {len(fail_27)},
    rescheduledCount: {len(pend_27)},
    codCollected: {cod_col_27},
    totalCodTarget: {cod_tgt_27},
    archivedAt: '2026-11-27T18:00:00.000Z',
    notes: {j(f"Rute Branta Pesisir & Tlanakan: {len(del_27)} terkirim, {len(ret_27)} retur, {len(pend_27)} pending. Setoran COD kasir: Rp {cod_col_27:,}.".replace(',', '.'))},
    packages: {json.dumps(packages_27_clean, indent=6, ensure_ascii=False)},
  }},
  {{
    id: 'history-2026-11-26',
    date: '2026-11-26',
    displayDate: 'Kamis, 26 November 2026',
    totalPackages: {len(packages_26_clean)},
    deliveredCount: {len(del_26)},
    returnedCount: {len(ret_26)},
    failedCount: {len(fail_26)},
    rescheduledCount: {len(pend_26)},
    codCollected: {cod_col_26},
    totalCodTarget: {cod_tgt_26},
    archivedAt: '2026-11-26T18:00:00.000Z',
    notes: {j(f"Rute Branta Pesisir & Tlanakan: {len(del_26)} terkirim, {len(ret_26)} retur. Setoran COD kasir: Rp {cod_col_26:,}.".replace(',', '.'))},
    packages: {json.dumps(packages_26_clean, indent=6, ensure_ascii=False)},
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
    displayDate: 'Selasa, 24 November 2026',
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
    displayDate: 'Senin, 23 November 2026',
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
    displayDate: 'Minggu, 22 November 2026',
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
    displayDate: 'Sabtu, 21 November 2026',
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

print(f"Updated src/utils/sampleData.ts with {len(packages_28)} packages for 28 Nov + 27 Nov archive successfully!")
