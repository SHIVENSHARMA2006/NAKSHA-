import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  History,
  CheckCircle2,
  Edit3,
  MapPin,
  Radio,
  FileText,
  Zap,
  ChevronRight,
  Fingerprint,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ParcelDetail, AuditLogEntry } from '../../types';

interface ParcelInspectorDrawerProps {
  parcel: ParcelDetail | null;
  onClose: () => void;
  onVerify: (action: string, notes?: string) => Promise<void>;
  onSnapGNSS: () => Promise<void>;
  auditLogs: AuditLogEntry[];
  isSubmitting: boolean;
}

export const ParcelInspectorDrawer: React.FC<ParcelInspectorDrawerProps> = ({
  parcel,
  onClose,
  onVerify,
  onSnapGNSS,
  auditLogs,
  isSubmitting
}) => {
  const [activeTab, setActiveTab] = useState<'discrepancy' | 'audit'>('discrepancy');
  const [surveyorNotes, setSurveyorNotes] = useState('');
  const [showNotesField, setShowNotesField] = useState(false);

  if (!parcel) return null;

  const handleAction = async (action: string) => {
    await onVerify(action, surveyorNotes);
    if (action === 'approve' || action === 'approve_with_edit') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10B981', '#06B6D4', '#3B82F6']
      });
    }
    setSurveyorNotes('');
    setShowNotesField(false);
  };

  const why = parcel.why_flagged || {
    conflict_severity: 0,
    seg_uncertainty: 0,
    gnss_score: 50,
    landuse_uncertainty: 10
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'severe':
        return <span className="text-red-400 font-bold uppercase text-[10px]">Severe Conflict</span>;
      case 'moderate':
        return <span className="text-amber-400 font-bold uppercase text-[10px]">Moderate Conflict</span>;
      default:
        return <span className="text-emerald-400 font-bold uppercase text-[10px]">Minor / Concordant</span>;
    }
  };

  return (
    <aside className="w-96 h-full flex flex-col bg-cadastre-surface border-l border-cadastre-border z-20 shadow-2xl select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-cadastre-border bg-slate-900/80 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold text-white tracking-wide">
              {parcel.parcel_code}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                parcel.priority_band === 'critical'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : parcel.priority_band === 'high'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : parcel.priority_band === 'moderate'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              Priority Score: {parcel.priority_score}
            </span>
          </div>
          <p className="text-[11px] text-gray-300 font-medium mt-0.5">
            {parcel.khasra_number} • {parcel.revenue_ward}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-cadastre-border bg-slate-950/40 text-xs">
        <button
          onClick={() => setActiveTab('discrepancy')}
          className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 font-medium transition-all ${
            activeTab === 'discrepancy'
              ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-950/20'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Discrepancy Studio
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 font-medium transition-all ${
            activeTab === 'audit'
              ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-950/20'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
        {activeTab === 'discrepancy' ? (
          <>
            {/* Surveyor Recommendation Banner */}
            <div
              className={`p-3 rounded-xl border ${
                parcel.priority_band === 'critical'
                  ? 'bg-red-950/20 border-red-500/40 text-red-200'
                  : parcel.priority_band === 'high'
                  ? 'bg-orange-950/20 border-orange-500/40 text-orange-200'
                  : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Cadastral AI Recommendation</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-95">
                {parcel.recommendation}
              </p>
            </div>

            {/* Explainability Breakdown (Section 8.5 WHY FLAGGED?) */}
            <div className="glass-card rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1 font-mono uppercase tracking-wide">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Signal Fusion Breakdown
                </span>
                <span className="text-[10px] text-gray-400">Formula 8.4</span>
              </div>

              {/* Conflict Severity Bar (35%) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-300">Legacy Conflict (35% wt):</span>
                  <span className="font-mono font-bold text-red-400">
                    {why.conflict_severity} / 100
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{ width: `${why.conflict_severity}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] text-gray-400 font-mono">
                  <span>IoU: {parcel.conflict?.iou.toFixed(2) || '1.0'}</span>
                  <span>Hausdorff Drift: {parcel.conflict?.hausdorff_distance_m || 0}m</span>
                </div>
              </div>

              {/* Segmentation Uncertainty Bar (30%) */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-300">Model Uncertainty (30% wt):</span>
                  <span className="font-mono font-bold text-orange-400">
                    {why.seg_uncertainty} / 100
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-400 rounded-full transition-all"
                    style={{ width: `${why.seg_uncertainty}%` }}
                  />
                </div>
                <div className="text-[9px] text-gray-400 font-mono">
                  CV Mask Confidence: {(parcel.segmentation_confidence * 100).toFixed(0)}%
                </div>
              </div>

              {/* GNSS Ground Truth Residual (20%) */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-300">GNSS Survey Anchor (20% wt):</span>
                  <span className="font-mono font-bold text-blue-400">
                    {why.gnss_score} / 100
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${why.gnss_score}%` }}
                  />
                </div>
                <div className="text-[9px] text-gray-400 font-mono">
                  {parcel.gnss_points.length > 0
                    ? `CORS station available (residual: ${parcel.gnss_points[0].residual_m}m)`
                    : 'No survey pillar within 25m (neutral penalty: 50)'}
                </div>
              </div>

              {/* Land-Use Ambiguity (15%) */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-300">Land-Use Ambiguity (15% wt):</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {why.landuse_uncertainty} / 100
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${why.landuse_uncertainty}%` }}
                  />
                </div>
                <div className="text-[9px] text-gray-400 font-mono capitalize">
                  Class: {parcel.landuse_class} ({(parcel.landuse_confidence * 100).toFixed(0)}% sure)
                </div>
              </div>
            </div>

            {/* Geometric Attribute Cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="glass-card rounded-xl p-2.5">
                <span className="text-[10px] text-gray-400 uppercase font-mono block">Calculated Area</span>
                <span className="text-sm font-bold text-white font-mono">{parcel.area_sqm} m²</span>
                <span className="text-[9px] text-gray-500 block mt-0.5">Approx {(parcel.area_sqm * 0.000247).toFixed(3)} Acres</span>
              </div>
              <div className="glass-card rounded-xl p-2.5">
                <span className="text-[10px] text-gray-400 uppercase font-mono block">Building Structure</span>
                <span className="text-sm font-bold text-white font-mono">{parcel.floors} Floors ({parcel.height_m}m)</span>
                <span className="text-[9px] text-gray-500 block mt-0.5">DSM Height Delta</span>
              </div>
            </div>

            {/* GNSS Ground Truth Snapping Action */}
            {parcel.gnss_points.length > 0 && (
              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/40">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-300">
                    <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
                    <span>CORS Station Anchor</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">
                    ±{parcel.gnss_points[0].accuracy_cm}cm accuracy
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 mb-2">
                  Survey of India reference pillar <span className="font-semibold text-white">{parcel.gnss_points[0].station_name}</span> detected within 25m.
                </p>
                <button
                  onClick={onSnapGNSS}
                  disabled={isSubmitting}
                  className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Snap AI Vertex to CORS Point
                </button>
              </div>
            )}

            {/* Surveyor Verification Actions */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                  Surveyor Action
                </span>
                <button
                  onClick={() => setShowNotesField(!showNotesField)}
                  className="text-[10px] text-cyan-400 hover:underline"
                >
                  {showNotesField ? 'Hide Notes' : '+ Add Legal Note'}
                </button>
              </div>

              {showNotesField && (
                <textarea
                  rows={2}
                  placeholder="Enter cadastral justification, khasra reference, or field observation..."
                  value={surveyorNotes}
                  onChange={(e) => setSurveyorNotes(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAction('approve')}
                  disabled={isSubmitting}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve As-Is
                </button>

                <button
                  onClick={() => handleAction('approve_with_edit')}
                  disabled={isSubmitting}
                  className="py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                >
                  <Edit3 className="w-4 h-4" />
                  Approve with Edit
                </button>

                <button
                  onClick={() => handleAction('flag_for_field')}
                  disabled={isSubmitting}
                  className="py-2 px-3 rounded-xl bg-orange-600/80 hover:bg-orange-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                >
                  <MapPin className="w-4 h-4" />
                  Dispatch Ground Team
                </button>

                <button
                  onClick={() => handleAction('reject')}
                  disabled={isSubmitting}
                  className="py-2 px-3 rounded-xl bg-red-900/60 hover:bg-red-800 text-red-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-red-700/50 shadow-md transition-all disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Reject Proposal
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Audit History Tab */
          <div className="space-y-2.5">
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-gray-300">
              <div className="flex items-center gap-1 text-cyan-400 font-semibold mb-1">
                <Fingerprint className="w-3.5 h-3.5" />
                Immutable Cadastral Ledger
              </div>
              Every AI proposal, human surveyor alteration, and legal approval is cryptographically logged with actor, timestamp, and coordinates.
            </div>

            {auditLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">
                No human verification actions recorded yet for this parcel.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs font-sans"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white capitalize">{log.action.replace('_', ' ')}</span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[11px] text-cyan-300 font-medium">
                    Actor: {log.actor}
                  </div>
                  {log.notes && (
                    <div className="text-[11px] text-gray-300 italic bg-slate-950/60 p-1.5 rounded border border-slate-850">
                      "{log.notes}"
                    </div>
                  )}
                  <div className="pt-1 text-[9px] font-mono text-gray-500 break-all truncate">
                    Hash: {log.hash_signature}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
