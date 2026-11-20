import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  Copy,
  Check,
  RefreshCw,
  X,
  Key,
  Users,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { supabase, type LicenseRecord } from '../utils/supabaseClient';
import { createAdminLicense } from '../utils/licenseManager';

interface AdminLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLicenseModal: React.FC<AdminLicenseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [code, setCode] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [existingLicenses, setExistingLicenses] = useState<LicenseRecord[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Generate random readable license code
  const handleGenerateRandomCode = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = 'JNT-PMK';
    setCode(`${prefix}-${randomSuffix}`);
  };

  const fetchLicenses = async () => {
    setIsLoadingList(true);
    try {
      const { data } = await supabase
        .from('licenses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) {
        setExistingLicenses(data as LicenseRecord[]);
      }
    } catch (e) {
      console.error('Failed to fetch licenses:', e);
    }
    setIsLoadingList(false);
  };

  useEffect(() => {
    if (isOpen) {
      handleGenerateRandomCode();
      fetchLicenses();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    const res = await createAdminLicense(code, buyerName, buyerPhone, durationDays);
    setLoading(false);

    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setBuyerName('');
      setBuyerPhone('');
      handleGenerateRandomCode();
      fetchLicenses();
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleCopyShareMessage = (lic: LicenseRecord) => {
    const text = `🎉 *KODE AKSES RESMI KURIR 2.0*
👤 Penerima: ${lic.buyer_name || 'Teman Kurir'}
🔑 Kode Akses: *${lic.code}*
⏳ Masa Aktif: ${lic.duration_days} Hari (Rp 100.000)

*CARA AKTIVASI:*
1. Buka aplikasi di HP: https://grndnstnmlk.github.io/kurir2.0/
2. Masukkan kode: *${lic.code}*
3. Klik tombol *Aktifkan*.

Aplikasi akan otomatis menyusun rute tanpa bolak-balik & scan resi via kamera. Selamat bekerja & salam satu aspal! 🛵📦`;

    navigator.clipboard.writeText(text);
    setCopiedCode(lic.code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto font-aspekta">
      <div className="bg-[#fafafa] rounded-[32px] w-full max-w-xl shadow-2xl border border-[#e4e4e7] overflow-hidden my-auto max-h-[92vh] flex flex-col text-[#222222]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#fafafa] border-b border-[#e4e4e7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-amber-400 flex items-center justify-center shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#080808] tracking-tight">
                Panel Admin — Pembuat Kode Akses
              </h2>
              <p className="text-xs text-[#696969]">Buat kode langganan 30 hari untuk pembeli (Rp 100rb)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#f4f4f5] text-[#696969] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-medium border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {feedback.text}
            </div>
          )}

          {/* Form Buat Kode */}
          <form onSubmit={handleCreate} className="bg-white p-5 rounded-[24px] border border-[#e4e4e7] shadow-sm space-y-3.5">
            <h3 className="font-bold text-sm text-[#080808] flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              Buat Kode Baru untuk Pembeli
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#696969] font-medium mb-1">Nama Pembeli / Kurir:</label>
                <input
                  type="text"
                  placeholder="Misal: Mas Rizal (J&T)"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-3.5 py-2 text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[#696969] font-medium mb-1">No. WhatsApp Pembeli:</label>
                <input
                  type="text"
                  placeholder="081234567890"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-3.5 py-2 text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#696969] font-medium">Kode Akses:</label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomCode}
                    className="text-amber-600 hover:text-amber-700 font-bold text-[11px] cursor-pointer"
                  >
                    Acak Kode 🎲
                  </button>
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-3.5 py-2 font-mono font-bold text-xs text-[#080808] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#696969] font-medium mb-1">Durasi Langganan:</label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-3.5 py-2 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value={30}>30 Hari (Rp 100.000)</option>
                  <option value={60}>60 Hari (Rp 200.000)</option>
                  <option value={90}>90 Hari (Rp 300.000)</option>
                  <option value={365}>1 Tahun (Rp 1.000.000)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full bg-[#080808] hover:bg-neutral-800 disabled:opacity-40 text-white font-bold py-3 rounded-full transition cursor-pointer active:scale-95 shadow-sm text-xs mt-2 flex items-center justify-center gap-1.5"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5 text-amber-400" />}
              <span>Simpan Kode ke Database Supabase</span>
            </button>
          </form>

          {/* List Kode Terdaftar di Supabase */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#080808] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#696969]" />
                Daftar Kode di Supabase ({existingLicenses.length})
              </h3>
              <button
                type="button"
                onClick={fetchLicenses}
                className="text-[#696969] hover:text-[#080808] font-medium text-xs flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingList ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {existingLicenses.map((lic) => {
                const isCopied = copiedCode === lic.code;
                return (
                  <div
                    key={lic.id}
                    className="bg-white p-3.5 rounded-2xl border border-[#e4e4e7] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#080808] bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                          {lic.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            lic.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {lic.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#696969] mt-1">
                        Penerima: <b>{lic.buyer_name || '-'}</b> ({lic.buyer_phone || '-'}) • Durasi: {lic.duration_days} hari
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyShareMessage(lic)}
                      title="Salin pesan WA serah terima kode"
                      className="bg-[#f4f4f5] hover:bg-[#e4e4e7] text-[#080808] px-3 py-1.5 rounded-full font-bold text-[11px] border border-[#e4e4e7] flex items-center gap-1 transition cursor-pointer active:scale-95 shrink-0"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Tersalin' : 'Kirim WA'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
