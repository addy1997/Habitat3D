import React from 'react';
import {
  X,
  Layers,
  Activity,
  Cpu,
  Camera,
  Eye,
  Sparkles,
  Zap,
  Sliders,
  CheckCircle2,
  Maximize2,
  Box,
} from 'lucide-react';
import { NeRFVolumeMetadata, CameraPose, NeRFRenderSettings } from '../types';

interface NeRFPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata?: NeRFVolumeMetadata;
  renderSettings: NeRFRenderSettings;
  onUpdateRenderSettings: (settings: Partial<NeRFRenderSettings>) => void;
  onSelectCameraPose?: (pose: CameraPose) => void;
}

export const NeRFPipelineModal: React.FC<NeRFPipelineModalProps> = ({
  isOpen,
  onClose,
  metadata,
  renderSettings,
  onUpdateRenderSettings,
  onSelectCameraPose,
}) => {
  if (!isOpen) return null;

  const defaultMeta: NeRFVolumeMetadata = metadata || {
    pointCount: 48500,
    psnr: 35.2,
    iterations: 30000,
    loss: 0.0028,
    rayMarchSteps: 128,
    hashGridLevels: 16,
    sphericalHarmonicsDegree: 3,
    cameraPoses: [],
    boundingVolume: { width_m: 6.0, height_m: 3.0, depth_m: 5.0 },
    sfmConvergence: 'Residual 0.38px (COLMAP Pose Solved)',
    trainingDurationSec: 4.12,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl flex flex-col overflow-hidden font-mono text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  NeRF (Neural Radiance Fields) &amp; 3DGS Engine
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Volumetric Active
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Multi-View Novel View Synthesis · Structure-from-Motion Pose Calibration · Differentiable 3D Gaussian Splats
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Neural Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-0.5">
                Reconstruction Fidelity
              </span>
              <div className="text-lg font-bold text-emerald-400 font-mono">
                {defaultMeta.psnr.toFixed(1)} dB <span className="text-xs text-neutral-400 font-normal">PSNR</span>
              </div>
              <span className="text-[10px] text-neutral-500 font-mono">Loss {defaultMeta.loss} (SSIM 0.96)</span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-0.5">
                3D Gaussians (Splat Count)
              </span>
              <div className="text-lg font-bold text-cyan-400 font-mono">
                {defaultMeta.pointCount.toLocaleString()}
              </div>
              <span className="text-[10px] text-neutral-500 font-mono">SH Degree {defaultMeta.sphericalHarmonicsDegree} Radiance</span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-0.5">
                Multi-View SfM Poses
              </span>
              <div className="text-lg font-bold text-amber-400 font-mono">
                {defaultMeta.cameraPoses.length || 3} Poses
              </div>
              <span className="text-[10px] text-neutral-500 font-mono truncate block">
                {defaultMeta.sfmConvergence}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-0.5">
                Ray Marching Density
              </span>
              <div className="text-lg font-bold text-purple-400 font-mono">
                {defaultMeta.rayMarchSteps} samples/ray
              </div>
              <span className="text-[10px] text-neutral-500 font-mono">16-Level Multi-Res Hash Grid</span>
            </div>
          </div>

          {/* Interactive Rendering Mode Selectors */}
          <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Neural Volumetric Rendering Modes</span>
              </div>
              <span className="text-[10px] text-neutral-400">Live WebGL Shader Controls</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => onUpdateRenderSettings({ renderMode: '3d-orbit' })}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  renderSettings.renderMode === '3d-orbit'
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-200 shadow-md'
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <span>3D Reconstructed Room</span>
                  {renderSettings.renderMode === '3d-orbit' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <p className="text-[10px] text-neutral-400">
                  Projective 3D spatial surfaces (floor, walls, ceiling) with physically placed staged furniture.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onUpdateRenderSettings({ renderMode: 'gaussian-splats' })}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  renderSettings.renderMode === 'gaussian-splats'
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-200 shadow-md'
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <span>3D Gaussian Splats</span>
                  {renderSettings.renderMode === 'gaussian-splats' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <p className="text-[10px] text-neutral-400">
                  Continuous 3D Gaussian radiance field ellipsoids with view-dependent shading.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onUpdateRenderSettings({ renderMode: 'photorealistic' })}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  renderSettings.renderMode === 'photorealistic'
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-200 shadow-md'
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <span>AI Photorealistic Render</span>
                  {renderSettings.renderMode === 'photorealistic' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <p className="text-[10px] text-neutral-400">
                  Synthesized architectural photograph plate generated from Gemini Multimodal AI.
                </p>
              </button>
            </div>
          </div>

          {/* Neural Radiance Field Tuning Sliders */}
          <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>NeRF &amp; Gaussian Density Parameters</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Splat Radius Scale */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span>Gaussian Splat Kernel Scale:</span>
                  <span className="font-mono text-cyan-400">{renderSettings.splatScale.toFixed(3)}m</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.12"
                  step="0.005"
                  value={renderSettings.splatScale}
                  onChange={(e) => onUpdateRenderSettings({ splatScale: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Splat Opacity */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span>Volumetric Radiance Opacity:</span>
                  <span className="font-mono text-cyan-400">{Math.round(renderSettings.splatOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={renderSettings.splatOpacity}
                  onChange={(e) => onUpdateRenderSettings({ splatOpacity: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>

            {/* Toggle Camera Frustums in 3D Space */}
            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-neutral-800 text-xs">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Render 3D Camera Capture Frustums (Pyramids):</span>
              </div>
              <button
                type="button"
                onClick={() => onUpdateRenderSettings({ showCameraFrustums: !renderSettings.showCameraFrustums })}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all ${
                  renderSettings.showCameraFrustums
                    ? 'bg-cyan-500 text-neutral-950 font-bold'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {renderSettings.showCameraFrustums ? 'Frustums Visible' : 'Frustums Hidden'}
              </button>
            </div>
          </div>

          {/* Camera Poses List */}
          {defaultMeta.cameraPoses && defaultMeta.cameraPoses.length > 0 && (
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Calibrated Multi-View Camera Poses ({defaultMeta.cameraPoses.length})</span>
                </span>
                <span className="text-[10px] text-neutral-400">Click to warp camera viewpoint</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {defaultMeta.cameraPoses.map((pose, pIdx) => (
                  <div
                    key={pose.id}
                    onClick={() => onSelectCameraPose && onSelectCameraPose(pose)}
                    className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center gap-3 group"
                  >
                    {pose.thumbnailUrl && (
                      <img
                        src={pose.thumbnailUrl}
                        alt={pose.name}
                        className="w-14 h-10 rounded object-cover border border-neutral-800 group-hover:scale-105 transition-transform"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white group-hover:text-cyan-300 truncate">
                        {pose.viewpointLabel || `Camera ${pIdx + 1}`}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono truncate">
                        XYZ [{pose.position.join(', ')}]
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
