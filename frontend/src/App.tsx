import React, { useEffect, useState, useCallback } from 'react';
import {
  Layers,
  BarChart3,
  Smartphone,
  Play,
  Activity,
  CheckCircle,
  Shield,
  Compass,
  FileCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import { CadastralMap } from './components/Map/CadastralMap';
import { VerificationQueue } from './components/Queue/VerificationQueue';
import { ParcelInspectorDrawer } from './components/Inspector/ParcelInspectorDrawer';
import { StatsOverview } from './components/Analytics/StatsOverview';
import { FieldVerificationModal } from './components/FieldApp/FieldVerificationModal';
import { DemoFlowGuide } from './components/DemoTour/DemoFlowGuide';
import {
  ParcelDetail,
  ParcelGeoJSONFeature,
  GNSSPoint,
  RoadFeature,
  AuditLogEntry,
  AOIStats
} from './types';

export const App: React.FC = () => {
  // Application Data States
  const [parcels, setParcels] = useState<ParcelGeoJSONFeature[]>([]);
  const [queue, setQueue] = useState<ParcelDetail[]>([]);
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>('AOI-0341');
  const [selectedParcel, setSelectedParcel] = useState<ParcelDetail | null>(null);
  const [corsStations, setCorsStations] = useState<GNSSPoint[]>([]);
  const [roads, setRoads] = useState<RoadFeature[]>([]);
  const [stats, setStats] = useState<AOIStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Layer & UI Toggles
  const [showLegacy, setShowLegacy] = useState(true);
  const [showCORS, setShowCORS] = useState(true);
  const [showRoads, setShowRoads] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  // Modals & Tour
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showDemoGuide, setShowDemoGuide] = useState(false);

  // Live status
  const [wsConnected, setWsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch initial datasets
  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [parcelsRes, queueRes, corsRes, roadsRes, statsRes] = await Promise.all([
        fetch('/api/parcels'),
        fetch('/api/queue'),
        fetch('/api/cors'),
        fetch('/api/roads'),
        fetch('/api/stats')
      ]);

      const [parcelsData, queueData, corsData, roadsData, statsData] = await Promise.all([
        parcelsRes.json(),
        queueRes.json(),
        corsRes.json(),
        roadsRes.json(),
        statsRes.json()
      ]);

      setParcels(parcelsData.features || []);
      setQueue(queueData || []);
      setCorsStations(corsData || []);
      setRoads(roadsData.features || []);
      setStats(statsData || null);

      if (queueData.length > 0 && !selectedParcelId) {
        setSelectedParcelId(queueData[0].id);
      }
    } catch (err) {
      console.error('Failed to load cadastral datasets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedParcelId]);

  // Fetch selected parcel details & audit trail
  const fetchParcelDetails = useCallback(async (parcelId: string) => {
    try {
      const [detailRes, auditRes] = await Promise.all([
        fetch(`/api/parcels/${parcelId}`),
        fetch(`/api/parcels/${parcelId}/audit`)
      ]);
      if (detailRes.ok) {
        const detail = await detailRes.json();
        setSelectedParcel(detail);
      }
      if (auditRes.ok) {
        const logs = await auditRes.json();
        setAuditLogs(logs);
      }
      setIsInspectorOpen(true);
    } catch (err) {
      console.error(`Failed to load details for parcel ${parcelId}:`, err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Load details when selection changes
  useEffect(() => {
    if (selectedParcelId) {
      fetchParcelDetails(selectedParcelId);
    }
  }, [selectedParcelId, fetchParcelDetails]);

  // WebSocket Live Connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live-queue`;
    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'parcel_verified' || data.event === 'parcel_snapped') {
            // Refresh data seamlessly
            fetchAllData();
            if (data.parcel_id === selectedParcelId) {
              fetchParcelDetails(data.parcel_id);
            }
          }
        } catch (e) {
          // ignore parsing error
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
      };
    } catch (err) {
      console.warn('WebSocket connection unavailable:', err);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [fetchAllData, selectedParcelId, fetchParcelDetails]);

  // Action: Submit surveyor verification
  const handleVerify = async (action: string, notes?: string) => {
    if (!selectedParcelId) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/parcels/${selectedParcelId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          actor: 'Surveyor Officer Sharma (DoLR)',
          notes: notes || 'Verified boundary against cadastral benchmark.'
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedParcel(updated);
        await fetchAllData();
        await fetchParcelDetails(selectedParcelId);
      }
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: One-Click Snap to Nearest CORS Station
  const handleSnapGNSS = async () => {
    if (!selectedParcelId) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/parcels/${selectedParcelId}/snap-gnss?max_dist_m=25.0`, {
        method: 'POST'
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedParcel(updated);
        await fetchAllData();
        await fetchParcelDetails(selectedParcelId);
      }
    } catch (err) {
      console.error('GNSS snapping failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: In-Map Vertex Drag
  const handleVertexDrag = async (updatedCoords: number[][][]) => {
    if (!selectedParcel) return;
    const editedGeometry = {
      type: 'Polygon' as const,
      coordinates: updatedCoords
    };
    setSelectedParcel({
      ...selectedParcel,
      ai_geometry: editedGeometry
    });
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-cadastre-bg text-cadastre-text font-sans antialiased">
      {/* Top Government Navigation Header */}
      <header className="h-14 border-b border-cadastre-border bg-slate-950/90 px-4 flex items-center justify-between z-30 shadow-md">
        {/* Logo & Agency Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Compass className="w-4 h-4 text-white animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black font-mono tracking-wider text-white flex items-center gap-1.5">
                NAKSHA<span className="text-cyan-400">AI</span>
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                v1.0 MVP
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">
              AI-Assisted Cadastral Fabric Builder & Verification-Priority Engine • DoLR DILRMP
            </p>
          </div>
        </div>

        {/* AOI Zone & Authority Info */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-gray-300 font-medium">Delhi-NCR Central Cadastral Zone 4</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-400 font-mono text-[11px]">3.8 km² AOI</span>
        </div>

        {/* Action Controls & Demo Launcher */}
        <div className="flex items-center gap-2.5">
          {/* Live WebSocket Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold border ${
              wsConnected
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
                : 'bg-amber-950/40 text-amber-400 border-amber-500/40'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            {wsConnected ? 'LIVE FEED SYNC' : 'CONNECTING'}
          </div>

          {/* SIH Demo Tour Button */}
          <button
            onClick={() => setShowDemoGuide(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-gray-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>SIH 2026 Demo Flow</span>
          </button>

          {/* Field Surveyor App PWA Modal */}
          <button
            onClick={() => setShowFieldModal(true)}
            className="px-3 py-1.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Field App View</span>
          </button>

          {/* Analytics Modal */}
          <button
            onClick={() => setShowStatsModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-gray-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Analytics</span>
          </button>
        </div>
      </header>

      {/* Main Multi-Pane Cadastral Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Pane: Priority Verification Queue */}
        <VerificationQueue
          queue={queue}
          selectedParcelId={selectedParcelId}
          onSelectParcel={(id) => setSelectedParcelId(id)}
          isLoading={isLoading}
        />

        {/* Center Pane: Interactive Web-GIS Map */}
        <main className="flex-1 h-full relative">
          <CadastralMap
            parcels={parcels}
            selectedParcel={selectedParcel}
            onSelectParcel={(id) => setSelectedParcelId(id)}
            corsStations={corsStations}
            roads={roads}
            showLegacy={showLegacy}
            onToggleLegacy={() => setShowLegacy(!showLegacy)}
            showCORS={showCORS}
            onToggleCORS={() => setShowCORS(!showCORS)}
            showRoads={showRoads}
            onToggleRoads={() => setShowRoads(!showRoads)}
            is3DMode={is3DMode}
            onToggle3D={() => setIs3DMode(!is3DMode)}
            onVertexDrag={handleVertexDrag}
          />
        </main>

        {/* Right Pane: Discrepancy Studio & Deep Inspector Drawer */}
        {isInspectorOpen && selectedParcel && (
          <ParcelInspectorDrawer
            parcel={selectedParcel}
            onClose={() => setIsInspectorOpen(false)}
            onVerify={handleVerify}
            onSnapGNSS={handleSnapGNSS}
            auditLogs={auditLogs}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {/* Modals & Guides */}
      {showStatsModal && (
        <StatsOverview stats={stats} onClose={() => setShowStatsModal(false)} />
      )}

      {showFieldModal && selectedParcel && (
        <FieldVerificationModal
          parcel={selectedParcel}
          onClose={() => setShowFieldModal(false)}
          onFieldConfirm={async (id, notes) => {
            await handleVerify('field_verified', notes);
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {showDemoGuide && (
        <DemoFlowGuide
          isOpen={showDemoGuide}
          onClose={() => setShowDemoGuide(false)}
          onSelectParcel={(id) => setSelectedParcelId(id)}
          onToggleLegacy={(s) => setShowLegacy(s)}
          onToggleCORS={(s) => setShowCORS(s)}
          onToggleRoads={(s) => setShowRoads(s)}
          onOpenFieldApp={() => setShowFieldModal(true)}
          onOpenStats={() => setShowStatsModal(true)}
          onSnapGNSS={handleSnapGNSS}
          onVerify={handleVerify}
        />
      )}
    </div>
  );
};

export default App;
