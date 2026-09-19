import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Check,
  ArrowRight,
  Layers,
  FileText,
  Compass,
  AlertCircle,
  Plus,
  Trash2,
  Star,
  Eye,
  Camera,
  Maximize2
} from 'lucide-react';
import { SAMPLE_ROOMS, SampleRoom } from '../data/sampleRooms';
import { RoomImageAngle } from '../types';

export interface UploadedImageItem {
  id: string;
  name: string;
  dataUrl: string;
  angleLabel: string;
  metrics?: { width: number; height: number; aspect: string };
  isPrimary: boolean;
}

const COMMON_ANGLE_LABELS = [
  'Primary Wide View',
  'Corner / Wide Angle',
  'Window & Daylight Wall',
  'Opposite Wall View',
  'Doorway / Entry Angle',
  'Architectural Detail',
  'Floor Cad / Blueprint',
];

interface RoomUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSampleRoom: (sample: SampleRoom) => void;
  onUploadCustomRoom: (
    primaryImageBase64: string,
    name: string,
    allImages?: UploadedImageItem[]
  ) => Promise<void>;
  isProcessing: boolean;
}

export const RoomUploadModal: React.FC<RoomUploadModalProps> = ({
  isOpen,
  onClose,
  onSelectSampleRoom,
  onUploadCustomRoom,
  isProcessing,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImageItem[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);
  const [roomTitle, setRoomTitle] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [geminiAnalysis, setGeminiAnalysis] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = (file: File, indexOffset: number): Promise<UploadedImageItem> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const defaultLabel =
            indexOffset === 0 && uploadedImages.length === 0
              ? 'Primary Wide View'
              : COMMON_ANGLE_LABELS[Math.min(uploadedImages.length + indexOffset, COMMON_ANGLE_LABELS.length - 1)];

          resolve({
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            dataUrl: result,
            angleLabel: defaultLabel,
            metrics: {
              width: img.width,
              height: img.height,
              aspect: (img.width / img.height).toFixed(2),
            },
            isPrimary: uploadedImages.length === 0 && indexOffset === 0,
          });
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    if (!roomTitle && validFiles[0]) {
      const baseName = validFiles[0].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setRoomTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }

    const processedPromises = validFiles.map((file, idx) => processFile(file, idx));
    const newItems = await Promise.all(processedPromises);

    setUploadedImages((prev) => {
      const combined = [...prev, ...newItems];
      // Ensure at least one primary
      if (!combined.some((item) => item.isPrimary) && combined.length > 0) {
        combined[0].isPrimary = true;
      }
      return combined;
    });

    setActivePreviewIndex((prev) => (uploadedImages.length === 0 ? 0 : prev));
  };

  const handleRemoveImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedImages((prev) => {
      const remaining = prev.filter((img) => img.id !== id);
      if (remaining.length > 0 && !remaining.some((img) => img.isPrimary)) {
        remaining[0].isPrimary = true;
      }
      return remaining;
    });
    setActivePreviewIndex((curr) => Math.max(0, curr - 1));
  };

  const handleSetPrimary = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
  };

  const handleUpdateLabel = (id: string, newLabel: string) => {
    setUploadedImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, angleLabel: newLabel } : img))
    );
  };

  const handleAnalyzeWithGemini = async () => {
    if (uploadedImages.length === 0) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: uploadedImages.map((img) => ({
            dataUrl: img.dataUrl,
            name: img.name,
            angleLabel: img.angleLabel,
          })),
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setGeminiAnalysis(data.analysis);
      }
    } catch (e) {
      console.error('Image analysis error', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStageThisRoom = async () => {
    if (uploadedImages.length === 0) return;
    const primary = uploadedImages.find((img) => img.isPrimary) || uploadedImages[0];
    await onUploadCustomRoom(
      primary.dataUrl,
      roomTitle || primary.name || 'Uploaded Room Space',
      uploadedImages
    );
    onClose();
  };

  const currentPreviewItem = uploadedImages[activePreviewIndex] || uploadedImages[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        id="room-upload-modal"
        className="w-full max-w-4xl max-h-[92vh] rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl flex flex-col overflow-hidden font-mono text-neutral-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Multi-Image Spatial Ingestion &amp; 3D Staging
                </h3>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Multiple Angles Supported
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Upload 1 or more photos/angles of your empty room, floor CAD blueprints, or pick an architectural preset
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Preset Showcase */}
          <div>
            <div className="text-xs text-neutral-400 uppercase tracking-wider font-semibold mb-3 flex items-center justify-between">
              <span>Quick Architectural Presets</span>
              <span className="text-emerald-400 text-[11px]">Instant 1-Click Staging</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SAMPLE_ROOMS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => {
                    onSelectSampleRoom(sample);
                    onClose();
                  }}
                  className="group relative p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 cursor-pointer transition-all flex gap-3 items-center"
                >
                  <img
                    src={sample.thumbnail}
                    alt={sample.name}
                    className="w-20 h-16 rounded-lg object-cover border border-neutral-800"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {sample.name}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate mt-0.5">{sample.dimensionsText}</div>
                    <div className="text-[10px] text-neutral-500 font-mono mt-1">3 Pydantic Variants Ready</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-neutral-800"></div>
            <span className="flex-shrink mx-4 text-[10px] text-neutral-500 uppercase tracking-wider">
              or upload multiple images of your room
            </span>
            <div className="flex-grow border-t border-neutral-800"></div>
          </div>

          {/* Multi-File Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) {
                handleFiles(e.dataTransfer.files);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-cyan-400 bg-cyan-950/20'
                : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  handleFiles(e.target.files);
                }
              }}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-cyan-400">
                <Layers className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold text-neutral-200">
                Click to browse or drop multiple room photos &amp; angle views
              </div>
              <div className="text-[11px] text-neutral-500 max-w-md">
                Select 1 or more images (JPG, PNG, WEBP). Capture wide-angle, corners, doorway entry, and opposite wall viewpoints for panoramic spatial synthesis.
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] bg-neutral-800/80 px-2.5 py-1 rounded text-cyan-300 border border-neutral-700">
                  Multiple Select Enabled
                </span>
                <span className="text-[10px] bg-neutral-800/80 px-2.5 py-1 rounded text-neutral-400 border border-neutral-700">
                  Auto Perspective Tagging
                </span>
              </div>
            </div>
          </div>

          {/* Uploaded Gallery Grid & Active Inspector */}
          {uploadedImages.length > 0 && (
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-4">
              {/* Header with Title Input & Count */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex-1">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Uploaded Perspectives ({uploadedImages.length} Image{uploadedImages.length > 1 ? 's' : ''})</span>
                  </div>
                  <input
                    type="text"
                    value={roomTitle}
                    onChange={(e) => setRoomTitle(e.target.value)}
                    placeholder="e.g. Master Bedroom Suite, Living Loft..."
                    className="w-full sm:w-80 px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 font-sans"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Add More Angles</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAnalyzeWithGemini}
                    disabled={isAnalyzing}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-cyan-800/50 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isAnalyzing ? 'Analyzing Angles...' : 'Analyze with Gemini AI'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleStageThisRoom}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold shadow-md transition-colors"
                  >
                    <span>{isProcessing ? 'Synthesizing...' : `Stage This Room (${uploadedImages.length})`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Thumbnails list */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {uploadedImages.map((img, idx) => {
                  const isSelected = idx === activePreviewIndex;
                  return (
                    <div
                      key={img.id}
                      onClick={() => setActivePreviewIndex(idx)}
                      className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all flex flex-col bg-neutral-950 ${
                        isSelected
                          ? 'border-cyan-400 ring-2 ring-cyan-500/20 shadow-lg'
                          : 'border-neutral-800 hover:border-neutral-700 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="relative aspect-[4/3] bg-neutral-900 overflow-hidden">
                        <img
                          src={img.dataUrl}
                          alt={img.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Primary Badge */}
                        {img.isPrimary && (
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-cyan-500 text-[9px] font-bold text-neutral-950 flex items-center gap-1 shadow">
                            <Star className="w-2.5 h-2.5 fill-neutral-950" />
                            <span>PRIMARY</span>
                          </div>
                        )}
                        {/* Action buttons on hover */}
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!img.isPrimary && (
                            <button
                              type="button"
                              title="Set as Primary Staging Viewport"
                              onClick={(e) => handleSetPrimary(img.id, e)}
                              className="p-1 rounded bg-black/70 hover:bg-cyan-500 hover:text-black text-neutral-300 transition-colors"
                            >
                              <Star className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Remove Image"
                            onClick={(e) => handleRemoveImage(img.id, e)}
                            className="p-1 rounded bg-black/70 hover:bg-rose-500 hover:text-white text-neutral-300 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Label Footer */}
                      <div className="p-1.5 text-[10px] bg-neutral-900/90 border-t border-neutral-800/80">
                        <div className="text-neutral-300 font-semibold truncate">{img.angleLabel || `Angle ${idx + 1}`}</div>
                        <div className="text-neutral-500 truncate text-[9px]">{img.metrics?.width}×{img.metrics?.height}px</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active Selected Image Detail & Perspective Label Config */}
              {currentPreviewItem && (
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentPreviewItem.dataUrl}
                      alt={currentPreviewItem.name}
                      className="w-24 h-16 object-cover rounded-lg border border-neutral-700"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate max-w-xs">{currentPreviewItem.name}</span>
                        {currentPreviewItem.isPrimary && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                            Primary Staging Target
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        {currentPreviewItem.metrics?.width} × {currentPreviewItem.metrics?.height} px · Aspect {currentPreviewItem.metrics?.aspect}
                      </div>
                    </div>
                  </div>

                  {/* Angle Label Selector */}
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-[11px] text-neutral-400 whitespace-nowrap">Camera Angle Tag:</span>
                    <select
                      value={currentPreviewItem.angleLabel}
                      onChange={(e) => handleUpdateLabel(currentPreviewItem.id, e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500"
                    >
                      {COMMON_ANGLE_LABELS.map((lbl) => (
                        <option key={lbl} value={lbl}>
                          {lbl}
                        </option>
                      ))}
                    </select>

                    {!currentPreviewItem.isPrimary && (
                      <button
                        type="button"
                        onClick={(e) => handleSetPrimary(currentPreviewItem.id, e)}
                        className="px-2.5 py-1.5 rounded-lg text-xs bg-neutral-800 hover:bg-cyan-500 hover:text-neutral-950 text-neutral-300 border border-neutral-700 transition-colors whitespace-nowrap flex items-center gap-1"
                      >
                        <Star className="w-3 h-3" />
                        <span>Make Primary View</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Gemini Multimodal Analysis Card */}
              {geminiAnalysis && (
                <div className="p-4 rounded-xl bg-neutral-950 border border-cyan-900/60 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                    <Sparkles className="w-4 h-4" />
                    <span>Gemini 3.1 Multi-Angle Spatial Understanding</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-neutral-300 font-mono pt-1">
                    <div className="p-2 rounded bg-neutral-900/60 border border-neutral-800">
                      <span className="text-neutral-500 block text-[10px]">Detected Space</span>
                      <span className="font-semibold text-white">{geminiAnalysis.room_type || 'Flex Living Space'}</span>
                    </div>
                    <div className="p-2 rounded bg-neutral-900/60 border border-neutral-800">
                      <span className="text-neutral-500 block text-[10px]">Ceiling Height</span>
                      <span className="font-semibold text-white">{geminiAnalysis.ceiling_height || '3.2 meters'}</span>
                    </div>
                    <div className="p-2 rounded bg-neutral-900/60 border border-neutral-800">
                      <span className="text-neutral-500 block text-[10px]">Dimensions</span>
                      <span className="font-semibold text-white">{geminiAnalysis.dimensions_estimate || '18ft × 14ft'}</span>
                    </div>
                    <div className="p-2 rounded bg-neutral-900/60 border border-neutral-800">
                      <span className="text-neutral-500 block text-[10px]">Light Quality</span>
                      <span className="font-semibold text-white">{geminiAnalysis.natural_light_quality || 'Daylight 5200K'}</span>
                    </div>
                  </div>

                  {geminiAnalysis.staging_recommendation && (
                    <div className="mt-2 text-[11px] text-neutral-300 border-t border-neutral-800 pt-2">
                      <span className="text-neutral-400 font-semibold">Architectural Recommendation: </span>
                      {geminiAnalysis.staging_recommendation}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
