import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Save,
  Trash2,
  DollarSign,
  User,
  Phone,
  Home,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
} from 'lucide-react';
import type { DeliveryPackage, PackageStatus } from '../types';
import { geocodeAddress } from '../utils/geocoding';

interface EditPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: DeliveryPackage | null;
  onSavePackage: (updatedPkg: DeliveryPackage) => void;
  onDeletePackage?: (pkgId: string) => void;
  dropPointLat?: number;
  dropPointLng?: number;
}

export const EditPackageModal: React.FC<EditPackageModalProps> = ({
  isOpen,
  onClose,
  pkg,
  onSavePackage,
  onDeletePackage,
  dropPointLat = -7.2107,
  dropPointLng = 113.4493,
}) => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [areaOrStreet, setAreaOrStreet] = useState('');
  const [benchmark, setBenchmark] = useState('');
  const [isCod, setIsCod] = useState(false);
  const [codAmount, setCodAmount] = useState<number>(0);
  const [status, setStatus] = useState<PackageStatus>('pending');
  const [statusNotes, setStatusNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (pkg && isOpen) {
      setTrackingNumber(pkg.trackingNumber || '');
      setRecipientName(pkg.recipientName || '');
      setRecipientPhone(pkg.recipientPhone || '');
      setFullAddress(pkg.fullAddress || '');
      setAreaOrStreet(pkg.areaOrStreet || '');
      setBenchmark(pkg.benchmark || '');
      setIsCod(pkg.isCod);
      setCodAmount(pkg.codAmount || 0);
      setStatus(pkg.status);
      setStatusNotes(pkg.statusNotes || '');
    }
  }, [pkg, isOpen]);

  if (!isOpen || !pkg) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullAddress.trim()) {
      alert('Alamat pengantaran tidak boleh kosong.');
      return;
    }

    setIsSaving(true);

    let lat = pkg.lat;
    let lng = pkg.lng;

    // Jika alamat diubah total dan belum pernah dikunci GPS manual, coba re-geocode
    if (fullAddress.trim() !== pkg.fullAddress.trim() && (!pkg.lat || pkg.lat === -7.2255)) {
      try {
        const coords = await geocodeAddress(fullAddress, dropPointLat, dropPointLng);
        lat = coords.lat;
        lng = coords.lng;
      } catch {
        // Biarkan koordinat lama
      }
    }

    const updated: DeliveryPackage = {
      ...pkg,
      trackingNumber: trackingNumber.trim() || pkg.trackingNumber,
      recipientName: recipientName.trim() || 'Pelanggan',
      recipientPhone: recipientPhone.trim(),
      fullAddress: fullAddress.trim(),
      areaOrStreet: areaOrStreet.trim() || 'Branta Pamekasan',
      benchmark: benchmark.trim() || undefined,
      isCod,
      codAmount: isCod ? Number(codAmount) || 0 : 0,
      status,
      statusNotes: statusNotes.trim() || undefined,
      deliveredAt: status === 'delivered' ? pkg.deliveredAt || new Date().toISOString() : undefined,
      lat,
      lng,
    };

    onSavePackage(updated);
    setIsSaving(false);
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Hapus paket ${trackingNumber} (${recipientName}) dari daftar antaran?`)) {
      if (onDeletePackage) {
        onDeletePackage(pkg.id);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto font-aspekta">
      <div className="bg-[#fafafa] rounded-[32px] w-full max-w-lg shadow-2xl border border-[#e4e4e7] overflow-hidden my-auto max-h-[94vh] flex flex-col text-[#222222]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#fafafa] border-b border-[#e4e4e7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#080808] text-white flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-[#080808] tracking-tight">
                Edit & Koreksi Data Paket
              </h2>
              <p className="text-xs text-[#696969]">
                Ketik atau perbaiki alamat yang salah baca saat scan
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* No. Resi */}
          <div>
            <label className="block text-[#696969] font-medium mb-1">Nomor Resi J&T:</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full bg-white border border-[#e4e4e7] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-[#080808] focus:outline-none focus:border-black"
              placeholder="Contoh: JY12345678 / JP..."
            />
          </div>

          {/* Nama & No. HP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#696969] font-medium mb-1">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Nama Penerima:</span>
                </span>
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full bg-white border border-[#e4e4e7] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#080808] focus:outline-none focus:border-black"
                placeholder="Nama customer..."
                required
              />
            </div>

            <div>
              <label className="block text-[#696969] font-medium mb-1">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-neutral-500" />
                  <span>No. WhatsApp / HP:</span>
                </span>
              </label>
              <input
                type="text"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full bg-white border border-[#e4e4e7] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#080808] focus:outline-none focus:border-black"
                placeholder="0812... / 628..."
              />
            </div>
          </div>

          {/* Alamat Lengkap (Besar & Nyaman Diketik di PC) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[#696969] font-bold">
                <span className="flex items-center gap-1">
                  <Home className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Alamat Lengkap Pengantaran:</span>
                </span>
              </label>
              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">
                Bisa diketik manual di PC
              </span>
            </div>
            <textarea
              rows={3}
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              className="w-full bg-white border border-[#e4e4e7] rounded-2xl p-3 text-xs leading-relaxed text-[#080808] focus:outline-none focus:border-black shadow-2xs"
              placeholder="Ketik alamat lengkap, nama gang, RT/RW, atau petunjuk jalan..."
              required
            />
          </div>

          {/* Dusun / Area & Patokan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#696969] font-medium mb-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>Dusun / Wilayah:</span>
                </span>
              </label>
              <input
                type="text"
                value={areaOrStreet}
                onChange={(e) => setAreaOrStreet(e.target.value)}
                className="w-full bg-white border border-[#e4e4e7] rounded-xl px-3.5 py-2.5 text-xs text-[#080808] font-medium focus:outline-none focus:border-black"
                placeholder="Misal: Dusun Mayar, Dusun Bandaran"
              />
            </div>

            <div>
              <label className="block text-[#696969] font-medium mb-1">
                Patokan Rumah (Ciri-Ciri):
              </label>
              <input
                type="text"
                value={benchmark}
                onChange={(e) => setBenchmark(e.target.value)}
                className="w-full bg-white border border-[#e4e4e7] rounded-xl px-3.5 py-2.5 text-xs text-[#080808] focus:outline-none focus:border-black"
                placeholder="Misal: Pagar hijau, depan musholla"
              />
            </div>
          </div>

          {/* Pengaturan COD */}
          <div className="bg-white p-4 rounded-2xl border border-[#e4e4e7] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-[#080808] text-xs">Paket COD (Bayar di Tempat)</span>
                <p className="text-[11px] text-[#696969]">Aktifkan jika kurir harus menagih uang tunai</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCod}
                  onChange={(e) => setIsCod(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {isCod && (
              <div>
                <label className="block text-[#696969] font-medium mb-1">Nominal COD (Rp):</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-neutral-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={codAmount || ''}
                    onChange={(e) => setCodAmount(Number(e.target.value) || 0)}
                    className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-[#080808] focus:outline-none focus:border-black"
                    placeholder="Contoh: 75000"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Status Antaran */}
          <div>
            <label className="block text-[#696969] font-medium mb-1.5">Status Pengantaran:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                  status === 'pending'
                    ? 'bg-[#080808] text-white border-black'
                    : 'bg-white hover:bg-[#f4f4f5] text-[#222222] border-[#e4e4e7]'
                }`}
              >
                <span>Belum Diantar</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('delivered')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                  status === 'delivered'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white hover:bg-[#f4f4f5] text-[#222222] border-[#e4e4e7]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Terkirim</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('rescheduled')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                  status === 'rescheduled'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white hover:bg-[#f4f4f5] text-[#222222] border-[#e4e4e7]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Kosong/Tunda</span>
              </button>
            </div>
          </div>

          {/* Buttons: Delete & Save */}
          <div className="pt-3 border-t border-[#e4e4e7] flex items-center justify-between gap-3">
            {onDeletePackage && (
              <button
                type="button"
                onClick={handleDelete}
                className="py-3 px-4 rounded-full bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border border-red-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Paket</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-5 rounded-full bg-[#f4f4f5] hover:bg-[#e4e4e7] text-[#222222] font-semibold text-xs transition cursor-pointer border border-[#e4e4e7]"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="py-3 px-6 rounded-full bg-[#080808] hover:bg-neutral-800 active:scale-95 text-white font-bold text-xs transition cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan & Sinkronkan 🚀'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
