import json
import re

# Load saved houses
with open('screenshot alamat paket/saved_houses_dump.json', 'r', encoding='utf-8') as f:
    saved_houses = json.load(f)

# Load sample packages
with open('src/utils/sampleData.ts', 'r', encoding='utf-8') as f:
    sample_text = f.read()

# Today's 29 cards from screenshot
today_cards = [
    {
        "card_no": 1,
        "name": "Penerima Samping Musholla Langger Jeteh",
        "phone": "081234567890",
        "raw_address": "Pamekasan, Jawa Timur, Indonesia Samping Musholla Langger Jeteh TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 2,
        "name": "haulatul laili",
        "phone": "08******0391",
        "raw_address": "dermaga Branta pasisir hj muhalli dermaga branta pasisir TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 3,
        "name": "Najwan damar",
        "phone": "08******1797",
        "raw_address": "Branta Pesisir, Jalan Raya Branta masjid alfalah Branta pesisir TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 4,
        "name": "nur sugik",
        "phone": "08******2591",
        "raw_address": "Pulau Madura jln pelabuhan BRANTA pasisir,dsn lunas,Bowo cell mentok belok kanan dikit TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 5,
        "name": "Nanik Khosyiah",
        "phone": "08******8363",
        "raw_address": "Balai Desa Branta Pesisir, Jalan Nelayan toko 24 jam sebelah bengkel TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 6,
        "name": "ria firda",
        "phone": "08******9648",
        "raw_address": "Branta Pesisir, Dusun Bandaran Rt11, Rw6, Branta Pesisir masjid al amin ke timur mentok TLANAKAN",
        "packages_count": 2,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 7,
        "name": "Diassssss bujang branta",
        "phone": "08******9293",
        "raw_address": "Branta Pesisir, Dusun Bandaran Rt11, Rw6, Branta Pesisir gank rumah hj jumalli TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 8,
        "name": "Holif holif",
        "phone": "08******7823",
        "raw_address": "Warung Pojok Rujak Kelang Bak Bibah, Jalan Pelabuhan NO.15 pelabuhan TPI Branta psisir TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 9,
        "name": "feraaa",
        "phone": "08******0342",
        "raw_address": "branta pesisir, kecamatan telanakan, kabupaten pamekasan, dusun lunas dibelakang balai desa TLANAKAN",
        "packages_count": 2,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 10,
        "name": "saumaidah",
        "phone": "08******9469",
        "raw_address": "dusun lunas,masuk ke gang besar TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 11,
        "name": "Diana Laili",
        "phone": "08******3920",
        "raw_address": "Dermaga branta pesisir desa branta pesisir,kecamatan tlanakan kabupaten pamekasan TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 12,
        "name": "Fitriya",
        "phone": "08******2750",
        "raw_address": "balai desa Branta pasisir ke kiri gang lunas pertigaan gang kecil rumah ngadep utara TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 13,
        "name": "Gisel Rania",
        "phone": "08******3221",
        "raw_address": "Bandaran, Branta Pesisir, Kec. Tlanakan, Kabupaten Pamekasan, Jawa Timur ,Indonesia d depan toko besi hj sinol,rujak kelang ratna TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 14,
        "name": "agnes mei amanda",
        "phone": "08******4090",
        "raw_address": "Pamekasan, branta pesisir,dusun lunas, depan konter Bowo Cell branta, depan konter Bowo Cell,cat hijau,lantai putih TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 15,
        "name": "Agustin nur ziyadatur rahmah",
        "phone": "08******6531",
        "raw_address": "Branta pesisir balai desa branta pesisir TLANAKAN",
        "packages_count": 2,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 16,
        "name": "ledi fatika",
        "phone": "08******3944",
        "raw_address": "Branta pasisir (jalan pelabuhan dusun lunas gang anggrek belakang balai desa ) TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 17,
        "name": "Anis Ruslan",
        "phone": "08******0075",
        "raw_address": "jalan raya branta pesisir rw1 rt1 perempatan ke timur pom mini TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 18,
        "name": "tije",
        "phone": "08******8219",
        "raw_address": "Dermaga branta pesisir Deket rumah h.muhalli, gang ke Utara depan rumah Tus TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 19,
        "name": "Nanda Salsabila",
        "phone": "08******8031",
        "raw_address": "Jl. Pelabuhan Branta pesisir Gg. Angrek Dusun Lunas RT RW 001 001, ke timur Balai TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 20,
        "name": "ghazali",
        "phone": "08******1755",
        "raw_address": "rujak lek bibeh,dusun lunas, RT1/RW1,Branta pasisir TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 21,
        "name": "cintami",
        "phone": "08******1173",
        "raw_address": "dusun lunas rt 02 rw 01 Branta pesisir Tlanakan Pamekasan TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 22,
        "name": "Neni triana fitri",
        "phone": "08******5979",
        "raw_address": "jln.pelabuhan dsn.bandaran ( bengkel las rusak) TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 23,
        "name": "semsem sono",
        "phone": "08******7494",
        "raw_address": "jalan pelabuhan branta, dusun lunas branta pasisir gang anggrek belakang rujak kelang bak kur jalan pelabuhan branta pasisir TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 24,
        "name": "yuyud",
        "phone": "08******8940",
        "raw_address": "Masjid Al-Furqon Branta Pesisir, QFJ2+72X, Bandaran, Branta Pesisir gg pertama ke barat TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 25,
        "name": "Tata oktavia",
        "phone": "08******2010",
        "raw_address": "Hj.muhali gang ke utara,belok kiri,rumah oren menghadap ke utara TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 26,
        "name": "Desi zafran",
        "phone": "08******6266",
        "raw_address": "gag ke timur Balai Desa branta pesisir Dusun Lunas Depan rumah Bu.titik Bidan TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 27,
        "name": "orang madhura",
        "phone": "08******5614",
        "raw_address": "jln branta pesisir dusun gilin,gang pertama dari pertelon TLANAKAN",
        "packages_count": 2,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 28,
        "name": "Erna Megawati",
        "phone": "08******4475",
        "raw_address": "Desa Branta Pesisir, dusun gilin gag pertama pagar putih TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    },
    {
        "card_no": 29,
        "name": "sumiyatik",
        "phone": "08******6802",
        "raw_address": "sebelah barat pintu gerbang dermaga branta pasisir terus kebarat ada toko besar warna hijau TLANAKAN",
        "packages_count": 1,
        "is_cod": True,
        "platform": "tiktok"
    }
]

print(f"Total cards listed: {len(today_cards)}")

# Check matches with saved_houses
for card in today_cards:
    c_name = card['name'].lower()
    c_addr = card['raw_address'].lower()
    matched = []
    for h in saved_houses:
        h_name = (h.get('recipient_name') or '').lower()
        h_addr = (h.get('full_address') or '').lower()
        # Direct name match
        if c_name in h_name or h_name in c_name:
            matched.append(('NAME_MATCH', h))
        # Keyword address match
        elif any(k in h_addr and k in c_addr for k in ['muhalli', 'bowo cell', 'balai desa', 'al-amin', 'al-furqon', 'rujak kelang', 'dusun gilin', 'dermaga', 'pintu gerbang', 'pom mini']):
            matched.append(('ADDR_MATCH', h))
    print(f"\nCard {card['card_no']}: {card['name']} ({card['phone']})")
    print(f"  Address: {card['raw_address'][:60]}...")
    if matched:
        for m_type, h in matched[:2]:
            print(f"  -> Matched ({m_type}): {h.get('recipient_name')} | LatLng: ({h.get('lat')}, {h.get('lng')}) | Benchmark: {h.get('benchmark')} | Notes: {h.get('notes')}")
    else:
        print("  -> No direct saved house match")
