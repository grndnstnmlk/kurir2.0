-- ==============================================================
-- SQL Schema: Sinkronisasi Sesi Realtime PC & iPhone Kurir 2.0
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================

-- 1. Tabel Sesi Aktif Kurir (Paket hari ini yang disinkronkan realtime antara PC & iPhone)
CREATE TABLE IF NOT EXISTS public.courier_sessions (
  session_id TEXT PRIMARY KEY,
  packages JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  last_device TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Rekap Riwayat Pengantaran (Disatukan antara PC & iPhone)
CREATE TABLE IF NOT EXISTS public.delivery_history (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  date TEXT NOT NULL,
  display_date TEXT NOT NULL,
  packages JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_packages INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  rescheduled_count INTEGER DEFAULT 0,
  cod_collected BIGINT DEFAULT 0,
  total_cod_target BIGINT DEFAULT 0,
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- 3. Tabel Buku Titik Rumah Pelanggan
CREATE TABLE IF NOT EXISTS public.saved_houses (
  id TEXT PRIMARY KEY,
  session_id TEXT DEFAULT '6281295713923',
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT,
  full_address TEXT NOT NULL,
  area_or_street TEXT,
  benchmark TEXT,
  photo_url TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy_meters DOUBLE PRECISION,
  notes TEXT,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_count INTEGER DEFAULT 1
);

-- 4. Buka Hak Akses (Row Level Security) agar PC & iPhone bisa membaca & menyimpan data
ALTER TABLE public.courier_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_houses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all on courier_sessions" ON public.courier_sessions;
CREATE POLICY "Allow anon all on courier_sessions" ON public.courier_sessions
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on delivery_history" ON public.delivery_history;
CREATE POLICY "Allow anon all on delivery_history" ON public.delivery_history
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on saved_houses" ON public.saved_houses;
CREATE POLICY "Allow anon all on saved_houses" ON public.saved_houses
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 5. Aktifkan Realtime Replication agar saat Anda mengetik di PC, iPhone langsung update otomatis
ALTER PUBLICATION supabase_realtime ADD TABLE courier_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_history;
ALTER PUBLICATION supabase_realtime ADD TABLE saved_houses;
