import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  MapPin,
  Compass,
  Maximize2,
  Box,
  Eye,
  Crosshair,
  Satellite,
  CheckCircle2
} from 'lucide-react';
import { ParcelDetail, GNSSPoint, RoadFeature } from '../../types';

interface CadastralMapProps {
  parcels: any[];
  selectedParcel: ParcelDetail | null;
  onSelectParcel: (parcelId: string) => void;
  corsStations: GNSSPoint[];
  roads: RoadFeature[];
  showLegacy: boolean;
  onToggleLegacy: () => void;
  showCORS: boolean;
  onToggleCORS: () => void;
  showRoads: boolean;
  onToggleRoads: () => void;
  is3DMode: boolean;
  onToggle3D: () => void;
  onVertexDrag?: (coords: number[][][]) => void;
}

export const CadastralMap: React.FC<CadastralMapProps> = ({
  parcels,
  selectedParcel,
  onSelectParcel,
  corsStations,
  roads,
  showLegacy,
  onToggleLegacy,
  showCORS,
  onToggleCORS,
  showRoads,
  onToggleRoads,
  is3DMode,
  onToggle3D,
  onVertexDrag
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const parcelLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const legacyLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const corsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const roadLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const vertexLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const [activeBaseMap, setActiveBaseMap] = useState<'dark' | 'satellite'>('dark');
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered at Delhi Central Cadastral Zone
    const map = L.map(mapContainerRef.current, {
      center: [28.627, 77.217],
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    // Dark Carto Base
    const darkTile = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { maxZoom: 19, subdomains: 'abcd' }
    ).addTo(map);
    baseTileLayerRef.current = darkTile;

    // Initialize Layer Groups
    parcelLayerGroupRef.current = L.layerGroup().addTo(map);
    legacyLayerGroupRef.current = L.layerGroup().addTo(map);
    corsLayerGroupRef.current = L.layerGroup().addTo(map);
    roadLayerGroupRef.current = L.layerGroup().addTo(map);
    vertexLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Base Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(baseTileLayerRef.current);

    if (activeBaseMap === 'satellite') {
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(mapInstanceRef.current);
    } else {
      baseTileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { maxZoom: 19, subdomains: 'abcd' }
      ).addTo(mapInstanceRef.current);
    }
  }, [activeBaseMap]);

  // Color helper according to priority band
  const getPriorityColor = (band: string) => {
    switch (band) {
      case 'critical':
        return '#EF4444'; // Red
      case 'high':
        return '#F97316'; // Orange
      case 'moderate':
        return '#F59E0B'; // Amber
      case 'low':
      default:
        return '#10B981'; // Green
    }
  };

  // Render AI Parcels Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !parcelLayerGroupRef.current) return;
    parcelLayerGroupRef.current.clearLayers();

    parcels.forEach((feature) => {
      const isSelected = selectedParcel?.id === feature.id;
      const band = feature.properties?.priority_band || 'low';
      const color = getPriorityColor(band);
      const coords = feature.geometry.coordinates[0]; // [[lon, lat], ...]
      const latlngs: L.LatLngTuple[] = coords.map((c: number[]) => [c[1], c[0]]);

      const polygon = L.polygon(latlngs, {
        color: isSelected ? '#38BDF8' : color,
        weight: isSelected ? 3 : (is3DMode ? 2.5 : 1.5),
        opacity: isSelected ? 1 : 0.85,
        fillColor: color,
        fillOpacity: isSelected ? 0.45 : (is3DMode ? 0.35 : 0.22),
        dashArray: feature.properties?.verification_status === 'approved' ? undefined : '2, 1'
      });

      // Interactive hover & selection
      polygon.on('click', () => onSelectParcel(feature.id));
      polygon.bindTooltip(
        `<div class="text-xs font-mono font-medium p-1">
          <div class="font-bold text-white">${feature.properties?.parcel_code}</div>
          <div class="text-gray-300">${feature.properties?.khasra_number}</div>
          <div class="mt-1 flex items-center justify-between gap-2">
            <span class="text-xs" style="color: ${color}">Score: ${feature.properties?.priority_score}/100</span>
            <span class="capitalize text-gray-400 text-[10px]">${feature.properties?.verification_status}</span>
          </div>
        </div>`,
        { sticky: true, className: 'cadastral-tooltip' }
      );

      parcelLayerGroupRef.current?.addLayer(polygon);

      // If 3D Extrusion Mode is on, draw simulated isometric roof extrusion & shadow
      if (is3DMode) {
        const heightMeters = feature.properties?.height_m || 4;
        const offsetLat = (heightMeters * 0.000008);
        const offsetLon = (heightMeters * 0.000008);
        const roofLatlngs: L.LatLngTuple[] = coords.map((c: number[]) => [c[1] + offsetLat, c[0] + offsetLon]);

        const roof = L.polygon(roofLatlngs, {
          color: '#67E8F9',
          weight: 1.5,
          fillColor: '#06B6D4',
          fillOpacity: 0.35
        });
        parcelLayerGroupRef.current?.addLayer(roof);

        // Side pillars
        for (let i = 0; i < latlngs.length; i++) {
          const wall = L.polyline([latlngs[i], roofLatlngs[i]], {
            color: '#38BDF8',
            weight: 1,
            opacity: 0.4
          });
          parcelLayerGroupRef.current?.addLayer(wall);
        }
      }
    });
  }, [parcels, selectedParcel, is3DMode]);

  // Render Legacy Cadastral Record Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !legacyLayerGroupRef.current) return;
    legacyLayerGroupRef.current.clearLayers();

    if (!showLegacy) return;

    if (selectedParcel?.legacy_geometry) {
      const coords = selectedParcel.legacy_geometry.coordinates[0];
      const latlngs: L.LatLngTuple[] = coords.map((c: number[]) => [c[1], c[0]]);

      const legacyPoly = L.polygon(latlngs, {
        color: '#A855F7', // Mauve purple
        weight: 2.5,
        dashArray: '6, 6',
        fillColor: '#9333EA',
        fillOpacity: 0.18
      });

      legacyPoly.bindTooltip(
        `<div class="text-xs p-1 font-mono text-purple-300 font-semibold">
          🏛️ Legacy Record (Jamabandi/Bhubharati 1982)
          <div class="text-gray-300 font-normal mt-0.5">${selectedParcel.khasra_number}</div>
        </div>`,
        { sticky: true }
      );

      legacyLayerGroupRef.current.addLayer(legacyPoly);
    }
  }, [selectedParcel, showLegacy]);

  // Render CORS / GNSS Ground Truth Stations
  useEffect(() => {
    if (!mapInstanceRef.current || !corsLayerGroupRef.current) return;
    corsLayerGroupRef.current.clearLayers();

    if (!showCORS) return;

    corsStations.forEach((station) => {
      const customIcon = L.divIcon({
        className: 'cors-icon-wrapper',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-6 h-6 rounded-full bg-blue-500/30 cors-pulse"></div>
            <div class="w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full shadow-lg z-10 flex items-center justify-center text-[8px] text-white font-bold">
              ✓
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([station.latitude, station.longitude], { icon: customIcon });
      marker.bindPopup(`
        <div class="text-xs p-1 font-sans">
          <div class="flex items-center gap-1.5 text-blue-400 font-bold">
            <span class="text-sm">📡</span> Survey of India CORS Network
          </div>
          <div class="font-semibold text-white mt-1">${station.station_name}</div>
          <div class="font-mono text-gray-400 text-[11px] mt-0.5">ID: ${station.station_id}</div>
          <div class="mt-2 grid grid-cols-2 gap-2 text-[10px] bg-slate-800/80 p-1.5 rounded border border-slate-700">
            <div>
              <span class="text-gray-400">Accuracy:</span>
              <span class="font-bold text-emerald-400 block">±${station.accuracy_cm} cm</span>
            </div>
            <div>
              <span class="text-gray-400">Status:</span>
              <span class="font-bold text-blue-400 block">Ground Truth</span>
            </div>
          </div>
        </div>
      `);

      corsLayerGroupRef.current?.addLayer(marker);
    });
  }, [corsStations, showCORS]);

  // Render Roads & Access Corridors
  useEffect(() => {
    if (!mapInstanceRef.current || !roadLayerGroupRef.current) return;
    roadLayerGroupRef.current.clearLayers();

    if (!showRoads) return;

    roads.forEach((road) => {
      const latlngs: L.LatLngTuple[] = road.geometry.coordinates.map((c) => [c[1], c[0]] as [number, number]);
      const polyline = L.polyline(latlngs, {
        color: '#F59E0B',
        weight: Math.max(3, road.properties.width_m / 8),
        opacity: 0.7,
        lineCap: 'round'
      });

      polyline.bindTooltip(
        `<div class="text-xs font-mono text-amber-300 font-medium">
          🛣️ ${road.properties.name} (${road.properties.width_m}m Corridor)
        </div>`,
        { sticky: true }
      );

      roadLayerGroupRef.current?.addLayer(polyline);
    });
  }, [roads, showRoads]);

  // Render Interactive Vertex Handles for Selected Parcel
  useEffect(() => {
    if (!mapInstanceRef.current || !vertexLayerGroupRef.current) return;
    vertexLayerGroupRef.current.clearLayers();

    if (!selectedParcel) return;

    const coords = selectedParcel.ai_geometry.coordinates[0];
    const vertices = coords.slice(0, coords.length - 1); // omit duplicated closing vertex

    vertices.forEach((vertex, index) => {
      const vertexIcon = L.divIcon({
        className: 'vertex-icon',
        html: `
          <div class="w-3.5 h-3.5 bg-cyan-400 border-2 border-white rounded-full shadow-md cursor-move hover:scale-125 transition-transform flex items-center justify-center">
            <span class="text-[7px] text-gray-950 font-bold">${index + 1}</span>
          </div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([vertex[1], vertex[0]], {
        icon: vertexIcon,
        draggable: true
      });

      marker.on('dragend', (e: any) => {
        const newLatLng = e.target.getLatLng();
        const updatedCoords = [...coords];
        updatedCoords[index] = [newLatLng.lng, newLatLng.lat];
        if (index === 0) {
          updatedCoords[updatedCoords.length - 1] = [newLatLng.lng, newLatLng.lat];
        }
        if (onVertexDrag) {
          onVertexDrag([updatedCoords]);
        }
      });

      marker.bindTooltip(`Vertex #${index + 1} (Drag to adjust or snap)`, {
        direction: 'top',
        offset: [0, -8]
      });

      vertexLayerGroupRef.current?.addLayer(marker);
    });
  }, [selectedParcel, onVertexDrag]);

  // Fly to selected parcel
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedParcel) return;
    const coords = selectedParcel.ai_geometry.coordinates[0];
    const latlngs: L.LatLngTuple[] = coords.map((c) => [c[1], c[0]] as [number, number]);
    const bounds = L.latLngBounds(latlngs);
    mapInstanceRef.current.flyToBounds(bounds, {
      padding: [100, 100],
      duration: 1.2,
      maxZoom: 18
    });
  }, [selectedParcel]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-cadastre-bg">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Layer Controls & Map Utilities */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="glass-panel rounded-xl p-1.5 shadow-xl flex items-center gap-1 text-xs">
          <button
            onClick={() => setActiveBaseMap('dark')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
              activeBaseMap === 'dark'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Dark Carto
          </button>
          <button
            onClick={() => setActiveBaseMap('satellite')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
              activeBaseMap === 'satellite'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            Satellite ORI
          </button>
        </div>

        {/* Cadastral Layer Toggles */}
        <div className="glass-panel rounded-xl p-2.5 shadow-xl flex flex-col gap-2 text-xs w-48">
          <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 px-1 font-semibold flex items-center justify-between">
            <span>Cadastral Overlays</span>
            <Layers className="w-3 h-3 text-cyan-400" />
          </div>

          <button
            onClick={onToggleLegacy}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-all ${
              showLegacy
                ? 'bg-purple-950/40 text-purple-300 border border-purple-500/40'
                : 'text-gray-400 hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 border border-purple-300"></span>
              Legacy Cadastre
            </span>
            <span className="text-[10px] font-mono">{showLegacy ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onToggleCORS}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-all ${
              showCORS
                ? 'bg-blue-950/40 text-blue-300 border border-blue-500/40'
                : 'text-gray-400 hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              SOI CORS Pins
            </span>
            <span className="text-[10px] font-mono">{showCORS ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onToggleRoads}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-all ${
              showRoads
                ? 'bg-amber-950/40 text-amber-300 border border-amber-500/40'
                : 'text-gray-400 hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-3 h-1 rounded-sm bg-amber-400"></span>
              Road Corridors
            </span>
            <span className="text-[10px] font-mono">{showRoads ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onToggle3D}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-all ${
              is3DMode
                ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-500/40 font-semibold'
                : 'text-gray-400 hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Box className="w-3.5 h-3.5 text-cyan-400" />
              3D Extrusion
            </span>
            <span className="text-[10px] font-mono">{is3DMode ? 'ACTIVE' : '2D'}</span>
          </button>
        </div>
      </div>

      {/* Map Legend (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-20 glass-panel rounded-xl p-3 shadow-xl text-[11px] flex items-center gap-4">
        <span className="font-mono text-gray-400 text-[10px] uppercase font-bold">Priority Triage:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span className="text-gray-300">Critical (85–100)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
          <span className="text-gray-300">High (60–84)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-gray-300">Moderate (30–59)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-gray-300">Low (0–29)</span>
        </div>
      </div>
    </div>
  );
};
