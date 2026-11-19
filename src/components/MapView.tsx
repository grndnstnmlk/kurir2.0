import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { DeliveryPackage, CourierSettings } from '../types';
import { getSingleNavigationUrl } from '../utils/routeOptimizer';
import { Compass } from 'lucide-react';

interface MapViewProps {
  packages: DeliveryPackage[];
  settings: CourierSettings;
}

export const MapView: React.FC<MapViewProps> = ({
  packages,
  settings,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [settings.dropPointLat, settings.dropPointLng],
        zoom: 14,
        zoomControl: false,
      });

      // OpenStreetMap Official Free Tile Server (Tanpa perlu API key apapun)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Refresh ukuran peta agar tile termuat sempurna seketika
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    markersLayer.clearLayers();

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    const latLngs: L.LatLngExpression[] = [];

    // Drop Point Marker in Charcoal #080808
    const dpIcon = L.divIcon({
      className: 'custom-dp-marker',
      html: `
        <div style="background: #080808; color: #fafafa; border: 2.5px solid #fafafa; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; box-shadow: rgba(19,19,22,0.15) 0 4px 10px;">
          DP
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const dpMarker = L.marker([settings.dropPointLat, settings.dropPointLng], {
      icon: dpIcon,
    }).bindPopup(`
      <div style="font-family: system-ui, sans-serif; padding: 4px; color: #222222;">
        <b style="color: #080808; font-size: 14px;">🏢 ${settings.dropPointName}</b>
        <p style="margin: 4px 0 0; font-size: 12px; color: #696969;">${settings.dropPointAddress}</p>
        <div style="margin-top: 6px; font-size: 11px; background: #f4f4f5; color: #080808; padding: 2px 10px; border-radius: 999px; display: inline-block; font-weight: 600;">
          Gudang Asal
        </div>
      </div>
    `);

    markersLayer.addLayer(dpMarker);
    latLngs.push([settings.dropPointLat, settings.dropPointLng]);

    // Package Stop Markers in Monochromatic Mid Ink #292929
    packages.forEach((pkg) => {
      const isDelivered = pkg.status === 'delivered';
      const bgColor = isDelivered ? '#696969' : '#292929';

      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `
          <div style="background: ${bgColor}; color: #fafafa; border: 2.5px solid #fafafa; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; font-family: system-ui, sans-serif; box-shadow: rgba(19,19,22,0.15) 0 2px 8px;">
            ${pkg.orderIndex}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const navUrl = getSingleNavigationUrl(pkg.lat, pkg.lng, pkg.fullAddress);

      const marker = L.marker([pkg.lat, pkg.lng], { icon: stopIcon }).bindPopup(`
        <div style="font-family: system-ui, sans-serif; min-width: 190px; padding: 3px; color: #222222;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="background: ${bgColor}; color: white; font-weight: 600; font-size: 11px; padding: 2px 8px; border-radius: 999px;">
              STOP #${pkg.orderIndex}
            </span>
            <span style="font-size: 10px; color: #696969;">${pkg.trackingNumber}</span>
          </div>
          <b style="font-size: 14px; color: #080808;">${pkg.recipientName}</b>
          <p style="margin: 4px 0 2px; font-size: 12px; color: #696969; line-height: 1.3;">${pkg.fullAddress}</p>
          ${
            pkg.isCod
              ? `<div style="background: #f4f4f5; color: #080808; font-weight: 600; font-size: 11px; padding: 3px 8px; border-radius: 999px; margin: 6px 0; border: 1px solid #e4e4e7;">
                  COD: Rp ${pkg.codAmount.toLocaleString('id-ID')}
                </div>`
              : `<div style="background: #f4f4f5; color: #696969; font-weight: 500; font-size: 11px; padding: 2px 8px; border-radius: 999px; margin: 6px 0;">
                  Lunas (Non-COD)
                </div>`
          }
          <div style="margin-top: 8px;">
            <a href="${navUrl}" target="_blank" style="display: block; text-align: center; background: #292929; color: #fafafa; text-decoration: none; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 500;">
              Buka Google Maps →
            </a>
          </div>
        </div>
      `);

      markersLayer.addLayer(marker);
      latLngs.push([pkg.lat, pkg.lng]);
    });

    if (latLngs.length > 1) {
      const polyline = L.polyline(latLngs, {
        color: '#292929',
        weight: 2.5,
        opacity: 0.8,
        dashArray: '5, 5',
      }).addTo(map);
      routeLineRef.current = polyline;

      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [packages, settings]);

  const handleCenterMap = () => {
    if (!mapInstanceRef.current) return;
    const allCoords: L.LatLngExpression[] = [
      [settings.dropPointLat, settings.dropPointLng],
      ...packages.map((p) => [p.lat, p.lng] as L.LatLngExpression),
    ];
    if (allCoords.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(allCoords), {
        padding: [40, 40],
      });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-190px)] min-h-[480px]">
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#fafafa]" />

      <div className="absolute bottom-4 left-4 right-4 z-10 bg-[#fafafa]/95 border border-[#e4e4e7] rounded-full px-5 py-3 shadow-subtle flex items-center justify-between text-xs font-aspekta text-[#222222]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#292929] inline-block"></span>
            <span className="text-[#696969]">Belum Diantar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#696969] inline-block"></span>
            <span className="text-[#696969]">Terkirim</span>
          </div>
        </div>

        <button
          onClick={handleCenterMap}
          className="flex items-center gap-1.5 bg-[#f4f4f5] hover:bg-[#e4e4e7] active:scale-95 text-[#222222] px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer border border-[#e4e4e7]"
        >
          <Compass className="w-3.5 h-3.5 text-[#292929]" />
          <span>Fokus Peta</span>
        </button>
      </div>
    </div>
  );
};
