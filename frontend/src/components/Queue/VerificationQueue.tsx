import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Filter,
  Search,
  ShieldAlert,
  ArrowUpDown,
  Radio,
  Building,
  MapPin
} from 'lucide-react';
import { ParcelDetail, PriorityBand, VerificationStatus } from '../../types';

interface VerificationQueueProps {
  queue: ParcelDetail[];
  selectedParcelId: string | null;
  onSelectParcel: (parcelId: string) => void;
  isLoading: boolean;
}

export const VerificationQueue: React.FC<VerificationQueueProps> = ({
  queue,
  selectedParcelId,
  onSelectParcel,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBand, setSelectedBand] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredQueue = queue.filter((item) => {
    const matchesSearch =
      item.parcel_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.khasra_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.revenue_ward.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBand = selectedBand === 'all' || item.priority_band === selectedBand;
    const matchesStatus = selectedStatus === 'all' || item.verification_status === selectedStatus;

    return matchesSearch && matchesBand && matchesStatus;
  });

  const getBandBadge = (band: PriorityBand, score: number) => {
    switch (band) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            CRITICAL {score}
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40">
            HIGH {score}
          </span>
        );
      case 'moderate':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
            MOD {score}
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            LOW {score}
          </span>
        );
    }
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case 'flagged':
        return (
          <span className="text-[10px] text-red-400 font-medium flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Flagged
          </span>
        );
      case 'field_verified':
        return (
          <span className="text-[10px] text-cyan-400 font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Field Verified
          </span>
        );
      default:
        return <span className="text-[10px] text-gray-400">AI Proposed</span>;
    }
  };

  return (
    <aside className="w-80 h-full flex flex-col bg-cadastre-surface border-r border-cadastre-border z-10 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-cadastre-border bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
              <ArrowUpDown className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                Verification Queue
              </h2>
              <p className="text-[10px] text-gray-400">
                Sorted by Discrepancy Priority (0–100)
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono font-semibold text-cyan-400 border border-slate-700">
            {filteredQueue.length} Parcels
          </span>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search Khasra, code or ward..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="mt-2.5 flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
          {['all', 'critical', 'high', 'moderate', 'low'].map((band) => (
            <button
              key={band}
              onClick={() => setSelectedBand(band)}
              className={`px-2 py-0.5 rounded-md capitalize font-medium transition-all ${
                selectedBand === band
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800'
              }`}
            >
              {band}
            </button>
          ))}
        </div>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            Loading Cadastral Triage Queue...
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">
            No parcels match the current filters.
          </div>
        ) : (
          filteredQueue.map((parcel) => {
            const isSelected = selectedParcelId === parcel.id;
            return (
              <div
                key={parcel.id}
                onClick={() => onSelectParcel(parcel.id)}
                className={`p-2.5 rounded-xl cursor-pointer transition-all duration-150 border ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-white">
                        {parcel.parcel_code}
                      </span>
                      {parcel.conflict?.encroachment_detected && (
                        <span className="px-1 py-0.2 rounded bg-red-950 text-red-400 text-[9px] font-semibold border border-red-800">
                          ENCROACHMENT
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-300 font-medium mt-0.5">
                      {parcel.khasra_number}
                    </div>
                  </div>
                  {getBandBadge(parcel.priority_band, parcel.priority_score)}
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Building className="w-3 h-3 text-gray-500" />
                    <span className="capitalize">{parcel.landuse_class}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {parcel.gnss_points.length > 0 && (
                      <span className="text-blue-400 flex items-center gap-0.5" title="CORS Ground Truth Station Anchor available">
                        <Radio className="w-2.5 h-2.5" /> CORS
                      </span>
                    )}
                    <span>IoU: {parcel.conflict?.iou.toFixed(2) || '1.0'}</span>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[9px] text-gray-500 truncate max-w-[140px]">
                    {parcel.revenue_ward}
                  </span>
                  {getStatusBadge(parcel.verification_status)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-cadastre-border bg-slate-950/60 text-[10px] text-gray-400 flex items-center justify-between font-mono">
        <span>DoLR DILRMP Queue</span>
        <span className="text-cyan-400">Live Sync</span>
      </div>
    </aside>
  );
};
