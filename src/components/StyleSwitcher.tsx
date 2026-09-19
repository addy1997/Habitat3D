import React from 'react';
import { Briefcase, Baby, BedDouble, CheckCircle2 } from 'lucide-react';
import { StagingVariantPlan } from '../types';

interface StyleSwitcherProps {
  variants: StagingVariantPlan[];
  selectedVariantIndex: number;
  onSelectVariant: (index: number) => void;
  crossFading: boolean;
}

export const StyleSwitcher: React.FC<StyleSwitcherProps> = ({
  variants,
  selectedVariantIndex,
  onSelectVariant,
  crossFading,
}) => {
  const getIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('office')) return <Briefcase className="w-4 h-4" />;
    if (lower.includes('nursery') || lower.includes('kid')) return <Baby className="w-4 h-4" />;
    return <BedDouble className="w-4 h-4" />;
  };

  const getEmoji = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('office')) return '💼';
    if (lower.includes('nursery') || lower.includes('kid')) return '👶';
    return '🛏️';
  };

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-auto">
      {/* Fast cross-fade status */}
      <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-neutral-950/70 border border-neutral-800 text-[11px] font-mono text-neutral-400 backdrop-blur-md">
        <span className={`w-1.5 h-1.5 rounded-full ${crossFading ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
        <span>Photorealistic 3D Spatial Staging · Synced Viewports</span>
      </div>

      {/* Floating Style Action Pills */}
      <div
        id="floating-style-switcher"
        className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-neutral-950/85 backdrop-blur-xl border border-neutral-800/90 shadow-2xl shadow-black/80"
      >
        {variants.map((v, index) => {
          const isSelected = index === selectedVariantIndex;
          return (
            <button
              key={v.variant_title}
              id={`style-pill-${index}`}
              type="button"
              onClick={() => onSelectVariant(index)}
              className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 select-none ${
                isSelected
                  ? 'bg-neutral-100 text-neutral-950 shadow-md font-semibold scale-102'
                  : 'bg-neutral-900/60 hover:bg-neutral-800/80 text-neutral-300 hover:text-white border border-transparent'
              }`}
            >
              <span className="text-base leading-none">{getEmoji(v.variant_title)}</span>
              <span className="whitespace-nowrap">{v.variant_title}</span>
              {isSelected && (
                <span className="flex items-center text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-900 font-mono font-bold">
                  ACTIVE
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
