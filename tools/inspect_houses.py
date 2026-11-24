import json

with open('screenshot alamat paket/saved_houses_dump.json', encoding='utf-8') as f:
    houses = json.load(f)

print(f"Total saved houses in DB: {len(houses)}")
for i, h in enumerate(houses):
    name = h.get('recipient_name')
    addr = h.get('full_address')
    lat = h.get('lat')
    lng = h.get('lng')
    notes = h.get('notes')
    bench = h.get('benchmark')
    print(f"[{i+1}] {name} -> ({lat}, {lng}) | {bench} | {notes} | {addr}")
