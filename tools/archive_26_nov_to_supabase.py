import urllib.request
import json

with open('screenshot alamat paket/session_26_nov_snapshot.json', 'r', encoding='utf-8') as f:
    packages = json.load(f)

delivered = [p for p in packages if p.get('status') == 'delivered']
returned = [p for p in packages if p.get('status') == 'returned']
failed = [p for p in packages if p.get('status') == 'failed']
pending = [p for p in packages if p.get('status') in ('pending', 'rescheduled')]

cod_collected = sum(p.get('codAmount', 0) for p in delivered if p.get('isCod'))
total_cod_target = sum(p.get('codAmount', 0) for p in packages if p.get('isCod'))

# Strip heavy base64 photo blobs if any from history payload if huge, or check size
entry = {
    "id": "history-2026-11-26",
    "session_id": "6281295713923",
    "date": "2026-11-26",
    "display_date": "Kamis, 26 November 2026",
    "packages": packages,
    "total_packages": len(packages),
    "delivered_count": len(delivered),
    "failed_count": len(failed),
    "rescheduled_count": len(pending),
    "cod_collected": cod_collected,
    "total_cod_target": total_cod_target,
    "archived_at": "2026-11-26T18:00:00.000Z",
    "notes": f"Rute Branta Pesisir & Tlanakan: {len(delivered)} terkirim, {len(returned)} retur. Setoran COD kasir: Rp {cod_collected:,}.".replace(',', '.')
}

data_bytes = json.dumps(entry).encode('utf-8')
print(f"Prepared 26 Nov archive: {len(packages)} pkgs, delivered={len(delivered)}, returned={len(returned)}, cod={cod_collected}, payload={len(data_bytes)/1024:.1f} KB")

url = 'https://nnwznokcuwrktizwuiqp.supabase.co/rest/v1/delivery_history'
headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud3pub2tjdXdya3Rpend1aXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNzYxMzQsImV4cCI6MjExMDc1MjEzNH0.8sEMOdBgmkWGB-UabDY8M67rTMjFIyIYRyQUlkkImrY',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud3pub2tjdXdya3Rpend1aXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNzYxMzQsImV4cCI6MjExMDc1MjEzNH0.8sEMOdBgmkWGB-UabDY8M67rTMjFIyIYRyQUlkkImrY',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
}

req = urllib.request.Request(url, data=data_bytes, headers=headers, method='POST')
with urllib.request.urlopen(req, timeout=30) as resp:
    print(f"Status Code: {resp.status}")
    print("Successfully archived 26 Nov 2026 snapshot to Supabase delivery_history!")
