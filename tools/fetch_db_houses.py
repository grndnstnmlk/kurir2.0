import urllib.request
import json

url = 'https://nnwznokcuwrktizwuiqp.supabase.co/rest/v1/saved_houses?select=*&order=saved_at.desc'
headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud3pub2tjdXdya3Rpend1aXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNzYxMzQsImV4cCI6MjExMDc1MjEzNH0.8sEMOdBgmkWGB-UabDY8M67rTMjFIyIYRyQUlkkImrY',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud3pub2tjdXdya3Rpend1aXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNzYxMzQsImV4cCI6MjExMDc1MjEzNH0.8sEMOdBgmkWGB-UabDY8M67rTMjFIyIYRyQUlkkImrY'
}
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    houses = json.loads(resp.read().decode('utf-8'))
    print(f"Total saved houses in DB: {len(houses)}")
    for i, h in enumerate(houses[:15]):
        has_photo = bool(h.get('photo_url'))
        print(f"{i+1}. [{h.get('id')}] {h.get('recipient_name')} | {str(h.get('full_address'))[:40]} | ({h.get('lat')}, {h.get('lng')}) | Photo: {has_photo}")
