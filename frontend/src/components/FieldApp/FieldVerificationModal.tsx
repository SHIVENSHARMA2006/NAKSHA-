import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Navigation,
  CheckCircle2,
  Camera,
  MapPin,
  ShieldAlert,
  Wifi,
  Radio,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ParcelDetail } from '../../types';

interface FieldVerificationModalProps {
  parcel: ParcelDetail | null;
  onClose: () => void;
  onFieldConfirm: (parcelId: string, notes: string) => Promise<void>;
  isSubmitting: boolean;
}

export const FieldVerificationModal: React.FC<FieldVerificationModalProps> = ({
  parcel,
  onClose,
  onFieldConfirm,
  isSubmitting
}) => {
  const [fieldNote, setFieldNote] = useState('');
  const [photoTaken, setPhotoTaken] = useState(false);
  const [simulatedGPSAccuracy, setSimulatedGPSAccuracy] = useState('0.4m (RTK-CORS Fix)');

  if (!parcel) return null;

  const handleConfirm = async () => {
    await onFieldConfirm(parcel.id, fieldNote || 'On-site boundary stones confirmed with CORS RTK fix.');
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-sm rounded-[38px] bg-slate-950 border-4 border-slate-700 shadow-2xl p-3 text-white overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Smartphone Notch / Camera */}
        <div className="w-32 h-4 bg-slate-900 mx-auto rounded-full mb-3 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-800"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60"></div>
        </div>

        {/* Mobile Header Bar */}
        <div className="px-3 pb-2 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-mono text-cyan-400 font-bold">
            <Smartphone className="w-3.5 h-3.5" />
            <span>NAKSHA Field PWA</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <Wifi className="w-2.5 h-2.5" /> Online
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Viewport Body */}
        <div className="p-3 space-y-3 max-h-[520px] overflow-y-auto">
          {/* Surveyor GPS Beacon */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 animate-pulse">
                <Navigation className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase block">Active GNSS Rover</span>
                <span className="text-xs font-bold text-white font-mono">{simulatedGPSAccuracy}</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              CONNECTED
            </span>
          </div>

          {/* Target Parcel Card */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white font-mono">{parcel.parcel_code}</span>
                <div className="text-[11px] text-gray-300 font-medium">{parcel.khasra_number}</div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  parcel.priority_band === 'critical'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}
              >
                Discrepancy: {parcel.priority_score}
              </span>
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed border-t border-slate-800 pt-2">
              <strong className="text-cyan-400">Ground Instruction:</strong> Verify boundary discrepancy along northern/eastern pegs. Compare physical boundary wall against legacy record ({parcel.conflict?.hausdorff_distance_m}m drift).
            </p>
          </div>

          {/* Photo Geotag Capture Simulator */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                Geotagged Boundary Evidence
              </span>
              <span className="text-[10px] font-mono text-gray-500">EXIF GPS</span>
            </div>

            {photoTaken ? (
              <div className="relative rounded-xl overflow-hidden border border-emerald-500/50 bg-slate-950 p-2 text-center text-xs text-emerald-300">
                <div className="text-[10px] font-mono text-emerald-400">✓ 1 Geotagged Ground Image Attached</div>
                <div className="text-[9px] text-gray-400 font-mono mt-0.5">LAT: 28.62714° N • LON: 77.21731° E</div>
              </div>
            ) : (
              <button
                onClick={() => setPhotoTaken(true)}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-gray-300 flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-gray-400" />
                Simulate Camera Capture
              </button>
            )}
          </div>

          {/* Field Notes Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-gray-400 block">
              On-Ground Inspection Notes
            </label>
            <textarea
              rows={2}
              value={fieldNote}
              onChange={(e) => setFieldNote(e.target.value)}
              placeholder="e.g. Boundary wall matches AI polygon. Legacy pillar was displaced by road widening..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Confirm Button */}
          <div className="pt-2">
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm & Sync to Cadastre
            </button>
          </div>
        </div>

        {/* Mobile Home Bar */}
        <div className="w-24 h-1 bg-slate-800 mx-auto rounded-full mt-3 mb-1"></div>
      </div>
    </div>
  );
};
