import urllib.request
import json
import datetime

with open('screenshot alamat paket/packages_25_nov_verified.json', 'r', encoding='utf-8') as f:
    packages = json.load(f)

# Mark all 53 packages as delivered
for p in packages:
    p['status'] = 'delivered'
    if not p.get('deliveredAt'):
        p['deliveredAt'] = '2026-11-25T17:30:00.000Z'

total_cod = sum(p.get('codAmount', 0) for p in packages if p.get('isCod'))

entry = {
    "id": "history-2026-11-25",
    "session_id": "6281295713923",
    "date": "2026-11-25",
    "display_date": "Rabu, 25 November 2026",
    "packages": packages,
    "total_packages": len(packages),
    "delivered_count": len(packages),
    "failed_count": 0,
    "rescheduled_count": 0,
    "cod_collected": total_cod,
    "total_cod_target": total_cod,
    "archived_at": "2026-11-25T18:00:00.000Z",
    "notes": "Rute Branta Pesisir & Tlanakan selesai lancar (53 paket). Setoran COD pas."
}

url = 'https://nnwznokcuwrktizwuiqp.supabase.co/rest/v1/delivery_history'
headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud3pub2tjdXdya3Rpend1aXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNzYxMzQsImV4cCI6MjExMDc1MjEzNH0.8sEMOdBgmkWGB-UabDY8M67rTMjFIyIYRyQUlkkImrY',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud3pub2tjdXdya3Rpend1aXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNzYxMzQsImV4cCI6MjExMDc1MjEzNH0.8sEMOdBgmkWGB-UabDY8M67rTMjFIyIYRyQUlkkImrY',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
}

data_bytes = json.dumps(entry).encode('utf-8')
req = urllib.request.Request(url, data=data_bytes, headers=headers, method='POST')

try:
    with urllib.request.urlopen(req) as resp:
        print(f"Status Code: {resp.status}")
        print("Successfully archived 25 Nov 2026 data to Supabase delivery_history!")
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
