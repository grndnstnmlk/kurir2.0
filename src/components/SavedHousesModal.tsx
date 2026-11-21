import React, { useState } from 'react';
import {
  Home,
  Search,
  Plus,
  X,
  MapPin,
  Navigation,
  MessageCircle,
  Phone,
  Trash2,
  Edit3,
  Maximize2,
  Compass,
  Check,
} from 'lucide-react';
import type { SavedHousePoint } from '../types';

interface SavedHousesModalProps {
  isOpen: boolean;
  onClose: () => void;
  houses: SavedHousePoint[];
  onAddNew: () => void;
  onEditHouse: (house: SavedHousePoint) => void;
  onDeleteHouse: (id: string) => void;
}

export const SavedHousesModal: React.FC<SavedHousesModalProps> = ({
  isOpen,
  onClose,
  houses,
  onAddNew,
  onEditHouse,
  onDeleteHouse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [zoomedPhoto, setZoomedPhoto] = useState<{ url: string; title: string } | null>(null);

  if (!isOpen) return null;

  // Extract unique areas/dusuns
  const areas = Array.from(
    new Set(
      houses
        .map((h) => h.areaOrStreet)
        .filter((a) => a && a.trim().length > 0)
    )
  );

  const filteredHouses = houses.filter((h) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      h.recipientName.toLowerCase().includes(q) ||
      h.fullAddress.toLowerCase().includes(q) ||
      h.benchmark.toLowerCase().includes(q) ||
      (h.recipientPhone && h.recipientPhone.includes(q)) ||
      (h.notes && h.notes.toLowerCase().includes(q));

    const matchesArea =
      selectedArea === 'all' ||
      h.areaOrStreet.toLowerCase().includes(selectedArea.toLowerCase());

    return matchesSearch && matchesArea;
  });

  const handleOpenWhatsApp = (phone: string, name: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('08')) {
      clean = '628' + clean.slice(2);
    }
    const text = `Halo Kak ${name}, saya kurir J&T Express. Mau konfirmasi pengantaran paket hari ini. Terima kasih! 🙏`;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md overflow-y-auto font-aspekta">
      <div className="bg-[#fafafa] rounded-[32px] w-full max-w-2xl shadow-2xl border border-[#e4e4e7] overflow-hidden my-auto max-h-[92vh] flex flex-col text-[#222222]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#fafafa] border-b border-[#e4e4e7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#080808] text-amber-400 flex items-center justify-center shadow-sm">
              <Home className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-[#080808] tracking-tight">
                  Buku Titik Rumah Pelanggan
                </h2>
                <span className="bg-[#f4f4f5] border border-[#e4e4e7] text-[#080808] font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                  {houses.length} Rumah
                </span>
              </div>
              <p className="text-xs text-[#696969]">
                Titik GPS akurat & foto patokan rumah agar tidak tersesat di gang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onAddNew}
              className="bg-[#080808] hover:bg-neutral-800 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-full transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Catat Rumah Baru</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#f4f4f5] text-[#696969] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Area Filter Bar */}
        <div className="p-4 sm:px-6 bg-white border-b border-[#e4e4e7] space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#696969] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama pelanggan, alamat, patokan warna rumah, atau no HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f4f4f5] border border-[#e4e4e7] rounded-full pl-10 pr-4 py-2.5 text-xs text-[#080808] focus:outline-none focus:border-black"
            />
          </div>

          {/* Area Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 text-xs">
            <button
              onClick={() => setSelectedArea('all')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition cursor-pointer text-[11px] font-semibold ${
                selectedArea === 'all'
                  ? 'bg-[#080808] text-white shadow-xs'
                  : 'bg-[#f4f4f5] text-[#696969] hover:bg-[#e4e4e7]'
              }`}
            >
              Semua Wilayah ({houses.length})
            </button>

            {areas.map((area) => (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition cursor-pointer text-[11px] font-semibold ${
                  selectedArea === area
                    ? 'bg-[#080808] text-white shadow-xs'
                    : 'bg-[#f4f4f5] text-[#696969] hover:bg-[#e4e4e7]'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* List of Saved Houses */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 text-xs">
          {filteredHouses.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-3xl border border-[#e4e4e7] space-y-2">
              <Home className="w-10 h-10 text-neutral-300 mx-auto" />
              <h3 className="font-bold text-sm text-[#080808]">Belum Ada Titik Rumah yang Cocok</h3>
              <p className="text-xs text-[#696969] max-w-sm mx-auto">
                {searchQuery
                  ? 'Coba ganti kata kunci pencarian nama atau dusun.'
                  : 'Catat titik rumah customer saat Anda selesai mengantar paket.'}
              </p>
              <button
                onClick={onAddNew}
                className="mt-2 inline-flex items-center gap-1.5 bg-[#080808] text-white font-bold text-xs px-4 py-2 rounded-full cursor-pointer hover:bg-neutral-800 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Catat Titik Rumah Pertama</span>
              </button>
            </div>
          ) : (
            filteredHouses.map((house) => {
              const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${house.lat},${house.lng}`;

              return (
                <div
                  key={house.id}
                  className="bg-white p-4 sm:p-5 rounded-[24px] border border-[#e4e4e7] shadow-subtle hover:border-black/30 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    
                    {/* Left: House Info */}
                    <div className="flex items-start gap-3 flex-1">
                      {/* Photo Thumbnail */}
                      {house.photoUrl ? (
                        <div
                          onClick={() => setZoomedPhoto({ url: house.photoUrl!, title: house.recipientName })}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-neutral-900 border border-[#e4e4e7] shrink-0 relative group cursor-pointer shadow-xs"
                          title="Klik untuk perbesar foto rumah"
                        >
                          <img
                            src={house.photoUrl}
                            alt={house.recipientName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-100 border border-[#e4e4e7] shrink-0 flex flex-col items-center justify-center text-neutral-400">
                          <Home className="w-6 h-6 stroke-[1.5]" />
                          <span className="text-[9px] mt-0.5">Tanpa Foto</span>
                        </div>
                      )}

                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-[#080808]">
                            {house.recipientName}
                          </h3>
                          <span className="bg-[#f4f4f5] text-[#222222] font-semibold text-[10px] px-2 py-0.5 rounded-full border border-[#e4e4e7]">
                            {house.areaOrStreet}
                          </span>
                        </div>

                        {house.recipientPhone && (
                          <p className="text-xs text-[#696969] font-mono">
                            📞 {house.recipientPhone}
                          </p>
                        )}

                        <p className="text-xs text-[#222222] leading-snug">
                          {house.fullAddress}
                        </p>

                        {/* Benchmark Highlight */}
                        {house.benchmark && (
                          <div className="bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-1 rounded-xl text-[11px] font-medium flex items-start gap-1.5 mt-1.5">
                            <span className="shrink-0">🏡</span>
                            <span><b>Ciri/Patokan:</b> {house.benchmark}</span>
                          </div>
                        )}

                        {/* Courier Notes */}
                        {house.notes && (
                          <p className="text-[11px] text-[#696969] italic mt-1">
                            💡 Catatan: "{house.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Action Icons: Edit & Delete */}
                    <div className="flex items-center gap-1.5 self-end sm:self-start">
                      <button
                        onClick={() => onEditHouse(house)}
                        title="Edit data rumah"
                        className="p-2 rounded-full hover:bg-[#f4f4f5] text-[#696969] hover:text-[#080808] transition cursor-pointer border border-[#e4e4e7]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Hapus catatan titik rumah untuk ${house.recipientName}?`)) {
                            onDeleteHouse(house.id);
                          }
                        }}
                        title="Hapus data rumah"
                        className="p-2 rounded-full hover:bg-red-50 text-red-500 hover:text-red-700 transition cursor-pointer border border-[#e4e4e7]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                  {/* Bottom Action Bar: Google Maps & WhatsApp */}
                  <div className="pt-2.5 border-t border-[#e4e4e7] flex items-center justify-between gap-2 text-xs">
                    <span className="text-[10px] text-[#696969] font-mono">
                      📍 {house.lat.toFixed(5)}, {house.lng.toFixed(5)}
                    </span>

                    <div className="flex items-center gap-2">
                      {house.recipientPhone && (
                        <button
                          onClick={() => handleOpenWhatsApp(house.recipientPhone, house.recipientName)}
                          className="px-3 py-1.5 rounded-full bg-[#f4f4f5] hover:bg-[#e4e4e7] active:scale-95 text-[#080808] font-bold text-[11px] border border-[#e4e4e7] flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Chat WA</span>
                        </button>
                      )}

                      <a
                        href={navUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-full bg-[#080808] hover:bg-neutral-800 active:scale-95 text-white font-bold text-[11px] shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5 text-blue-400" />
                        <span>Buka Maps 🧭</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Zoomed House Photo Lightbox */}
      {zoomedPhoto && (
        <div
          onClick={() => setZoomedPhoto(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-xl w-full bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl relative">
            <div className="px-5 py-3 border-b border-neutral-800 flex items-center justify-between text-white">
              <span className="font-bold text-sm">Foto Rumah: {zoomedPhoto.title}</span>
              <button
                onClick={() => setZoomedPhoto(null)}
                className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={zoomedPhoto.url}
              alt={zoomedPhoto.title}
              className="w-full max-h-[75vh] object-contain bg-black"
            />
          </div>
        </div>
      )}

    </div>
  );
};
