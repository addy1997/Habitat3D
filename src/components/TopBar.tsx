import React from 'react';
import { Activity, Cpu, Sparkles, MessageSquare, Upload, Maximize2, RotateCcw, Box } from 'lucide-react';

interface TopBarProps {
  logfireActive: boolean;
  onOpenLogfire: () => void;
  onOpenModalGpu: () => void;
  onOpenChat: () => void;
  onOpenUpload: () => void;
  onResetCamera: () => void;
  showBoundingBoxes: boolean;
  onToggleBoundingBoxes: () => void;
  currentRoomName: string;
  isProcessing: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  logfireActive,
  onOpenLogfire,
  onOpenModalGpu,
  onOpenChat,
  onOpenUpload,
  onResetCamera,
  showBoundingBoxes,
  onToggleBoundingBoxes,
  currentRoomName,
  isProcessing,
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/80 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-mono text-lg font-bold tracking-tight">✦</span>
          <span className="font-mono text-sm sm:text-base font-semibold tracking-wider text-neutral-100 uppercase">
            HABITAT 3D
          </span>
        </div>
        <div className="hidden md:flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400">
          v2.4 · 3D Gaussian Splats
        </div>
        <div className="hidden lg:flex items-center text-xs text-neutral-400 truncate max-w-xs font-mono">
          <span className="text-neutral-600 mr-1">/</span>
          {currentRoomName}
        </div>
      </div>

      {/* Center status for processing */}
      {isProcessing && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 text-xs font-mono animate-pulse">
          <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          <span>Gemini Spatial Reasoning &amp; Modal.map dispatching...</span>
        </div>
      )}

      {/* Right Controls & Status Badges */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Wireframe Bounding Box Toggle */}
        <button
          id="btn-toggle-bounding-boxes"
          type="button"
          onClick={onToggleBoundingBoxes}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
            showBoundingBoxes
              ? 'bg-amber-950/50 border-amber-500/50 text-amber-300'
              : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
          }`}
          title="Toggle Pydantic 3D Bounding Boxes"
        >
          <Box className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pydantic Bounds</span>
        </button>

        {/* Modal GPU Cluster Button */}
        <button
          id="btn-open-modal-cluster"
          type="button"
          onClick={onOpenModalGpu}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-neutral-900/80 hover:bg-neutral-800/90 border border-neutral-800 text-neutral-300 hover:text-white transition-all"
          title="View Modal 3x A10G Serverless GPU Cluster"
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Modal GPU</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800">
            3x A10G
          </span>
        </button>

        {/* Live System Status Indicator: Logfire Active badge */}
        <button
          id="badge-logfire-status"
          type="button"
          onClick={onOpenLogfire}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 transition-all cursor-pointer group"
          title="Open Pydantic Logfire Live Telemetry Trace"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                logfireActive ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                logfireActive ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="text-neutral-300 font-medium">Logfire</span>
          <span className="text-emerald-400 text-[11px] font-bold">🟢 Active</span>
        </button>

        {/* AI Architect Co-Pilot Chat Trigger */}
        <button
          id="btn-open-spatial-chat"
          type="button"
          onClick={onOpenChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-cyan-300 hover:border-cyan-700/60 transition-all"
        >
          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Spatial Co-Pilot</span>
        </button>

        {/* Upload / Switch Room */}
        <button
          id="btn-open-room-upload"
          type="button"
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 hover:bg-white text-neutral-950 font-mono transition-all shadow-sm"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Stage Room</span>
        </button>
      </div>
    </header>
  );
};
