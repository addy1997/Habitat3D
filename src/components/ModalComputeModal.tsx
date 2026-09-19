import React from 'react';
import { X, Cpu, Server, Zap, CheckCircle2, Activity, HardDrive, Terminal } from 'lucide-react';
import { ModalGpuWorker } from '../types';

interface ModalComputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: ModalGpuWorker[];
}

export const ModalComputeModal: React.FC<ModalComputeModalProps> = ({
  isOpen,
  onClose,
  workers,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        id="modal-gpu-dashboard"
        className="w-full max-w-4xl max-h-[85vh] rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl flex flex-col overflow-hidden font-mono text-neutral-200"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white tracking-wide">Modal Serverless Compute</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800">
                  3 x NVIDIA A10G Active
                </span>
              </div>
              <div className="text-[11px] text-neutral-400">
                app = modal.App("agentic-spatial-staging") · render_variant.map()
              </div>
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

        {/* Modal Cluster Stats */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Metrics Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Parallel Concurrency
              </div>
              <div className="mt-1 text-xl font-bold text-white">3 GPU Workers</div>
              <div className="mt-0.5 text-[11px] text-emerald-400 font-mono">Simultaneous dispatch via modal.map</div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> Avg Render Latency
              </div>
              <div className="mt-1 text-xl font-bold text-white">4.15 seconds</div>
              <div className="mt-0.5 text-[11px] text-cyan-400 font-mono">Depth-Anything + .splat export</div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-indigo-400" /> Total Splats Synthesized
              </div>
              <div className="mt-1 text-xl font-bold text-white">146,500 pts</div>
              <div className="mt-0.5 text-[11px] text-neutral-400 font-mono">3D Gaussian Splat (.splat binary)</div>
            </div>
          </div>

          {/* Workers List */}
          <div>
            <div className="text-xs text-neutral-400 uppercase tracking-wider font-semibold mb-3 flex items-center justify-between">
              <span>Serverless Container Nodes</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Health
              </span>
            </div>

            <div className="space-y-3">
              {workers.map((worker) => (
                <div
                  key={worker.id}
                  className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 sm:mt-0 animate-pulse" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{worker.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 text-neutral-300">
                          {worker.gpu_type}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        Target Variant: <span className="text-cyan-300 font-medium">{worker.variant_title}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase">VRAM</div>
                      <div className="font-semibold text-neutral-200">{worker.vram_usage_gb} / 24 GB</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase">Execution</div>
                      <div className="font-semibold text-emerald-400">{worker.compute_time_sec}s</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase">Splat Points</div>
                      <div className="font-semibold text-indigo-300">{worker.splat_points_generated.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Pipeline Code Snippet */}
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200 mb-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>Modal Serverless Parallel Dispatch Code (`pipeline.py`)</span>
            </div>
            <pre className="p-3.5 rounded-lg bg-neutral-950 text-xs text-indigo-200 font-mono overflow-x-auto border border-neutral-800 leading-relaxed">
{`@app.function(image=gpu_image, gpu="A10G", timeout=40)
def render_3d_variant(variant_plan_json: str, raw_image_bytes: bytes) -> bytes:
    # 1. Synthesize multi-view camera keyframes via Gemini
    # 2. Estimate spatial depth map via Depth-Anything v2
    # 3. Export binary .splat file for WebGL Gaussian Splatting
    return splat_binary_bytes

# Parallel execution across all 3 variants simultaneously
plans = [v.model_dump_json() for v in analysis.data.variants]
splat_results = list(render_3d_variant.map(plans, [image_bytes] * len(plans)))`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
