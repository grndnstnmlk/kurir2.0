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
        attribution: '&copy; OpenStreetMap &copy; CARTO',
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

    // Drop Point Marker in Lipstick Magenta
    const dpIcon = L.divIcon({
      className: 'custom-dp-marker',
      html: `
        <div style="background: #db3c8a; color: white; border: 2.5px solid #fff8f6; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px;">
          ⚡
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const dpMarker = L.marker([settings.dropPointLat, settings.dropPointLng], {
      icon: dpIcon,
    }).bindPopup(`
      <div style="font-family: system-ui, sans-serif; padding: 4px; color: #00522d;">
        <b style="color: #db3c8a; font-size: 14px;">⚡ ${settings.dropPointName}</b>
        <p style="margin: 4px 0 0; font-size: 12px;">${settings.dropPointAddress}</p>
        <div style="margin-top: 6px; font-size: 11px; background: #fce5df; color: #00522d; padding: 2px 8px; border-radius: 9999px; display: inline-block; font-weight: bold;">
          Drop Point J&T Express
        </div>
      </div>
    `);

    markersLayer.addLayer(dpMarker);
    latLngs.push([settings.dropPointLat, settings.dropPointLng]);

    // Package Stop Markers
    packages.forEach((pkg) => {
      const isDelivered = pkg.status === 'delivered';
      const bgColor = isDelivered ? '#00522d' : '#db3c8a';

      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `
          <div style="background: ${bgColor}; color: white; border: 2.5px solid #fff8f6; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px; font-family: sans-serif;">
            ${pkg.orderIndex}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const navUrl = getSingleNavigationUrl(pkg.lat, pkg.lng, pkg.fullAddress);

      const marker = L.marker([pkg.lat, pkg.lng], { icon: stopIcon }).bindPopup(`
        <div style="font-family: system-ui, sans-serif; min-width: 180px; padding: 2px; color: #00522d;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="background: ${bgColor}; color: white; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 9999px;">
              STOP #${pkg.orderIndex}
            </span>
            <span style="font-size: 10px; font-weight: 700; color: #00522d;">${pkg.trackingNumber}</span>
          </div>
          <b style="font-size: 14px; color: #00522d;">${pkg.recipientName}</b>
          <p style="margin: 4px 0 2px; font-size: 12px; color: #00522d; line-height: 1.3;">${pkg.fullAddress}</p>
          ${
            pkg.isCod
              ? `<div style="background: #fce5df; color: #db3c8a; font-weight: 800; font-size: 11px; padding: 3px 8px; border-radius: 9999px; margin: 6px 0;">
                  💰 COD: Rp ${pkg.codAmount.toLocaleString('id-ID')}
                </div>`
              : `<div style="background: #fce5df; color: #00522d; font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 9999px; margin: 6px 0;">
                  Lunas (Non-COD)
                </div>`
          }
          <div style="margin-top: 8px;">
            <a href="${navUrl}" target="_blank" style="display: block; text-align: center; background: #db3c8a; color: white; text-decoration: none; padding: 6px 8px; border-radius: 8px; font-size: 12px; font-weight: bold;">
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
        color: '#db3c8a',
        weight: 3,
        opacity: 0.85,
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
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#fff8f6]" />

      <div className="absolute bottom-4 left-4 right-4 z-10 bg-[#fff8f6]/95 border border-[#fce5df] rounded-[16px] p-3 shadow-lg flex items-center justify-between text-xs font-clash text-[#00522d]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#db3c8a] inline-block"></span>
            <span>Stop Belum</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#00522d] inline-block"></span>
            <span>Terkirim</span>
          </div>
        </div>

        <button
          onClick={handleCenterMap}
          className="flex items-center gap-1 bg-[#fce5df] hover:bg-[#f29ebd]/50 active:scale-95 text-[#00522d] px-3 py-1.5 rounded-full font-bold transition cursor-pointer border border-[#fce5df]"
        >
          <Compass className="w-3.5 h-3.5 text-[#db3c8a]" />
          <span>Fokus Peta</span>
        </button>
      </div>
    </div>
  );
};
