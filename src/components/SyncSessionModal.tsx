import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Laptop,
  Copy,
  Check,
  Share2,
  RefreshCw,
  QrCode,
  ShieldCheck,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';

interface SyncSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSessionId: string;
  onUpdateSessionId: (newId: string) => void;
}

export const SyncSessionModal: React.FC<SyncSessionModalProps> = ({
  isOpen,
  onClose,
  currentSessionId,
  onUpdateSessionId,
}) => {
  const [copied, setCopied] = useState(false);
  const [customIdInput, setCustomIdInput] = useState(currentSessionId);
  const [isEditingId, setIsEditingId] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const syncUrl = `${currentOrigin}/?session=${encodeURIComponent(currentSessionId)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    syncUrl
  )}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(syncUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } else {
      alert(`Salin link berikut: ${syncUrl}`);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Link Sesi Kurir 2.0 (Realtime PC & iPhone):\n${syncUrl}\n\nBuka link ini di Safari iPhone Anda agar langsung tersambung dengan PC! 🚀`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSaveCustomId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customIdInput.trim()) return;
    onUpdateSessionId(customIdInput.trim());
    setIsEditingId(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md overflow-y-auto font-aspekta">
      <div className="bg-[#fafafa] rounded-[32px] w-full max-w-lg shadow-2xl border border-[#e4e4e7] overflow-hidden my-auto max-h-[94vh] flex flex-col text-[#222222]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#fafafa] border-b border-[#e4e4e7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#080808] text-white flex items-center justify-center shadow-sm">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg text-[#080808] tracking-tight">
                  Tautkan Sesi PC & iPhone
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  Realtime Cloud
                </span>
              </div>
              <p className="text-xs text-[#696969]">
                Ketik & perbaiki alamat di PC, antarkan langsung di iPhone
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

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* How It Works Diagram */}
          <div className="bg-white p-4 rounded-2xl border border-[#e4e4e7] shadow-2xs">
            <div className="flex items-center justify-between text-center">
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-800 mb-1 border border-neutral-200">
                  <Laptop className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs text-[#080808]">1. PC / Laptop</span>
                <span className="text-[10px] text-[#696969]">Ketik & koreksi alamat</span>
              </div>

              <div className="flex flex-col items-center px-2">
                <div className="h-0.5 w-12 bg-emerald-500 relative flex items-center justify-center">
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded-full font-mono font-bold absolute -top-4">
                    Realtime
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-600 mt-1" />
              </div>

              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 flex items-center justify-center text-white mb-1 shadow-sm">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="font-bold text-xs text-[#080808]">2. iPhone Kurir</span>
                <span className="text-[10px] text-[#696969]">Navigasi & kunci GPS</span>
              </div>
            </div>
          </div>

          {/* QR Code Scan Area */}
          <div className="bg-white p-5 rounded-3xl border border-[#e4e4e7] shadow-2xs flex flex-col items-center text-center space-y-3">
            <div className="p-2.5 bg-white border-2 border-emerald-500/30 rounded-2xl shadow-sm">
              <img
                src={qrImageUrl}
                alt="Scan QR Sesi"
                className="w-44 h-44 object-contain rounded-xl"
                loading="lazy"
              />
            </div>

            <div>
              <h3 className="font-bold text-sm text-[#080808]">
                Buka Kamera iPhone Lalu Scan QR Ini
              </h3>
              <p className="text-xs text-[#696969] mt-0.5 max-w-xs">
                iPhone Anda akan langsung membuka sesi yang sama persis dengan PC ini.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 w-full">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2.5 px-4 rounded-full bg-[#f4f4f5] hover:bg-[#e4e4e7] text-[#080808] font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-[#e4e4e7] active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Link Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Link Sesi</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="flex-1 py-2.5 px-4 rounded-full bg-[#080808] hover:bg-neutral-800 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kirim Link ke WA</span>
              </button>
            </div>
          </div>

          {/* Session ID Details */}
          <div className="bg-[#f4f4f5] p-4 rounded-2xl border border-[#e4e4e7] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#080808]">Kode Sesi Kurir:</span>
              {!isEditingId && (
                <button
                  onClick={() => setIsEditingId(true)}
                  className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  Ubah Kode
                </button>
              )}
            </div>

            {isEditingId ? (
              <form onSubmit={handleSaveCustomId} className="flex items-center gap-2">
                <input
                  type="text"
                  value={customIdInput}
                  onChange={(e) => setCustomIdInput(e.target.value)}
                  className="flex-1 bg-white border border-[#e4e4e7] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-[#080808] focus:outline-none"
                  placeholder="Misal no WA: 6281295713923"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#080808] text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-neutral-800"
                >
                  Simpan
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-[#e4e4e7]">
                <span className="font-mono font-bold text-xs text-[#080808] tracking-wider">
                  {currentSessionId}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Aktif
                </span>
              </div>
            )}

            <p className="text-[11px] text-[#696969] leading-snug">
              Kedua perangkat (PC dan iPhone) yang menggunakan kode sesi di atas akan saling terhubung otomatis dan berbagi riwayat rekap yang sama.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
