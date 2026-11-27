import urllib.request
import json
import os

SUPABASE_URL = 'https://nnwznokcuwrktizwuiqp.supabase.co/rest/v1'
API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud3pub2tjdXdya3Rpend1aXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNzYxMzQsImV4cCI6MjExMDc1MjEzNH0.8sEMOdBgmkWGB-UabDY8M67rTMjFIyIYRyQUlkkImrY'
HEADERS = {
    'apikey': API_KEY,
    'Authorization': f'Bearer {API_KEY}',
}

def fetch_json(endpoint):
    req = urllib.request.Request(f'{SUPABASE_URL}/{endpoint}', headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode('utf-8'))

session_data = fetch_json('courier_sessions?session_id=eq.6281295713923&select=packages,updated_at,last_device')
if session_data:
    s = session_data[0]
    pkgs = s.get('packages', [])
    statuses = {}
    for p in pkgs:
        st = p.get('status', 'unknown')
        statuses[st] = statuses.get(st, 0) + 1
    print(f"Active session updated: {s.get('updated_at')} | Device: {s.get('last_device')} | Total: {len(pkgs)} | Statuses: {statuses}")
    out_26 = os.path.join('screenshot alamat paket', 'session_26_nov_snapshot.json')
    with open(out_26, 'w', encoding='utf-8') as f:
        json.dump(pkgs, f, indent=2, ensure_ascii=False)
    print(f"Saved active session snapshot to {out_26}")

hist_data = fetch_json('delivery_history?session_id=eq.6281295713923&select=id,date,display_date,total_packages,delivered_count,cod_collected')
print("Delivery history entries:", len(hist_data))
for h in hist_data:
    print(" ", h)

houses_data = fetch_json('saved_houses?session_id=eq.6281295713923&select=id,session_id,recipient_name,recipient_phone,full_address,area_or_street,benchmark,lat,lng,accuracy_meters,notes,saved_at,updated_at,delivery_count')
print("Saved houses count:", len(houses_data))
with open(os.path.join('screenshot alamat paket', 'saved_houses_meta.json'), 'w', encoding='utf-8') as f:
    json.dump(houses_data, f, indent=2, ensure_ascii=False)
