import React, { useState, useEffect } from 'react';
import { X, Phone, MessageCircle, Check, AlertCircle, ShieldAlert } from 'lucide-react';
import type { DeliveryPackage } from '../types';
import { formatRupiah } from '../utils/routeOptimizer';

interface QuickPhoneModalProps {
  isOpen: boolean;
  pkg: DeliveryPackage | null;
  onClose: () => void;
  onSavePhone: (pkgId: string, newPhone: string, action?: 'whatsapp' | 'sms' | 'none') => void;
  whatsAppTemplate?: string;
}

export const QuickPhoneModal: React.FC<QuickPhoneModalProps> = ({
  isOpen,
  pkg,
  onClose,
  onSavePhone,
  whatsAppTemplate,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (pkg) {
      // Jika nomor masih disensor (ada bintang *), biarkan input kosong atau isi prefix 08 agar kurir nyaman mengetik
      if (pkg.recipientPhone && pkg.recipientPhone.includes('*')) {
        setPhoneNumber('08');
      } else {
        setPhoneNumber(pkg.recipientPhone || '08');
      }
      setErrorMsg(null);
    }
  }, [pkg]);

  if (!isOpen || !pkg) return null;

  const isMasked = pkg.recipientPhone?.includes('*');
  const lastFour = pkg.recipientPhone ? pkg.recipientPhone.slice(-4) : '';

  const cleanPhoneInput = (val: string) => {
    // Hanya perbolehkan angka dan simbol + di awal
    return val.replace(/[^\d+]/g, '');
  };

  const handleSave = (action: 'whatsapp' | 'sms' | 'none' = 'none') => {
    const clean = cleanPhoneInput(phoneNumber);
    if (!clean || clean.length < 9) {
      setErrorMsg('Nomor telepon minimal 10 digit (contoh: 081234567890)');
      return;
    }
    if (clean.includes('*')) {
      setErrorMsg('Nomor masih mengandung tanda bintang (*). Harap isi lengkap.');
      return;
    }

    onSavePhone(pkg.id, clean, action);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white text-[#080808] w-full max-w-md rounded-[28px] border border-[#e4e4e7] p-5 sm:p-6 shadow-2xl relative font-aspekta"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e4e4e7]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#080808] leading-tight">
                Isi Nomor HP Penerima
              </h3>
              <p className="text-[11px] text-[#696969]">
                Buka sensor J&T Sprinter untuk WhatsApp & Telepon
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

        {/* Info Paket */}
        <div className="mt-4 p-3.5 bg-[#f4f4f5] rounded-2xl border border-[#e4e4e7]/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#080808]">
              {pkg.recipientName}
            </span>
            <span className="text-[11px] font-mono text-[#696969] bg-white px-2 py-0.5 rounded-md border border-[#e4e4e7]">
              {pkg.trackingNumber}
            </span>
          </div>

          <p className="text-xs text-[#52525b] line-clamp-2">
            📍 {pkg.fullAddress}
          </p>

          {isMasked && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              <span>
                Sensor di resi: <strong className="font-mono">{pkg.recipientPhone}</strong>
                {lastFour && (
                  <> (4 digit terakhir: <strong className="font-mono text-black">{lastFour}</strong>)</>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Input Nomor HP */}
        <div className="mt-4 space-y-1.5">
          <label className="block text-xs font-bold text-[#080808]">
            Nomor WhatsApp / HP Pelanggan:
          </label>
          <div className="relative flex items-center">
            <input
              type="tel"
              inputMode="numeric"
              autoFocus
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(cleanPhoneInput(e.target.value));
                if (errorMsg) setErrorMsg(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave('none');
                }
              }}
              placeholder="081234567890"
              className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full px-4 py-3 text-base text-[#080808] font-mono tracking-wider focus:outline-none focus:border-black focus:bg-white transition"
            />
            {phoneNumber && (
              <button
                type="button"
                onClick={() => setPhoneNumber('08')}
                className="absolute right-3 text-xs text-[#a1a1aa] hover:text-[#080808] px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>

          {errorMsg ? (
            <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" />
              <span>{errorMsg}</span>
            </p>
          ) : (
            <p className="text-[11px] text-[#696969] mt-1">
              💡 Masukkan 10-13 digit nomor HP pelanggan yang tertera pada catatan resi / sistem.
            </p>
          )}
        </div>

        {/* Tombol Aksi */}
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleSave('whatsapp')}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-full transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Simpan & Buka Chat WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('sms')}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs rounded-full transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Simpan & Buka SMS (Jika Tidak Ada WA)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('none')}
            className="w-full py-2.5 px-4 bg-[#292929] hover:bg-[#080808] active:scale-98 text-white font-medium text-xs rounded-full transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Nomor Saja</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-medium text-[#71717a] hover:text-[#080808] transition text-center"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};
