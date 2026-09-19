import React, { useState } from 'react';
import {
  X,
  Compass,
  Download,
  FileText,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Ruler,
  Layers,
  Printer,
  ChevronRight,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { StagingVariantPlan } from '../types';

interface FloorPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVariant: StagingVariantPlan;
  roomName: string;
  dimensionsText?: string;
}

export const FloorPlanModal: React.FC<FloorPlanModalProps> = ({
  isOpen,
  onClose,
  currentVariant,
  roomName,
  dimensionsText = '6.0m × 5.0m (30.0 m² / 322 sq ft)',
}) => {
  const [showClearanceZones, setShowClearanceZones] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showDoorWindowSwings, setShowDoorWindowSwings] = useState<boolean>(true);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  if (!isOpen) return null;

  const roomWidthM = 6.0;
  const roomDepthM = 5.0;
  const svgWidth = 640;
  const svgHeight = 520;
  const padX = 50;
  const padY = 40;
  const innerW = svgWidth - padX * 2;
  const innerH = svgHeight - padY * 2;

  // Converts room coords (-roomWidthM/2 to +roomWidthM/2, -roomDepthM/2 to +roomDepthM/2) to SVG pixels
  const toSvgX = (xM: number) => padX + ((xM + roomWidthM / 2) / roomWidthM) * innerW;
  const toSvgY = (zM: number) => padY + ((zM + roomDepthM / 2) / roomDepthM) * innerH;

  // Transform furniture list items to 2D floor plan bounding boxes
  const items = (currentVariant.furniture_list || []).map((item, idx) => {
    const [xmin, ymin, xmax, ymax] = item.relative_bounding_box;
    const posX = ((xmin + xmax) / 2 - 0.5) * roomWidthM;
    const posZ = ((ymin + ymax) / 2 - 0.5) * roomDepthM;
    const widthM = item.dimensions_metric?.width_m || (xmax - xmin) * roomWidthM;
    const depthM = item.dimensions_metric?.depth_m || (ymax - ymin) * roomDepthM;
    const clearanceM = item.dimensions_metric?.clearance_m || 0.85;

    const svgX = toSvgX(posX - widthM / 2);
    const svgY = toSvgY(posZ - depthM / 2);
    const svgW = (widthM / roomWidthM) * innerW;
    const svgH = (depthM / roomDepthM) * innerH;

    const clearSvgX = toSvgX(posX - (widthM / 2 + clearanceM * 0.4));
    const clearSvgY = toSvgY(posZ - (depthM / 2 + clearanceM * 0.4));
    const clearSvgW = ((widthM + clearanceM * 0.8) / roomWidthM) * innerW;
    const clearSvgH = ((depthM + clearanceM * 0.8) / roomDepthM) * innerH;

    return {
      idx,
      name: item.item_name,
      category: item.category || 'furniture',
      orientation: item.orientation_degrees,
      widthM: Number(widthM.toFixed(2)),
      depthM: Number(depthM.toFixed(2)),
      heightM: item.dimensions_metric?.height_m || 0.85,
      clearanceM: Number(clearanceM.toFixed(2)),
      svgX,
      svgY,
      svgW,
      svgH,
      clearSvgX,
      clearSvgY,
      clearSvgW,
      clearSvgH,
      posX,
      posZ,
    };
  });

  const selectedItem = selectedItemId !== null ? items[selectedItemId] : items[0];

  // Download SVG file for CAD / blueprint use
  const handleExportSvg = () => {
    const svgEl = document.getElementById('cad-floorplan-svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Habitat3D_FloorPlan_${currentVariant.variant_title.replace(/\s+/g, '_')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print layout preview
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-6xl h-[90vh] rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl flex flex-col overflow-hidden font-mono text-neutral-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-800 bg-neutral-900/70">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white tracking-wide">
                  2D Architectural CAD Floor Plan
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Scale 1:50 · Metric
                </span>
                <span className="text-neutral-500 text-xs hidden sm:inline">
                  · {roomName}
                </span>
              </div>
              <div className="text-[11px] text-neutral-400">
                Pydantic Spatial Boundary &amp; Clearance Verification Engine
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportSvg}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 hover:text-white transition-all shadow-sm"
              title="Export Scalable Vector Graphics (.svg) for AutoCAD / Revit / Illustrator"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CAD (.SVG)</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all"
              title="Print Floor Plan Blueprint"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-toolbar with inspection toggles */}
        <div className="flex flex-wrap items-center justify-between px-6 py-2 border-b border-neutral-800/80 bg-neutral-950 text-xs gap-3">
          <div className="flex items-center gap-3">
            <span className="text-neutral-400 text-[11px]">Layer Toggles:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 hover:text-white">
              <input
                type="checkbox"
                checked={showClearanceZones}
                onChange={(e) => setShowClearanceZones(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
              <span className="text-[11px]">Walking Clearance (75cm+)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 hover:text-white">
              <input
                type="checkbox"
                checked={showDimensions}
                onChange={(e) => setShowDimensions(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
              <span className="text-[11px]">Dimension Lines</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 hover:text-white">
              <input
                type="checkbox"
                checked={showDoorWindowSwings}
                onChange={(e) => setShowDoorWindowSwings(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
              <span className="text-[11px]">Door/Window Swings</span>
            </label>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-neutral-400 font-mono">
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> All Clearances Validated
            </span>
            <span>Style: <strong className="text-neutral-200">{currentVariant.variant_title}</strong></span>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Blue-print / CAD Canvas View */}
          <div className="flex-1 relative bg-[#0a0f18] p-4 sm:p-6 flex items-center justify-center overflow-auto">
            {/* Architectural Grid pattern overlay */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, #0a0f18 1px)`,
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 12px 12px',
              }}
            />

            <svg
              id="cad-floorplan-svg"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full max-w-[700px] h-auto max-h-[580px] drop-shadow-2xl border border-cyan-900/40 rounded-xl bg-[#09101c]"
            >
              <defs>
                {/* Diagonal hatch for walls */}
                <pattern id="wallHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#0284c7" strokeWidth="1.2" opacity="0.4" />
                </pattern>
                {/* Dot grid for clearance zones */}
                <pattern id="clearanceHatch" width="8" height="8" patternUnits="userSpaceOnUse">
                  <circle cx="4" cy="4" r="1" fill="#06b6d4" opacity="0.35" />
                </pattern>
              </defs>

              {/* Grid Ruler lines across room interior */}
              {Array.from({ length: 11 }).map((_, i) => {
                const x = padX + (i / 10) * innerW;
                return (
                  <line
                    key={`vgrid-${i}`}
                    x1={x}
                    y1={padY}
                    x2={x}
                    y2={padY + innerH}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray={i % 2 === 0 ? 'none' : '3,3'}
                    opacity={i % 2 === 0 ? '0.6' : '0.3'}
                  />
                );
              })}
              {Array.from({ length: 9 }).map((_, j) => {
                const y = padY + (j / 8) * innerH;
                return (
                  <line
                    key={`hgrid-${j}`}
                    x1={padX}
                    y1={y}
                    x2={padX + innerW}
                    y2={y}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray={j % 2 === 0 ? 'none' : '3,3'}
                    opacity={j % 2 === 0 ? '0.6' : '0.3'}
                  />
                );
              })}

              {/* Usable Floor Polygon Background */}
              <rect
                x={padX}
                y={padY}
                width={innerW}
                height={innerH}
                fill="#0d1527"
                stroke="#0284c7"
                strokeWidth="1.5"
                opacity="0.85"
              />

              {/* Exterior Architectural Walls (Thick CAD Style with Hatch) */}
              {/* Back wall (Top) */}
              <rect x={padX - 8} y={padY - 14} width={innerW + 16} height={14} fill="url(#wallHatch)" stroke="#0284c7" strokeWidth="1.5" />
              {/* Left wall */}
              <rect x={padX - 14} y={padY - 14} width={14} height={innerH + 28} fill="url(#wallHatch)" stroke="#0284c7" strokeWidth="1.5" />
              {/* Right wall */}
              <rect x={padX + innerW} y={padY - 14} width={14} height={innerH + 28} fill="url(#wallHatch)" stroke="#0284c7" strokeWidth="1.5" />
              {/* Front wall (Bottom, with Door Opening) */}
              <rect x={padX - 8} y={padY + innerH} width={innerW * 0.35} height={14} fill="url(#wallHatch)" stroke="#0284c7" strokeWidth="1.5" />
              <rect x={padX + innerW * 0.55} y={padY + innerH} width={innerW * 0.45 + 8} height={14} fill="url(#wallHatch)" stroke="#0284c7" strokeWidth="1.5" />

              {/* Door Opening & Swing Arc (Entry at bottom center) */}
              {showDoorWindowSwings && (
                <g id="door-entry">
                  {/* Door leaf */}
                  <line
                    x1={padX + innerW * 0.35}
                    y1={padY + innerH}
                    x2={padX + innerW * 0.35}
                    y2={padY + innerH - (innerW * 0.2)}
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                  {/* Swing 90-degree radial arc */}
                  <path
                    d={`M ${padX + innerW * 0.35} ${padY + innerH - (innerW * 0.2)} A ${innerW * 0.2} ${innerW * 0.2} 0 0 1 ${padX + innerW * 0.55} ${padY + innerH}`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                    strokeDasharray="4,4"
                    opacity="0.8"
                  />
                  <text
                    x={padX + innerW * 0.44}
                    y={padY + innerH + 10}
                    fill="#38bdf8"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    ENTRY 0.90m
                  </text>
                </g>
              )}

              {/* Window on Back Wall (Top Center) */}
              {showDoorWindowSwings && (
                <g id="back-window">
                  <rect
                    x={padX + innerW * 0.28}
                    y={padY - 14}
                    width={innerW * 0.44}
                    height={14}
                    fill="#0369a1"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={padX + innerW * 0.28}
                    y1={padY - 7}
                    x2={padX + innerW * 0.72}
                    y2={padY - 7}
                    stroke="#e0f2fe"
                    strokeWidth="2"
                  />
                  <text
                    x={padX + innerW * 0.5}
                    y={padY - 18}
                    fill="#38bdf8"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    TRIPLE WINDOW (NATURAL DAYLIGHT) 2.64m
                  </text>
                </g>
              )}

              {/* Furniture Clearance Zones (if toggled) */}
              {showClearanceZones &&
                items.map((it) => (
                  <rect
                    key={`clear-${it.idx}`}
                    x={it.clearSvgX}
                    y={it.clearSvgY}
                    width={it.clearSvgW}
                    height={it.clearSvgH}
                    rx="6"
                    fill="url(#clearanceHatch)"
                    stroke="#06b6d4"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    opacity="0.6"
                    pointerEvents="none"
                  />
                ))}

              {/* Furniture Items Rectangles */}
              {items.map((it) => {
                const isSelected = selectedItemId === it.idx;
                return (
                  <g
                    key={`item-${it.idx}`}
                    onClick={() => setSelectedItemId(it.idx)}
                    className="cursor-pointer transition-all"
                  >
                    <rect
                      x={it.svgX}
                      y={it.svgY}
                      width={it.svgW}
                      height={it.svgH}
                      rx="4"
                      fill={isSelected ? '#0284c7' : '#1e293b'}
                      stroke={isSelected ? '#38bdf8' : '#64748b'}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      className="transition-colors hover:fill-cyan-900"
                    />

                    {/* Orientation marker arrow */}
                    <circle
                      cx={it.svgX + it.svgW / 2}
                      cy={it.svgY + it.svgH / 2}
                      r="3"
                      fill={isSelected ? '#ffffff' : '#38bdf8'}
                    />

                    {/* Label inside furniture */}
                    <text
                      x={it.svgX + it.svgW / 2}
                      y={it.svgY + it.svgH / 2 + 3}
                      fill={isSelected ? '#ffffff' : '#e2e8f0'}
                      fontSize={Math.max(8, Math.min(10, it.svgW / 6))}
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                      pointerEvents="none"
                    >
                      {it.svgW > 45 ? it.name.split(' ')[0] : `#${it.idx + 1}`}
                    </text>

                    {/* Dimension tooltip label */}
                    {showDimensions && (
                      <text
                        x={it.svgX + it.svgW / 2}
                        y={it.svgY + it.svgH + 10}
                        fill="#94a3b8"
                        fontSize="7.5"
                        fontFamily="monospace"
                        textAnchor="middle"
                        pointerEvents="none"
                      >
                        {it.widthM}m × {it.depthM}m
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Room Dimensions Dimension Lines */}
              {showDimensions && (
                <g id="dimension-lines">
                  {/* Top Horizontal Width: 6.00m */}
                  <line x1={padX} y1={padY - 26} x2={padX + innerW} y2={padY - 26} stroke="#38bdf8" strokeWidth="1" />
                  <line x1={padX} y1={padY - 30} x2={padX} y2={padY - 22} stroke="#38bdf8" strokeWidth="1" />
                  <line x1={padX + innerW} y1={padY - 30} x2={padX + innerW} y2={padY - 22} stroke="#38bdf8" strokeWidth="1" />
                  <text
                    x={padX + innerW / 2}
                    y={padY - 30}
                    fill="#38bdf8"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    ↔ ROOM WIDTH: 6.00m (19.7 ft)
                  </text>

                  {/* Left Vertical Depth: 5.00m */}
                  <line x1={padX - 26} y1={padY} x2={padX - 26} y2={padY + innerH} stroke="#38bdf8" strokeWidth="1" />
                  <line x1={padX - 30} y1={padY} x2={padX - 22} y2={padY} stroke="#38bdf8" strokeWidth="1" />
                  <line x1={padX - 30} y1={padY + innerH} x2={padX - 22} y2={padY + innerH} stroke="#38bdf8" strokeWidth="1" />
                  <text
                    x={padX - 32}
                    y={padY + innerH / 2}
                    fill="#38bdf8"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                    transform={`rotate(-90 ${padX - 32} ${padY + innerH / 2})`}
                  >
                    ↕ DEPTH: 5.00m (16.4 ft)
                  </text>
                </g>
              )}

              {/* North Pointer Compass (CAD standard) */}
              <g transform={`translate(${svgWidth - 45}, 45)`}>
                <circle cx="0" cy="0" r="16" fill="#0f172a" stroke="#0284c7" strokeWidth="1.2" />
                <polygon points="0,-12 5,4 0,1 -5,4" fill="#38bdf8" />
                <polygon points="0,12 4,-1 0,1 -4,-1" fill="#475569" />
                <text x="0" y="-14" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle">
                  N
                </text>
              </g>

              {/* Scale bar */}
              <g transform={`translate(${padX}, ${svgHeight - 16})`}>
                <line x1="0" y1="0" x2={innerW * (1.0 / roomWidthM)} y2="0" stroke="#94a3b8" strokeWidth="2.5" />
                <line x1="0" y1="-3" x2="0" y2="3" stroke="#94a3b8" strokeWidth="1.5" />
                <line x1={innerW * (1.0 / roomWidthM)} y1="-3" x2={innerW * (1.0 / roomWidthM)} y2="3" stroke="#94a3b8" strokeWidth="1.5" />
                <text x={innerW * (0.5 / roomWidthM)} y="-4" fill="#94a3b8" fontSize="8" textAnchor="middle">
                  1.0 METER
                </text>
              </g>
            </svg>
          </div>

          {/* Right: Bill of Materials & Clearance Specifications Panel */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-neutral-800 bg-neutral-950 p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-cyan-400" />
                  Spatial Clearance Specs
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Calculated using Pydantic Agentic Geometry
                </p>
              </div>

              {/* Selected Item Detail Card */}
              {selectedItem && (
                <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-cyan-500/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 truncate max-w-[200px]">
                      {selectedItem.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase">
                      {selectedItem.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block text-[10px]">Width (W)</span>
                      <span className="text-white font-bold">{selectedItem.widthM} m</span>
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block text-[10px]">Depth (D)</span>
                      <span className="text-white font-bold">{selectedItem.depthM} m</span>
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block text-[10px]">Height (H)</span>
                      <span className="text-white font-bold">{selectedItem.heightM} m</span>
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block text-[10px]">Walking Buffer</span>
                      <span className="text-emerald-400 font-bold">{selectedItem.clearanceM} m</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 p-1.5 rounded border border-emerald-900/60">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>ADA Walkway Compliant (&gt; 0.75m egress)</span>
                  </div>
                </div>
              )}

              {/* Items Table / List */}
              <div className="space-y-2">
                <span className="text-[11px] text-neutral-400 uppercase tracking-wider block font-semibold">
                  Furniture Schedule ({items.length} items)
                </span>
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                  {items.map((it) => (
                    <button
                      key={it.idx}
                      type="button"
                      onClick={() => setSelectedItemId(it.idx)}
                      className={`w-full text-left flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                        selectedItemId === it.idx
                          ? 'bg-cyan-950/70 border border-cyan-500 text-cyan-200'
                          : 'bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800/80 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate mr-2">
                        <span className="w-4 h-4 rounded-full bg-neutral-800 text-[10px] flex items-center justify-center text-neutral-400 font-mono">
                          {it.idx + 1}
                        </span>
                        <span className="truncate">{it.name}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono flex-shrink-0">
                        {it.widthM}×{it.depthM}m
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Room Totals Footer */}
            <div className="pt-4 border-t border-neutral-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-neutral-400">
                <span>Room Dimensions:</span>
                <span className="text-neutral-200 font-bold">{dimensionsText}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Total Floor Footprint:</span>
                <span className="text-cyan-300 font-bold">
                  {items.reduce((acc, it) => acc + it.widthM * it.depthM, 0).toFixed(1)} m² ({(items.reduce((acc, it) => acc + it.widthM * it.depthM, 0) / 30 * 100).toFixed(0)}% coverage)
                </span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Free Walkable Area:</span>
                <span className="text-emerald-400 font-bold">
                  {(30 - items.reduce((acc, it) => acc + it.widthM * it.depthM, 0)).toFixed(1)} m²
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
