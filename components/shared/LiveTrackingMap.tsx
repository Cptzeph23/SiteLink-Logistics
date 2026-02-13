'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Navigation } from 'lucide-react';

interface TrackingPoint {
  latitude: number;
  longitude: number;
  speed_kmh: number;
  recorded_at: string;
}

interface Stop {
  stop_type: 'pickup' | 'delivery';
  address: string;
  latitude?: number;
  longitude?: number;
}

interface LiveTrackingMapProps {
  jobId: string;
  stops: Stop[];
  isInTransit: boolean;
}

export function LiveTrackingMap({ jobId, stops, isInTransit }: LiveTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [speed, setSpeed] = useState<number>(0);
  const [error, setError] = useState('');

  // Nairobi default center
  const DEFAULT_CENTER = { lat: -1.286389, lng: 36.817223 };

  useEffect(() => {
    // Load Leaflet dynamically (no API key needed - uses OpenStreetMap)
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initMap();
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  function initMap() {
    if (!mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;

    // Create map
    const map = L.map(mapRef.current).setView(
      [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
      13
    );

    // Use OpenStreetMap tiles - FREE, no API key
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add stop markers
    stops.forEach((stop) => {
      if (!stop.latitude || !stop.longitude) return;

      const isPickup = stop.stop_type === 'pickup';
      const color = isPickup ? '#22c55e' : '#ef4444';
      const label = isPickup ? 'P' : 'D';

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            width: 32px; height: 32px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold; color: white; font-size: 14px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">${label}</div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([stop.latitude, stop.longitude], { icon })
        .bindPopup(`<strong>${isPickup ? 'Pickup' : 'Delivery'}</strong><br/>${stop.address}`)
        .addTo(map);
    });

    setLoading(false);

    // Start polling for tracking updates if in transit
    if (isInTransit) {
      fetchAndUpdateLocation(map);
    }
  }

  async function fetchAndUpdateLocation(map: any) {
    try {
      const res = await fetch(`/api/tracking?job_id=${jobId}`);
      const data = await res.json();

      if (data.points && data.points.length > 0) {
        const latest = data.points[0]; // Most recent first

        if (latest.latitude && latest.longitude) {
          const L = (window as any).L;

          // Create or update driver marker
          if (!markerRef.current) {
            const driverIcon = L.divIcon({
              className: '',
              html: `
                <div style="
                  width: 40px; height: 40px;
                  background: #FF6B35;
                  border: 3px solid white;
                  border-radius: 50%;
                  display: flex; align-items: center; justify-content: center;
                  box-shadow: 0 2px 8px rgba(255,107,53,0.5);
                  animation: pulse 2s infinite;
                ">
                  <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                    <path d="M1 3h15v13H1zm15 4h4l3 3v6h-7V7zm3 3.5V9h-2v3h3.5l-1.5-1.5z"/>
                    <circle cx="4.5" cy="17.5" r="2.5"/>
                    <circle cx="14.5" cy="17.5" r="2.5"/>
                    <circle cx="19.5" cy="17.5" r="2.5"/>
                  </svg>
                </div>
              `,
              iconSize: [40, 40],
              iconAnchor: [20, 20],
            });

            markerRef.current = L.marker(
              [latest.latitude, latest.longitude],
              { icon: driverIcon }
            )
              .bindPopup('🚛 Driver is here')
              .addTo(map);
          } else {
            markerRef.current.setLatLng([latest.latitude, latest.longitude]);
          }

          // Pan map to follow driver
          map.panTo([latest.latitude, latest.longitude]);

          setLastUpdate(latest.recorded_at);
          setSpeed(latest.speed_kmh || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching tracking:', err);
    }
  }

  // Poll every 10 seconds when in transit
  useEffect(() => {
    if (!isInTransit || !mapInstanceRef.current) return;

    const interval = setInterval(() => {
      if (mapInstanceRef.current) {
        fetchAndUpdateLocation(mapInstanceRef.current);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isInTransit, jobId]);

  return (
    <div className="space-y-3">
      {/* Map Container */}
      <div className="relative rounded-lg overflow-hidden border-2 border-slate-200">
        {loading && (
          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-construction-orange" />
              <p className="text-sm text-slate-600">Loading map...</p>
            </div>
          </div>
        )}
        <div ref={mapRef} style={{ height: '350px', width: '100%' }} />
      </div>

      {/* Status Bar */}
      {isInTransit && (
        <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-slate-600">Live tracking active</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            {speed > 0 && (
              <span className="flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                {speed.toFixed(0)} km/h
              </span>
            )}
            {lastUpdate && (
              <span className="text-xs">
                Updated {new Date(lastUpdate).toLocaleTimeString('en-KE', {
                  hour: '2-digit', minute: '2-digit', second: '2-digit'
                })}
              </span>
            )}
          </div>
        </div>
      )}

      {!isInTransit && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span>Live tracking will appear once the driver starts the trip</span>
        </div>
      )}
    </div>
  );
}