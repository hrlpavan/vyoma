import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface AqiMapProps {
  lat: number;
  lon: number;
  cityName: string;
  aqi: number;
  color: string;
}

export function AqiMap({ lat, lon, cityName, aqi, color }: AqiMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lon],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    });

    const mapTilerKey = import.meta.env.VITE_MAPTILER_KEY?.trim();

    if (mapTilerKey) {
      L.tileLayer(
        `https://api.maptiler.com/maps/streets-v2-light/256/{z}/{x}/{y}@2x.png?key=${encodeURIComponent(
          mapTilerKey
        )}`,
        {
          maxZoom: 19,
          tileSize: 256,
        }
      ).addTo(map);
    } else {
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      const tilePane = map.getPane('tilePane');
      if (tilePane) {
        tilePane.style.filter = 'saturate(0.65) brightness(1.03) contrast(0.95)';
      }
    }

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    map.flyTo([lat, lon], 11, { duration: 0.65 });
    group.clearLayers();

    // Soft AQI dispersion radius
    L.circle([lat, lon], {
      radius: 4500,
      color,
      weight: 1.5,
      opacity: 0.7,
      fillColor: color,
      fillOpacity: 0.2,
    }).addTo(group);

    // Center AQI pill marker
    const badgeIcon = L.divIcon({
      className: 'vyoma-aqi-pin',
      html: `<div style="
        display:inline-flex;
        align-items:center;
        justify-content:center;
        width:max-content;
        background:${color};
        color:${aqi <= 200 && aqi > 50 ? '#1d1d1f' : '#ffffff'};
        font-family:-apple-system,BlinkMacSystemFont,sans-serif;
        font-size:12px;
        font-weight:700;
        padding:4px 10px;
        border-radius:999px;
        border:2px solid #ffffff;
        box-shadow:0 2px 8px rgba(0,0,0,0.22);
        white-space:nowrap;
        transform:translate(-50%,-50%);
      ">${aqi}</div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    L.marker([lat, lon], { icon: badgeIcon })
      .bindTooltip(cityName, { direction: 'top', offset: [0, -14] })
      .addTo(group);
  }, [lat, lon, cityName, aqi, color]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 240, background: '#e9ecef' }}
    />
  );
}
