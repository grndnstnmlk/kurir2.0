with open('src/components/IPhoneCardDeckView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    l = line.lower()
    if 'camera' in l or 'file' in l or 'photo' in l or 'capture' in l or 'kunci' in l or 'selesai' in l:
        print(f"{i+1}: {line.strip()[:100]}")
