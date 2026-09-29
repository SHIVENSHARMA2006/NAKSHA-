import React, { useState } from 'react';
import {
  X,
  Play,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Target
} from 'lucide-react';

interface DemoFlowGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectParcel: (parcelId: string) => void;
  onToggleLegacy: (show: boolean) => void;
  onToggleCORS: (show: boolean) => void;
  onToggleRoads: (show: boolean) => void;
  onOpenFieldApp: () => void;
  onOpenStats: () => void;
  onSnapGNSS: () => Promise<void>;
  onVerify: (action: string) => Promise<void>;
}

export const DemoFlowGuide: React.FC<DemoFlowGuideProps> = ({
  isOpen,
  onClose,
  onSelectParcel,
  onToggleLegacy,
  onToggleCORS,
  onToggleRoads,
  onOpenFieldApp,
  onOpenStats,
  onSnapGNSS,
  onVerify
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: "1. AOI Cadastral Overview & Priority Triage",
      desc: "The system loads high-resolution imagery of the Delhi-NCR urban AOI with all extracted cadastral fabric parcels color-coded by their Verification Priority Score (0–100).",
      actionLabel: "Show All Overlays",
      action: () => {
        onToggleLegacy(true);
        onToggleCORS(true);
      }
    },
    {
      step: 2,
      title: "2. The Verification Priority Queue",
      desc: "Notice the sidebar queue ranked in real time: critical boundary disputes appear at the very top (red badges 85–100), ensuring field surveyors never waste time on concordant boundaries.",
      actionLabel: "Highlight Critical Queue",
      action: () => {
        // queue highlighted
      }
    },
    {
      step: 3,
      title: "3. Inspect Flagship Discrepancy (AOI-0341)",
      desc: "Selecting parcel AOI-0341 opens the deep Discrepancy Studio. Visually observe the cyan AI boundary, purple dashed legacy record, and the blue Survey of India CORS anchor pin.",
      actionLabel: "Inspect AOI-0341",
      action: () => {
        onSelectParcel("AOI-0341");
        onToggleLegacy(true);
        onToggleCORS(true);
      }
    },
    {
      step: 4,
      title: "4. Explainable Multi-Signal Fusion",
      desc: "Formula 8.4 in action: IoU 0.42 and 6.8m Hausdorff drift (35% weight) + model uncertainty (30% weight) + CORS ground truth residual (20% weight) = 87/100 Critical Score.",
      actionLabel: "View Fusion Radar",
      action: () => {}
    },
    {
      step: 5,
      title: "5. Ground Truth Anchoring (GNSS Snap)",
      desc: "CORS station DLHI-04 is nearby! Click below to execute an automated vertex snap to the sub-meter ground truth reference pillar.",
      actionLabel: "⚡ Snap Vertex to CORS Anchor",
      action: async () => {
        await onSnapGNSS();
      }
    },
    {
      step: 6,
      title: "6. Official Sign-Off (Approve with Edit)",
      desc: "The surveyor authenticates the adjusted boundary. Every geometric shift is cryptographically recorded with SHA-256 signatures in the immutable audit log.",
      actionLabel: "✓ Approve & Authenticate",
      action: async () => {
        await onVerify("approve_with_edit");
      }
    },
    {
      step: 7,
      title: "7. Live Queue Re-Sorting Over WebSocket",
      desc: "Observe the live verification queue update immediately over WebSockets: AOI-0341 drops out of the critical band and is marked as approved!",
      actionLabel: "Observe Synced State",
      action: () => {}
    },
    {
      step: 8,
      title: "8. Access Corridors & Land-Use Breadth",
      desc: "Toggle road centerline networks and land-use classifications to demonstrate comprehensive cadastral fabric intelligence beyond simple building polygons.",
      actionLabel: "Toggle Road Corridors",
      action: () => {
        onToggleRoads(true);
      }
    },
    {
      step: 9,
      title: "9. On-Site Surveyor Mobile App (PWA)",
      desc: "Launch the Field Verification App simulation showing live GPS rover positioning, ground truth confirmation, and camera geotagging for on-site surveyors.",
      actionLabel: "📱 Launch Mobile Field App",
      action: () => {
        onOpenFieldApp();
      }
    },
    {
      step: 10,
      title: "10. The Bottom-Line Triage Metric",
      desc: "Open the Executive Analytics: In this entire AOI, only ~12% of parcels required human ground visits. 88% were safely fast-tracked. That is the core value proposition of NAKSHA-AI!",
      actionLabel: "📊 Open Executive Triage Dashboard",
      action: () => {
        onOpenStats();
      }
    }
  ];

  const current = steps[currentStep - 1];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-md animate-in slide-in-from-bottom duration-300">
      <div className="glass-panel rounded-2xl shadow-2xl border border-cyan-500/40 p-4 bg-slate-950/90 text-white backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              SIH 2026 Interactive Demo Flow
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-gray-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
              Step {currentStep} of {steps.length}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="py-3.5 space-y-2.5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            {current.title}
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            {current.desc}
          </p>

          {/* Action Trigger Button */}
          {current.actionLabel && (
            <div className="pt-1">
              <button
                onClick={current.action}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {current.actionLabel}
              </button>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-gray-300 flex items-center gap-1 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <div className="flex items-center gap-1">
            {steps.map((s) => (
              <span
                key={s.step}
                className={`w-1.5 h-1.5 rounded-full ${
                  s.step === currentStep ? 'bg-cyan-400 w-3' : 'bg-slate-700'
                } transition-all`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={currentStep === steps.length}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1 disabled:opacity-40 transition-colors"
          >
            Next Step
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
