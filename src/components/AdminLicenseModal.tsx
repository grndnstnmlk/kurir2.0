import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Copy,
  Check,
  RefreshCw,
  X,
  Key,
  Users,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Link2,
  LogOut,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { supabase, type LicenseRecord } from '../utils/supabaseClient';
import { createAdminLicense } from '../utils/licenseManager';

interface AdminLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_ADMIN_PASSWORD = 'admin331';

export const AdminLicenseModal: React.FC<AdminLicenseModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('kurir2_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Password Management
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPassInput, setNewPassInput] = useState('');
  const [changePassFeedback, setChangePassFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin Link Copied
  const [linkCopied, setLinkCopied] = useState(false);

  // License Generator State
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [code, setCode] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Supabase License List
  const [existingLicenses, setExistingLicenses] = useState<LicenseRecord[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Generate random readable license code
  const handleGenerateRandomCode = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = 'JNT-PMK';
    setCode(`${prefix}-${randomSuffix}`);
  };

  const getSavedPassword = () => {
    return localStorage.getItem('kurir2_admin_pass') || DEFAULT_ADMIN_PASSWORD;
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);

    const trimmed = passwordInput.trim();
    const currentPass = getSavedPassword();

    // Check custom password or fallback master keys
    if (trimmed === currentPass || trimmed === DEFAULT_ADMIN_PASSWORD || trimmed === 'kurir331') {
      setIsAuthenticated(true);
      sessionStorage.setItem('kurir2_admin_auth', 'true');
      setPasswordInput('');
      setAuthError(null);
    } else {
      setAuthError('Kata sandi admin salah. Silakan coba lagi.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('kurir2_admin_auth');
    setIsAuthenticated(false);
    setPasswordInput('');
    setAuthError(null);
    setIsChangingPass(false);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassFeedback(null);

    const trimmed = newPassInput.trim();
    if (trimmed.length < 4) {
      setChangePassFeedback({ type: 'error', text: 'Password minimal 4 karakter.' });
      return;
    }

    localStorage.setItem('kurir2_admin_pass', trimmed);
    setChangePassFeedback({ type: 'success', text: 'Password admin berhasil diubah!' });
    setNewPassInput('');
    setTimeout(() => {
      setIsChangingPass(false);
      setChangePassFeedback(null);
    }, 2000);
  };

  const handleCopyAdminLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const adminUrl = `${baseUrl}#admin`;
    navigator.clipboard.writeText(adminUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const fetchLicenses = async () => {
    setIsLoadingList(true);
    try {
      const { data } = await supabase
        .from('licenses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
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
      if (isAuthenticated) {
        fetchLicenses();
      }
    }
  }, [isOpen, isAuthenticated]);

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

  const filteredLicenses = existingLicenses.filter((lic) => {
    const query = searchFilter.toLowerCase();
    return (
      lic.code.toLowerCase().includes(query) ||
      (lic.buyer_name && lic.buyer_name.toLowerCase().includes(query)) ||
      (lic.buyer_phone && lic.buyer_phone.includes(query))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md overflow-y-auto font-aspekta">
      <div className="bg-[#fafafa] rounded-[32px] w-full max-w-xl shadow-2xl border border-[#e4e4e7] overflow-hidden my-auto max-h-[92vh] flex flex-col text-[#222222]">

        {/* Header */}
        <div className="px-6 py-5 bg-[#fafafa] border-b border-[#e4e4e7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
              isAuthenticated ? 'bg-neutral-900 text-amber-400' : 'bg-neutral-900 text-red-400'
            }`}>
              {isAuthenticated ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#080808] tracking-tight">
                {isAuthenticated ? 'Panel Admin — Kelola Lisensi' : 'Akses Terbatas: Pemilik'}
              </h2>
              <p className="text-xs text-[#696969]">
                {isAuthenticated
                  ? 'Pembuat kode langganan Rp 100rb & data pelanggan Supabase'
                  : 'Area khusus admin. Memerlukan autentikasi kata sandi.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#f4f4f5] text-[#696969] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LOCKED SCREEN: Form Masukkan Password Admin */}
        {!isAuthenticated ? (
          <div className="p-6 md:p-8 space-y-6 text-xs">
            <div className="text-center space-y-2 py-2">
              <div className="w-16 h-16 rounded-3xl bg-neutral-100 border border-[#e4e4e7] text-neutral-800 flex items-center justify-center mx-auto shadow-inner">
                <KeyRound className="w-8 h-8 text-[#080808]" />
              </div>
              <h3 className="font-bold text-base text-[#080808]">Masukkan Password Admin</h3>
              <p className="text-xs text-[#696969] max-w-sm mx-auto leading-relaxed">
                Panel ini tersembunyi dari menu biasa dan dilindungi password untuk keamanan pembuatan lisensi berbayar.
              </p>
            </div>

            {authError && (
              <div className="p-3.5 rounded-2xl text-xs font-semibold bg-red-50 text-red-800 border border-red-200 text-center animate-shake">
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 max-w-sm mx-auto">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ketik password admin..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                  className="w-full bg-white border border-[#e4e4e7] rounded-full px-5 py-3 pr-11 text-xs text-[#080808] font-medium tracking-wide focus:outline-none focus:border-black shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#696969] hover:text-[#080808] p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-[#080808] hover:bg-neutral-800 active:scale-95 text-white font-bold py-3.5 rounded-full transition shadow-md cursor-pointer flex items-center justify-center gap-2 text-xs"
              >
                <Unlock className="w-4 h-4" />
                <span>Buka Panel Admin</span>
              </button>
            </form>

            <div className="pt-4 border-t border-[#e4e4e7] text-center space-y-2">
              <p className="text-[11px] text-[#696969]">
                💡 <b>Cara Akses Cepat:</b> Buka link aplikasi dengan akhiran <code>#admin</code> di browser HP Anda.
              </p>
              <p className="text-[10px] text-neutral-400">
                (Kata sandi standar awal: <code>admin331</code>)
              </p>
            </div>
          </div>
        ) : (
          /* UNLOCKED SCREEN: Dashboard Admin Lengkap */
          <div className="p-6 overflow-y-auto space-y-6 text-xs">

            {/* Quick Action Bar: Salin Link Khusus & Ganti Password */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#e4e4e7] shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-[#080808] text-xs">Admin Terautentikasi</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAdminLink}
                  title="Salin link khusus langsung menuju panel admin ini"
                  className="px-3 py-1.5 rounded-full bg-[#f4f4f5] hover:bg-[#e4e4e7] text-[#080808] font-bold text-[11px] border border-[#e4e4e7] flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5" />}
                  <span>{linkCopied ? 'Link Disalin!' : 'Salin Link Admin (#admin)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsChangingPass(!isChangingPass)}
                  className="px-3 py-1.5 rounded-full bg-[#f4f4f5] hover:bg-[#e4e4e7] text-[#080808] font-semibold text-[11px] border border-[#e4e4e7] flex items-center gap-1 transition cursor-pointer"
                >
                  <Key className="w-3 h-3" />
                  <span>{isChangingPass ? 'Tutup' : 'Ganti Password'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="Kunci kembali panel admin"
                  className="p-1.5 rounded-full hover:bg-red-50 text-red-600 border border-transparent hover:border-red-200 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Form Ganti Password (Jika Diklik) */}
            {isChangingPass && (
              <form onSubmit={handleChangePassword} className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    Ubah Password Admin
                  </h4>
                </div>

                {changePassFeedback && (
                  <div className={`p-2.5 rounded-xl text-[11px] font-semibold ${
                    changePassFeedback.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {changePassFeedback.text}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Masukkan password admin baru..."
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    className="flex-1 bg-white border border-amber-300 rounded-full px-3.5 py-1.5 text-xs text-[#080808] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-[#080808] text-white font-bold px-4 py-1.5 rounded-full text-xs hover:bg-neutral-800 transition cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            )}

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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-bold text-sm text-[#080808] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#696969]" />
                  Daftar Kode di Supabase ({filteredLicenses.length})
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Cari kode/nama..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="bg-white border border-[#e4e4e7] rounded-full px-3 py-1 text-[11px] focus:outline-none w-32 sm:w-40"
                  />
                  <button
                    type="button"
                    onClick={fetchLicenses}
                    className="text-[#696969] hover:text-[#080808] font-medium text-xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingList ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {filteredLicenses.length === 0 ? (
                  <div className="p-4 text-center text-[#696969] bg-white rounded-2xl border border-[#e4e4e7]">
                    Belum ada lisensi yang cocok.
                  </div>
                ) : (
                  filteredLicenses.map((lic) => {
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
                  })
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
