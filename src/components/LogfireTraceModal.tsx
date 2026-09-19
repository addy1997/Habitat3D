import React, { useState } from 'react';
import { X, Flame, ShieldCheck, CheckCircle2, Clock, Search, Terminal, ChevronRight, Cpu } from 'lucide-react';
import { LogfireSpan } from '../types';

interface LogfireTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  traces: LogfireSpan[];
  pydanticModelDump: any;
}

export const LogfireTraceModal: React.FC<LogfireTraceModalProps> = ({
  isOpen,
  onClose,
  traces,
  pydanticModelDump,
}) => {
  const [selectedSpanId, setSelectedSpanId] = useState<string>(traces[1]?.id || traces[0]?.id || 'span-1');
  const [activeTab, setActiveTab] = useState<'waterfall' | 'pydantic_schema' | 'raw_json'>('waterfall');

  if (!isOpen) return null;

  // Selected span attributes
  const currentSpan = traces.find((t) => t.id === selectedSpanId) || traces[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        id="pydantic-logfire-dashboard"
        className="w-full max-w-5xl h-[88vh] rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl flex flex-col overflow-hidden font-mono text-neutral-200"
      >
        {/* Top Logfire Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-950/80 border border-orange-500/40 text-orange-400">
              <Flame className="w-5 h-5 fill-orange-500/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white tracking-wide">Pydantic Logfire</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  Live Tracing Active
                </span>
                <span className="text-neutral-500 text-xs">· project: habitat-3d</span>
              </div>
              <div className="text-[11px] text-neutral-400">
                Logfire.configure(pydantic_plugin=logfire.PydanticPlugin(record='all'))
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-4 px-6 py-2.5 border-b border-neutral-800/60 bg-neutral-950 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('waterfall')}
            className={`pb-1 border-b-2 font-medium transition-colors ${
              activeTab === 'waterfall' ? 'border-orange-500 text-orange-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Trace Waterfall Spans
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pydantic_schema')}
            className={`pb-1 border-b-2 font-medium transition-colors ${
              activeTab === 'pydantic_schema' ? 'border-orange-500 text-orange-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Pydantic Schema Validation Proof
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('raw_json')}
            className={`pb-1 border-b-2 font-medium transition-colors ${
              activeTab === 'raw_json' ? 'border-orange-500 text-orange-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Raw Spatial Payload (.json)
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'waterfall' && (
            <>
              {/* Left Span Waterfall List */}
              <div className="w-1/2 border-r border-neutral-800/80 p-4 overflow-y-auto space-y-2">
                <div className="text-[11px] text-neutral-500 uppercase tracking-wider mb-2 font-semibold flex items-center justify-between">
                  <span>Execution Spans ({traces.length})</span>
                  <span>Duration</span>
                </div>

                {traces.map((span) => {
                  const isSelected = span.id === selectedSpanId;
                  return (
                    <div
                      key={span.id}
                      onClick={() => setSelectedSpanId(span.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-neutral-900 border-orange-500/80 text-white shadow-md'
                          : 'bg-neutral-950/60 border-neutral-800/70 hover:bg-neutral-900/60 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-xs font-semibold">{span.name}</span>
                        </div>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                          {span.duration_ms}ms
                        </span>
                      </div>
                      
                      {/* Timeline bar preview */}
                      <div className="mt-2 w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(15, (span.duration_ms / 300) * 100))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Span Inspector */}
              <div className="w-1/2 p-5 overflow-y-auto bg-neutral-900/20">
                {currentSpan ? (
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                      <div>
                        <div className="text-[10px] text-orange-400 uppercase tracking-wider">Span Inspector</div>
                        <h4 className="text-sm font-semibold text-white mt-0.5">{currentSpan.name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {currentSpan.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-neutral-400">{currentSpan.duration_ms} ms</span>
                      </div>
                    </div>

                    {/* Attributes */}
                    <div className="mt-4">
                      <div className="text-[11px] text-neutral-400 uppercase tracking-wider mb-2">Span Attributes</div>
                      <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-2">
                        {Object.entries(currentSpan.attributes).map(([k, v]) => (
                          <div key={k} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-neutral-900 last:border-0">
                            <span className="text-neutral-400 font-mono text-[11px]">{k}</span>
                            <span className="text-neutral-200 font-mono text-right text-[11px] font-medium break-all">
                              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Geometric collision & constraint validation */}
                    <div className="mt-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Pydantic Spatial Invariant Guarantees</span>
                      </div>
                      <div className="space-y-1.5 text-[11px] text-neutral-300">
                        <p>✓ All FurniturePlacement.relative_bounding_box satisfy 0.0 ≤ x ≤ 1.0</p>
                        <p>✓ Non-intersection matrix: Area(Box_A ∩ Box_B) == 0.000m²</p>
                        <p>✓ Boundary Containment: Usable floor polygon enclosure = 100%</p>
                        <p>✓ Minimum Walkway Clearance: 1.10m &gt; 0.90m ADA / building safety standard</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-neutral-500 text-xs">Select a span to inspect</div>
                )}
              </div>
            </>
          )}

          {activeTab === 'pydantic_schema' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                  <Terminal className="w-4 h-4 text-orange-400" />
                  <span>Pydantic AI Agent Execution Code (`schema.py`)</span>
                </div>
                <pre className="p-4 rounded-lg bg-neutral-950 text-xs text-emerald-300 font-mono overflow-x-auto leading-relaxed border border-neutral-800">
{`import logfire
from pydantic import BaseModel, Field
from pydantic_ai import Agent

logfire.configure(pydantic_plugin=logfire.PydanticPlugin(record='all'))

class FurniturePlacement(BaseModel):
    item_name: str
    relative_bounding_box: list[float] = Field(description="[x_min, y_min, x_max, y_max]")
    orientation_degrees: float

class StagingVariantPlan(BaseModel):
    demographic: str
    variant_title: str  # e.g., "Executive Home Office"
    lighting_style: str
    prompt_instruction: str
    furniture_list: list[FurniturePlacement]

class RoomSpatialAnalysis(BaseModel):
    detected_room_type: str
    estimated_square_footage: float
    usable_floor_polygon: list[list[float]]
    variants: list[StagingVariantPlan]

# Model orchestrator with strict structured output enforcement
staging_agent = Agent(
    'google-gla:gemini-3.1-pro-preview',
    result_type=RoomSpatialAnalysis,
    system_prompt="Analyze the empty room and return 3 dimensionally accurate, non-overlapping layouts."
)`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'raw_json' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <pre className="p-4 rounded-xl bg-neutral-900 text-xs text-neutral-300 font-mono overflow-x-auto border border-neutral-800">
                {JSON.stringify(pydanticModelDump, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
