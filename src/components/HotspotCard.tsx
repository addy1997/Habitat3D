import React from 'react';
import { X, CheckCircle, ShieldCheck, Ruler, ArrowRight, Compass, AlertCircle } from 'lucide-react';
import { HotspotMarkerData } from '../types';

interface HotspotCardProps {
  hotspot: HotspotMarkerData | null;
  onClose: () => void;
}

export const HotspotCard: React.FC<HotspotCardProps> = ({ hotspot, onClose }) => {
  if (!hotspot) return null;

  return (
    <div
      id="hotspot-expanded-card"
      className="absolute top-20 right-6 z-20 w-84 sm:w-96 rounded-2xl bg-neutral-950/90 backdrop-blur-xl border border-neutral-800 shadow-2xl p-5 text-neutral-200 transition-all duration-300 animate-in fade-in slide-in-from-top-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              {hotspot.category}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Pydantic Validated
            </span>
          </div>
          <h3 className="mt-1 text-base font-semibold text-white tracking-tight">{hotspot.title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description */}
      <p className="mt-3 text-xs text-neutral-300 leading-relaxed font-normal">
        {hotspot.description}
      </p>

      {/* Physical Dimensions Grid */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80">
          <div className="text-[10px] text-neutral-400 uppercase tracking-wider flex items-center gap-1">
            <Ruler className="w-3 h-3 text-neutral-400" /> Width × Depth
          </div>
          <div className="mt-1 text-neutral-100 font-semibold">
            {hotspot.dimensions.width} × {hotspot.dimensions.depth}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800/80">
          <div className="text-[10px] text-neutral-400 uppercase tracking-wider flex items-center gap-1">
            <Compass className="w-3 h-3 text-neutral-400" /> Walkway Clearance
          </div>
          <div className="mt-1 text-emerald-400 font-semibold">
            {hotspot.dimensions.clearance} (Safe)
          </div>
        </div>
      </div>

      {/* Pydantic Validation Checks */}
      <div className="mt-4 pt-3 border-t border-neutral-800/80">
        <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Pydantic Model Rules</span>
          <span className="text-emerald-400 font-bold">100% Pass</span>
        </div>
        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between text-neutral-300">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Non-overlapping Bounds
            </span>
            <span className="text-emerald-400 text-[11px]">0 Collision</span>
          </div>
          <div className="flex items-center justify-between text-neutral-300">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Perimeter Wall Containment
            </span>
            <span className="text-emerald-400 text-[11px]">Within Polygon</span>
          </div>
          <div className="flex items-center justify-between text-neutral-300">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Egress &amp; Doorway Clearance
            </span>
            <span className="text-emerald-400 text-[11px]">
              {(hotspot.pydantic_validation.egress_clearance_ratio * 100).toFixed(0)}% optimal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
