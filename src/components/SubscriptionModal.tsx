import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  Camera,
  DollarSign,
  MessageCircle,
  X,
  Sparkles,
  Lock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  activateLicenseCode,
  startFreeTrial,
  getDaysRemaining,
  type LocalLicenseInfo,
} from '../utils/licenseManager';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: LocalLicenseInfo | null;
  onLicenseUpdated: (newLicense: LocalLicenseInfo | null) => void;
  adminWhatsAppNumber?: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  license,
  onLicenseUpdated,
  adminWhatsAppNumber = '6281295713923', // Nomor WhatsApp Pemilik (6281295713923)
}) => {
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  if (!isOpen) return null;

  const isProActive = license && license.status === 'active' && new Date(license.expiresAt).getTime() > Date.now();
  const daysLeft = license ? getDaysRemaining(license.expiresAt) : 0;

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    const res = await activateLicenseCode(inputCode);
    setLoading(false);

    if (res.success && res.license) {
      setFeedback({ type: 'success', text: res.message });
      onLicenseUpdated(res.license);
      setInputCode('');
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleTrial = () => {
    setFeedback(null);
    const res = startFreeTrial();
    if (res.success && res.license) {
      setFeedback({ type: 'success', text: res.message });
      onLicenseUpdated(res.license);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleOrderWhatsApp = () => {
    const text = `Halo Admin Kurir 2.0, saya ingin berlangganan *Kode Akses Bulanan (Rp 100.000 / 30 Hari)* untuk pengantaran paket. Mohon info nomor rekening / QRIS pembayaran. Terima kasih! 🙏`;
    window.open(`https://wa.me/${adminWhatsAppNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto font-aspekta">
      <div className="bg-[#fafafa] rounded-[32px] w-full max-w-lg shadow-2xl border border-[#e4e4e7] overflow-hidden my-auto max-h-[92vh] flex flex-col text-[#222222]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#fafafa] border-b border-[#e4e4e7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#080808] text-amber-400 flex items-center justify-center shadow-sm">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#080808] tracking-tight">
                Langganan & Lisensi Kurir 2.0
              </h2>
              <p className="text-xs text-[#696969]">Sistem Kode Akses Sprinter Profesional</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#f4f4f5] text-[#696969] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Status Box */}
          {isProActive ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-[24px] p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Status: {license?.isTrial ? 'Trial Gratis Aktif' : 'PRO Berlangganan Aktif'}
                </span>
                <span className="bg-emerald-600 text-white font-bold px-3 py-1 rounded-full text-xs">
                  {daysLeft} Hari Tersisa
                </span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Kode Akses: <code className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">{license?.code}</code>
                <br />
                Berlaku hingga:{' '}
                <b>{new Date(license?.expiresAt || '').toLocaleDateString('id-ID', { dateStyle: 'full' })}</b>
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-300 rounded-[24px] p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-amber-900 flex items-center gap-1.5">
                  <Lock className="w-5 h-5 text-amber-600" />
                  Status: Belum Memiliki Kode Aktif
                </span>
                <span className="bg-amber-600 text-white font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                  Terkunci
                </span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Silakan masukkan kode akses bulanan Anda, coba gratis 2 hari, atau beli langganan untuk membuka semua fitur navigasi rute dan scanner.
              </p>
            </div>
          )}

          {/* Feedback Banner */}
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

          {/* Input Form Kode Akses */}
          <form onSubmit={handleActivate} className="space-y-3">
            <label className="block text-xs font-bold text-[#080808]">
              Punya Kode Akses Langganan?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: JNT-BRANTA-PRO-1"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="flex-1 bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-4 py-2.5 font-mono font-bold text-xs text-[#080808] focus:outline-none focus:border-[#080808]"
              />
              <button
                type="submit"
                disabled={loading || !inputCode.trim()}
                className="bg-[#080808] hover:bg-neutral-800 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-full transition cursor-pointer active:scale-95 whitespace-nowrap flex items-center gap-1.5"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5 text-amber-400" />}
                <span>Aktifkan</span>
              </button>
            </div>
          </form>

          {/* Order Banner CTA (Rp 100.000 / Bulan) */}
          <div className="bg-gradient-to-br from-[#111111] to-[#222222] text-white rounded-[26px] p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-wider uppercase text-amber-400 font-bold block">
                  PAKET PRO SPRINTER
                </span>
                <h3 className="text-xl font-black tracking-tight text-white mt-0.5">
                  Rp 100.000 <span className="text-xs font-normal text-neutral-400">/ 30 Hari</span>
                </h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-bold text-xs shadow-md">
                30H
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] text-neutral-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Rute Otomatis Anti Bolak-Balik (Hemat Bensin 1-2 Jam)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Scanner Kamera OCR Resi J&T Tanpa Batas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Kalkulator Pecahan Uang COD Pas (Anti Nombok Kasir)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Template WhatsApp Konfirmasi Paket 1-Klik</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOrderWhatsApp}
              className="w-full bg-white hover:bg-neutral-100 active:scale-95 text-black font-bold py-3 px-4 rounded-full transition shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer mt-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600/20" />
              <span>Beli Kode Akses via WhatsApp (Rp 100rb)</span>
            </button>
          </div>

          {/* Trial Button */}
          {!isProActive && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleTrial}
                className="text-neutral-600 hover:text-black font-semibold text-xs underline cursor-pointer"
              >
                Belum yakin? Coba Gratis Dulu Selama 2 Hari →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
