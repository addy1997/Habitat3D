export interface FurniturePlacement {
  item_name: string;
  relative_bounding_box: [number, number, number, number]; // [x_min, y_min, x_max, y_max] from 0 to 1
  orientation_degrees: number;
  dimensions_metric?: {
    width_m: number;
    depth_m: number;
    height_m: number;
    clearance_m: number;
  };
  category?: 'seating' | 'desk' | 'storage' | 'bed' | 'lighting' | 'decor' | 'crib';
}

export interface StagingVariantPlan {
  demographic: string;
  variant_title: string; // e.g. "Executive Home Office", "Nursery / Kids Room", "Guest Bedroom Suite"
  lighting_style: string;
  prompt_instruction: string;
  furniture_list: FurniturePlacement[];
  color_palette?: string[];
  vibe_keywords?: string[];
  realistic_image_url?: string;
}

export interface RoomImageAngle {
  id: string;
  name: string;
  dataUrl: string;
  angleLabel?: string; // e.g. "Primary Wide", "Corner Perspective", "Opposite Wall", "Ceiling / Floor Context"
  metrics?: { width: number; height: number; aspect: string };
  isPrimary?: boolean;
}

export interface RoomSpatialAnalysis {
  detected_room_type: string;
  estimated_square_footage: number;
  ceiling_height_meters?: number;
  empty_render_url?: string;
  room_images?: RoomImageAngle[]; // Multi-angle uploaded images
  usable_floor_polygon: [number, number][];
  architectural_features?: {
    windows_count: number;
    doors_count: number;
    primary_light_source: string;
    flooring_type: string;
  };
  variants: StagingVariantPlan[];
}

export interface LogfireSpan {
  id: string;
  name: string;
  duration_ms: number;
  status: 'ok' | 'running' | 'warning' | 'error';
  timestamp: string;
  attributes: Record<string, unknown>;
  children?: LogfireSpan[];
}

export interface ModalGpuWorker {
  id: string;
  name: string;
  gpu_type: 'NVIDIA A10G' | 'NVIDIA L4';
  status: 'idle' | 'provisioning' | 'rendering' | 'completed';
  variant_title: string;
  vram_usage_gb: number;
  compute_time_sec: number;
  splat_points_generated: number;
  output_bytes: number;
}

export interface HotspotMarkerData {
  id: string;
  title: string;
  category: 'furniture' | 'architecture' | 'lighting' | 'clearance';
  position: [number, number, number]; // x, y, z
  dimensions: {
    width: string;
    depth: string;
    height?: string;
    clearance: string;
  };
  pydantic_validation: {
    schema_passed: boolean;
    non_overlapping: boolean;
    wall_clearance_met: boolean;
    egress_clearance_ratio: number;
  };
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  thoughtProcess?: string;
  modelUsed?: string;
}
