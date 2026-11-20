import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://nnwznokcuwrktizwuiqp.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud3pub2tjdXdya3Rpend1aXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNzYxMzQsImV4cCI6MjExMDc1MjEzNH0.8sEMOdBgmkWGB-UabDY8M67rTMjFIyIYRyQUlkkImrY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface LicenseRecord {
  id: string;
  code: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  duration_days: number;
  device_id: string | null;
  activated_at: string | null;
  expires_at: string | null;
  status: 'active' | 'expired' | 'revoked';
  created_at: string;
}
