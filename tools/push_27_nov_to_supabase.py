import urllib.request
import json
import datetime

with open('screenshot alamat paket/packages_27_nov_verified.json', 'r', encoding='utf-8') as f:
    packages = json.load(f)

print(f"Loaded {len(packages)} packages to push for 27 Nov 2026.")

url = 'https://nnwznokcuwrktizwuiqp.supabase.co/rest/v1/courier_sessions'
headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud3pub2tjdXdya3Rpend1aXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNzYxMzQsImV4cCI6MjExMDc1MjEzNH0.8sEMOdBgmkWGB-UabDY8M67rTMjFIyIYRyQUlkkImrY',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud3pub2tjdXdya3Rpend1aXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNzYxMzQsImV4cCI6MjExMDc1MjEzNH0.8sEMOdBgmkWGB-UabDY8M67rTMjFIyIYRyQUlkkImrY',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
}

settings = {
    "courierName": "Sprinter J&T Branta Pamekasan",
    "dropPointName": "J&T Express Drop Point Pamekasan (Trunojoyo)",
    "dropPointAddress": "Jl. P. Trunojoyo No. 331, Pamekasan, Madura",
    "dropPointLat": -7.1642,
    "dropPointLng": 113.4819,
    "defaultStrategy": "cluster-sweep",
    "adminWhatsAppNumber": "6281295713923",
    "customWhatsAppTemplate": "Halo Kak【{NAMA}】,\nSaya dari J&T Express, Mau konfirmasi paket {TIPE_PAKET}dengan nomor resi【{RESI}】ke alamat:\n【{ALAMAT}】\n\n{INFO_TOTAL}\nMohon konfirmasinya ya, apakah benar pesanan ini milik Kakak?\n\nTerima kasih"
}

payload = {
    "session_id": "6281295713923",
    "packages": packages,
    "settings": settings,
    "last_device": "Antigravity AI Assistant [27 Nov Video Sync]",
    "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
}

data_bytes = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data_bytes, headers=headers, method='POST')

with urllib.request.urlopen(req, timeout=30) as resp:
    print(f"Status Code: {resp.status}")
    print("Upsert 27 Nov 2026 to Supabase successful!")
