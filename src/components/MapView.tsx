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

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    const latLngs: L.LatLngExpression[] = [];

    const dpIcon = L.divIcon({
      className: 'custom-dp-marker',
      html: `
        <div style="background: #dc2626; color: white; border: 2px solid white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-weight: 900; box-shadow: 0 4px 10px rgba(220,38,38,0.5); font-size: 14px;">
          🏢
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const dpMarker = L.marker([settings.dropPointLat, settings.dropPointLng], {
      icon: dpIcon,
    }).bindPopup(`
      <div style="font-family: sans-serif; padding: 4px;">
        <b style="color: #dc2626;">🏢 ${settings.dropPointName}</b>
        <p style="margin: 4px 0 0; font-size: 12px; color: #475569;">${settings.dropPointAddress}</p>
        <div style="margin-top: 6px; font-size: 11px; background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; display: inline-block; font-weight: bold;">
          Titik Berangkat / Pulang Kurir
        </div>
      </div>
    `);

    markersLayer.addLayer(dpMarker);
    latLngs.push([settings.dropPointLat, settings.dropPointLng]);

    packages.forEach((pkg) => {
      const isDelivered = pkg.status === 'delivered';
      const bgColor = isDelivered ? '#10b981' : pkg.isCod ? '#e11d48' : '#2563eb';

      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `
          <div style="background: ${bgColor}; color: white; border: 2.5px solid white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); text-shadow: 0 1px 2px rgba(0,0,0,0.5);">
            ${pkg.orderIndex}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const navUrl = getSingleNavigationUrl(pkg.lat, pkg.lng, pkg.fullAddress);

      const marker = L.marker([pkg.lat, pkg.lng], { icon: stopIcon }).bindPopup(`
        <div style="font-family: system-ui, sans-serif; min-width: 180px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="background: ${bgColor}; color: white; font-weight: 800; font-size: 11px; padding: 2px 6px; border-radius: 4px;">
              STOP #${pkg.orderIndex}
            </span>
            <span style="font-size: 10px; font-weight: 700; color: #64748b;">${pkg.trackingNumber}</span>
          </div>
          <b style="font-size: 14px; color: #0f172a;">${pkg.recipientName}</b>
          <p style="margin: 4px 0 2px; font-size: 12px; color: #334155; line-height: 1.3;">${pkg.fullAddress}</p>
          ${
            pkg.isCod
              ? `<div style="background: #fef3c7; color: #92400e; font-weight: 800; font-size: 11px; padding: 3px 6px; border-radius: 4px; margin: 6px 0; border: 1px solid #fde68a;">
                  💰 COD: Rp ${pkg.codAmount.toLocaleString('id-ID')}
                </div>`
              : `<div style="background: #dbeafe; color: #1e40af; font-weight: 700; font-size: 11px; padding: 2px 6px; border-radius: 4px; margin: 6px 0;">
                  ✅ Non-COD (Lunas)
                </div>`
          }
          <div style="margin-top: 8px;">
            <a href="${navUrl}" target="_blank" style="display: block; text-align: center; background: #2563eb; color: white; text-decoration: none; padding: 6px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; box-shadow: 0 2px 4px rgba(37,99,235,0.3);">
              🧭 Buka di Google Maps
            </a>
          </div>
        </div>
      `);

      markersLayer.addLayer(marker);
      latLngs.push([pkg.lat, pkg.lng]);
    });

    if (latLngs.length > 1) {
      const polyline = L.polyline(latLngs, {
        color: '#dc2626',
        weight: 3.5,
        opacity: 0.8,
        dashArray: '6, 6',
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
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-slate-950" />

      <div className="absolute bottom-4 left-4 right-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 border border-white inline-block"></span>
            <span className="text-slate-300">Belum (Stop #)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white inline-block"></span>
            <span className="text-slate-300">Terkirim</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 inline-block text-[9px] text-center font-bold">🏢</span>
            <span className="text-slate-300">Drop Point</span>
          </div>
        </div>

        <button
          onClick={handleCenterMap}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 font-semibold cursor-pointer shadow"
        >
          <Compass className="w-3.5 h-3.5 text-red-400" />
          <span>Fokus Semua</span>
        </button>
      </div>
    </div>
  );
};
