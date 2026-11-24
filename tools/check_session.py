import urllib.request
import json

url = 'https://nnwznokcuwrktizwuiqp.supabase.co/rest/v1/courier_sessions?session_id=eq.6281295713923'
headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud3pub2tjdXdya3Rpend1aXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNzYxMzQsImV4cCI6MjExMDc1MjEzNH0.8sEMOdBgmkWGB-UabDY8M67rTMjFIyIYRyQUlkkImrY',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud3pub2tjdXdya3Rpend1aXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNzYxMzQsImV4cCI6MjExMDc1MjEzNH0.8sEMOdBgmkWGB-UabDY8M67rTMjFIyIYRyQUlkkImrY'
}
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print(f"Records found: {len(data)}")
    if data:
        row = data[0]
        pkgs = row.get('packages', [])
        print(f"Session ID: {row.get('session_id')}, Packages count: {len(pkgs)}")
        print(f"Last device: {row.get('last_device')}, Updated at: {row.get('updated_at')}")
        for i, p in enumerate(pkgs):
            print(f"  {i+1}. [{p.get('status')}] {p.get('recipientName')} - {p.get('fullAddress')[:45]}")
