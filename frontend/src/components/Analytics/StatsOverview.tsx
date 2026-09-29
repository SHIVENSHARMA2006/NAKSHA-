import React from 'react';
import { X, BarChart3, TrendingUp, CheckCircle, AlertTriangle, ShieldCheck, MapPin, Radio } from 'lucide-react';
import { AOIStats } from '../../types';

interface StatsOverviewProps {
  stats: AOIStats | null;
  onClose: () => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, onClose }) => {
  if (!stats) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-700 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 border-b border-cadastre-border bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide font-mono uppercase">
                AOI Cadastral Analytics & Triage Metrics
              </h2>
              <p className="text-[11px] text-gray-400">
                {stats.aoi_name} • DoLR DILRMP Verification Performance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Core SIH Triage Metric Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/40 to-slate-900 border border-emerald-500/40 shadow-inner flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                Ground Truthing Triage Savings
              </span>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {stats.triage_savings_percentage}% Automated Fast-Track
              </div>
              <p className="text-[11px] text-gray-300 mt-1 max-w-md">
                Instead of surveying 100% of parcels across the city, field teams are only dispatched to the{' '}
                <span className="text-red-400 font-bold font-mono">
                  {(100 - stats.triage_savings_percentage).toFixed(1)}%
                </span>{' '}
                disputed parcels surfacing high conflict.
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-emerald-300">SAVED</span>
              <span className="text-lg font-black text-emerald-400 font-mono">88%</span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="glass-card rounded-xl p-3 border border-slate-800">
              <span className="text-[10px] text-gray-400 uppercase font-mono block">Total Parcels</span>
              <span className="text-xl font-bold text-white font-mono">{stats.total_parcels}</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">Covering {stats.total_area_sqkm} km²</span>
            </div>

            <div className="glass-card rounded-xl p-3 border border-red-900/40 bg-red-950/20">
              <span className="text-[10px] text-red-400 uppercase font-mono block">Critical Disputes</span>
              <span className="text-xl font-bold text-red-400 font-mono">{stats.critical_disputes}</span>
              <span className="text-[10px] text-red-300/80 block mt-0.5">Score 85–100</span>
            </div>

            <div className="glass-card rounded-xl p-3 border border-slate-800">
              <span className="text-[10px] text-gray-400 uppercase font-mono block">Approved</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">{stats.approved_count}</span>
              <span className="text-[10px] text-emerald-400/80 block mt-0.5">Authenticated</span>
            </div>

            <div className="glass-card rounded-xl p-3 border border-slate-800">
              <span className="text-[10px] text-gray-400 uppercase font-mono block">CORS Stations</span>
              <span className="text-xl font-bold text-blue-400 font-mono">{stats.cors_stations_count}</span>
              <span className="text-[10px] text-blue-400/80 block mt-0.5">Survey of India</span>
            </div>
          </div>

          {/* Priority Distribution Bar */}
          <div className="glass-card rounded-xl p-3.5 space-y-2 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span>Cadastral Verification Priority Distribution</span>
              <span className="font-mono text-gray-400 text-[10px]">Avg IoU: {stats.average_iou}</span>
            </div>

            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(stats.critical_disputes / stats.total_parcels) * 100}%` }}
                className="bg-red-500 h-full"
                title={`Critical: ${stats.critical_disputes}`}
              />
              <div
                style={{ width: `${(stats.high_priority / stats.total_parcels) * 100}%` }}
                className="bg-orange-500 h-full"
                title={`High: ${stats.high_priority}`}
              />
              <div
                style={{ width: `${(stats.moderate_priority / stats.total_parcels) * 100}%` }}
                className="bg-amber-500 h-full"
                title={`Moderate: ${stats.moderate_priority}`}
              />
              <div
                style={{ width: `${(stats.low_priority / stats.total_parcels) * 100}%` }}
                className="bg-emerald-500 h-full"
                title={`Low: ${stats.low_priority}`}
              />
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1 text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>Critical: {stats.critical_disputes}</span>
              </div>
              <div className="flex items-center gap-1.5 text-orange-400">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>High: {stats.high_priority}</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Moderate: {stats.moderate_priority}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Low: {stats.low_priority}</span>
              </div>
            </div>
          </div>

          {/* Authentic Dataset Download Box */}
          <div className="glass-card rounded-xl p-3.5 border border-cyan-500/30 bg-cyan-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                  📦 Authentic Cadastral Datasets
                </span>
                <p className="text-[10px] text-gray-300 mt-0.5">
                  Grounded on Survey of India CORS datum, GSDL/OSM urban footprints & SRTM 30m DEM
                </p>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                WGS84 / UTM 43N
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <a
                href="/api/dataset/download/geojson"
                download="naksha_cadastral_fabric.geojson"
                className="py-1.5 px-3 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-all text-center"
              >
                <span>🌐 GeoJSON Fabric</span>
              </a>

              <a
                href="/api/dataset/download/csv"
                download="naksha_cadastral_dataset.csv"
                className="py-1.5 px-3 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-all text-center"
              >
                <span>📊 ML Training CSV</span>
              </a>

              <a
                href="/api/dataset/download/json"
                download="naksha_cadastral_dataset.json"
                className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 shadow transition-all text-center"
              >
                <span>📄 Full JSON Dossier</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-cadastre-border bg-slate-900/60 flex items-center justify-between text-xs text-gray-400">
          <span>Compliant with National Geospatial Policy & DILRMP Guidelines</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
