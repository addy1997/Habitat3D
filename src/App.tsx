/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { SAMPLE_ROOMS, SampleRoom } from './data/sampleRooms';
import { StagingVariantPlan, HotspotMarkerData, LogfireSpan, ModalGpuWorker } from './types';
import { TopBar } from './components/TopBar';
import { DualRealisticViewport } from './components/DualRealisticViewport';
import { StyleSwitcher } from './components/StyleSwitcher';
import { HotspotCard } from './components/HotspotCard';
import { LogfireTraceModal } from './components/LogfireTraceModal';
import { ModalComputeModal } from './components/ModalComputeModal';
import { RoomUploadModal } from './components/RoomUploadModal';
import { SpatialChatbot } from './components/SpatialChatbot';

export default function App() {
  const [activeRoom, setActiveRoom] = useState<SampleRoom>(SAMPLE_ROOMS[0]);
  const [analysis, setAnalysis] = useState(SAMPLE_ROOMS[0].initialAnalysis);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotMarkerData | null>(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [crossFading, setCrossFading] = useState<boolean>(false);
  const [isGeneratingVariantImage, setIsGeneratingVariantImage] = useState<boolean>(false);
  const [cameraResetTrigger, setCameraResetTrigger] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Modals & Drawers
  const [isLogfireOpen, setIsLogfireOpen] = useState<boolean>(false);
  const [isModalGpuOpen, setIsModalGpuOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  // Live Pydantic Logfire Traces & Modal GPU Workers State
  const [logfireTraces, setLogfireTraces] = useState<LogfireSpan[]>([
    {
      id: 'span-01',
      name: 'logfire.span("ingest_and_validate")',
      duration_ms: 24,
      status: 'ok',
      timestamp: new Date().toISOString(),
      attributes: {
        payload_bytes: 1843200,
        aspect_ratio: '1.778 (16:9)',
        resolution: '1920x1080',
        spatial_prevalidation: 'Passed [Floor Plane Non-Occluded]',
        ambient_lux_estimate: '480 lux (Daylight Kelvin 5200K)',
      },
    },
    {
      id: 'span-02',
      name: 'logfire.span("agent_orchestration")',
      duration_ms: 185,
      status: 'ok',
      timestamp: new Date().toISOString(),
      attributes: {
        agent_id: 'pydantic-ai:gemini-spatial-staging',
        result_type: 'RoomSpatialAnalysis',
        variants_generated: 3,
        spatial_collision_check: 'Passed (0 intersections, 100% boundary containment)',
        doorway_clearance_verified: 'Passed (>= 0.90m threshold maintained)',
        pydantic_plugin: 'logfire.PydanticPlugin(record="all")',
      },
    },
    {
      id: 'span-03',
      name: 'logfire.span("modal_parallel_gpu_map")',
      duration_ms: 110,
      status: 'ok',
      timestamp: new Date().toISOString(),
      attributes: {
        map_concurrency: 3,
        gpu_target: 'NVIDIA A10G (24GB VRAM)',
        pipeline_steps: ['Depth-Anything v2', 'Nano Banana Image Synthesis', '3D Gaussian Splat Export'],
        total_splat_points: 146500,
        parallel_execution_speedup: '2.94x over serial',
      },
    },
  ]);

  const [modalWorkers, setModalWorkers] = useState<ModalGpuWorker[]>([
    {
      id: 'worker-0',
      name: 'modal-a10g-office-worker',
      gpu_type: 'NVIDIA A10G',
      status: 'completed',
      variant_title: 'Executive Home Office',
      vram_usage_gb: 14.8,
      compute_time_sec: 4.12,
      splat_points_generated: 48500,
      output_bytes: 3880000,
    },
    {
      id: 'worker-1',
      name: 'modal-a10g-nursery-worker',
      gpu_type: 'NVIDIA A10G',
      status: 'completed',
      variant_title: 'Nursery / Kids Room',
      vram_usage_gb: 15.2,
      compute_time_sec: 4.38,
      splat_points_generated: 51200,
      output_bytes: 4096000,
    },
    {
      id: 'worker-2',
      name: 'modal-a10g-guest-worker',
      gpu_type: 'NVIDIA A10G',
      status: 'completed',
      variant_title: 'Guest Bedroom Suite',
      vram_usage_gb: 14.4,
      compute_time_sec: 3.95,
      splat_points_generated: 46800,
      output_bytes: 3744000,
    },
  ]);

  const currentVariant = analysis.variants[selectedVariantIndex] || analysis.variants[0];

  // Select variant with <200ms cross-fade
  const handleSelectVariant = useCallback((index: number) => {
    if (index === selectedVariantIndex) return;
    setCrossFading(true);
    setSelectedVariantIndex(index);
    setSelectedHotspot(null);
  }, [selectedVariantIndex]);

  // Auto clear crossfading
  useEffect(() => {
    if (crossFading) {
      const timer = setTimeout(() => setCrossFading(false), 200);
      return () => clearTimeout(timer);
    }
  }, [crossFading]);

  // When variant changes, if it lacks realistic_image_url and we have an uploaded room image, generate it on-demand!
  useEffect(() => {
    const targetVariant = analysis.variants[selectedVariantIndex];
    if (
      targetVariant &&
      !targetVariant.realistic_image_url &&
      activeRoom.empty_image_url &&
      activeRoom.empty_image_url.startsWith('data:')
    ) {
      setIsGeneratingVariantImage(true);
      fetch('/api/stage-variant-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: activeRoom.empty_image_url,
          variant: targetVariant,
          room_type: analysis.detected_room_type,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.realistic_image_url) {
            setAnalysis((prev) => {
              const updatedVariants = [...prev.variants];
              updatedVariants[selectedVariantIndex] = {
                ...updatedVariants[selectedVariantIndex],
                realistic_image_url: data.realistic_image_url,
              };
              return { ...prev, variants: updatedVariants };
            });
          }
        })
        .catch((err) => console.warn('Variant image generation error:', err))
        .finally(() => setIsGeneratingVariantImage(false));
    }
  }, [selectedVariantIndex, activeRoom.empty_image_url, analysis.detected_room_type]);

  // Handle preset sample selection
  const handleSelectSample = (sample: SampleRoom) => {
    setActiveRoom(sample);
    setAnalysis(sample.initialAnalysis);
    setSelectedVariantIndex(0);
    setSelectedHotspot(null);
    setCameraResetTrigger((c) => c + 1);
  };

  // Handle custom room upload and backend /api/stage call with multi-image support
  const handleUploadCustomRoom = async (
    imageBase64: string,
    name: string,
    allImages?: Array<{ id: string; name: string; dataUrl: string; angleLabel?: string }>
  ) => {
    setIsProcessing(true);
    try {
      const payloadImages =
        allImages && allImages.length > 0
          ? allImages.map((img) => ({
              id: img.id,
              name: img.name,
              dataUrl: img.dataUrl,
              angleLabel: img.angleLabel,
            }))
          : [{ id: 'img-0', name: name || 'Room View', dataUrl: imageBase64, angleLabel: 'Primary Wide View' }];

      const res = await fetch('/api/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: imageBase64,
          images: payloadImages,
          room_type_hint: name,
        }),
      });
      const data = await res.json();
      if (data.success && data.spatial_metadata) {
        setAnalysis(data.spatial_metadata);
        if (data.logfire_traces) setLogfireTraces(data.logfire_traces);
        if (data.modal_workers) setModalWorkers(data.modal_workers);

        setActiveRoom({
          id: `custom-${Date.now()}`,
          name: name || 'Custom Staged Space',
          subtitle:
            payloadImages.length > 1
              ? `${payloadImages.length} Multi-Angle Photos Analyzed with Gemini Spatial Agent`
              : 'Analyzed with Gemini Multimodal AI & Pydantic Spatial Agent',
          type: data.spatial_metadata.detected_room_type || 'Custom Room',
          thumbnail: imageBase64,
          empty_image_url: imageBase64,
          room_images: payloadImages,
          dimensionsText: `${data.spatial_metadata.estimated_square_footage} sq ft · Pydantic Validated`,
          initialAnalysis: data.spatial_metadata,
        });

        setSelectedVariantIndex(0);
        setSelectedHotspot(null);
        setCameraResetTrigger((c) => c + 1);
      }
    } catch (e) {
      console.error('Failed to stage custom room', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 text-neutral-100 flex flex-col font-sans select-none">
      {/* Top Bar with Brand, System Status & Triggers */}
      <TopBar
        logfireActive={true}
        onOpenLogfire={() => setIsLogfireOpen(true)}
        onOpenModalGpu={() => setIsModalGpuOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onResetCamera={() => setCameraResetTrigger((c) => c + 1)}
        showBoundingBoxes={showBoundingBoxes}
        onToggleBoundingBoxes={() => setShowBoundingBoxes(!showBoundingBoxes)}
        currentRoomName={activeRoom.name}
        isProcessing={isProcessing}
      />

      {/* Main Viewport (Photorealistic Dual 3D Viewport) */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <DualRealisticViewport
          currentVariant={currentVariant}
          emptyImageUrl={activeRoom.empty_image_url || activeRoom.thumbnail}
          uploadedImageUrl={activeRoom.empty_image_url}
          roomImages={activeRoom.room_images || analysis.room_images}
          ceilingHeightMeters={analysis.ceiling_height_meters || 3.0}
          showBoundingBoxes={showBoundingBoxes}
          onSelectHotspot={(hotspot) => setSelectedHotspot(hotspot)}
          selectedHotspotId={selectedHotspot?.id}
          cameraResetTrigger={cameraResetTrigger}
          roomName={activeRoom.name}
          dimensionsText={activeRoom.dimensionsText}
          isGeneratingVariantImage={isGeneratingVariantImage}
          detectedFloorPolygon={analysis.usable_floor_polygon}
          architecturalFeatures={analysis.architectural_features}
        />

        {/* In-Scene Expanded Hotspot Dimension Card */}
        <HotspotCard
          hotspot={selectedHotspot}
          onClose={() => setSelectedHotspot(null)}
        />

        {/* Floating Style Switcher (Center-Bottom) */}
        <StyleSwitcher
          variants={analysis.variants}
          selectedVariantIndex={selectedVariantIndex}
          onSelectVariant={handleSelectVariant}
          crossFading={crossFading}
        />
      </main>

      {/* Bottom Attribution Strip */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 py-1.5 px-4 bg-neutral-950/80 backdrop-blur-sm border-t border-neutral-800/60 text-center select-none">
        <p className="text-[11px] text-neutral-400 font-mono tracking-tight">
          Interactive 3D Walkthrough | Powered by Gemini Multimodal AI &amp; Modal High-Performance Infrastructure | Built with Pydantic Agentic AI
        </p>
      </footer>

      {/* Pydantic Logfire Live Telemetry Trace Dashboard Modal */}
      <LogfireTraceModal
        isOpen={isLogfireOpen}
        onClose={() => setIsLogfireOpen(false)}
        traces={logfireTraces}
        pydanticModelDump={analysis}
      />

      {/* Modal 3x GPU Serverless Cluster Monitor Modal */}
      <ModalComputeModal
        isOpen={isModalGpuOpen}
        onClose={() => setIsModalGpuOpen(false)}
        workers={modalWorkers}
      />

      {/* Room Photo & CAD Upload Modal */}
      <RoomUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSelectSampleRoom={handleSelectSample}
        onUploadCustomRoom={handleUploadCustomRoom}
        isProcessing={isProcessing}
      />

      {/* Multi-turn Gemini Spatial Staging Chatbot Drawer */}
      <SpatialChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentVariant={currentVariant}
      />
    </div>
  );
}
