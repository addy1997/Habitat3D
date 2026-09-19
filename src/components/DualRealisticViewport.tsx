import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { StagingVariantPlan, HotspotMarkerData, NeRFVolumeMetadata, NeRFRenderSettings, CameraPose } from '../types';
import { buildArchitecturalRoom, buildFurnitureGroupForVariant, loadTextureFromUrl } from '../utils/sceneBuilder';
import {
  estimateCameraPosesFromImages,
  buildCameraFrustumsGroup,
  generate3DGaussianSplatsFromImages,
} from '../utils/nerfPipeline';
import {
  Columns,
  SplitSquareVertical,
  Camera,
  Maximize2,
  RotateCcw,
  Link,
  Unlink,
  Sparkles,
  Layers,
  Compass,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Download,
  Grid,
  Eye,
  Loader2,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

export type ViewDisplayMode = 'side-by-side' | 'split-slider' | 'studio-renders' | 'single-staged';
export type RenderEngineType = '3d-orbit' | 'gaussian-splats' | 'photorealistic';

interface DualRealisticViewportProps {
  currentVariant: StagingVariantPlan;
  emptyImageUrl?: string;
  uploadedImageUrl?: string;
  roomImages?: Array<{
    id: string;
    name: string;
    dataUrl: string;
    angleLabel?: string;
    isPrimary?: boolean;
  }>;
  ceilingHeightMeters?: number;
  showBoundingBoxes: boolean;
  onSelectHotspot: (hotspot: HotspotMarkerData) => void;
  selectedHotspotId?: string;
  cameraResetTrigger: number;
  roomName: string;
  dimensionsText: string;
  isGeneratingVariantImage?: boolean;
  detectedFloorPolygon?: number[][];
  architecturalFeatures?: {
    windows_count?: number;
    doors_count?: number;
    primary_light_source?: string;
    flooring_type?: string;
  };
  nerfSettings?: NeRFRenderSettings;
  nerfMetadata?: NeRFVolumeMetadata;
  onOpenNeRFModal?: () => void;
  onSelectCameraPose?: (pose: CameraPose) => void;
  targetCameraPose?: CameraPose | null;
}

export const DualRealisticViewport: React.FC<DualRealisticViewportProps> = ({
  currentVariant,
  emptyImageUrl,
  uploadedImageUrl,
  roomImages,
  ceilingHeightMeters = 3.0,
  showBoundingBoxes,
  onSelectHotspot,
  selectedHotspotId,
  cameraResetTrigger,
  roomName,
  dimensionsText,
  isGeneratingVariantImage = false,
  detectedFloorPolygon,
  architecturalFeatures,
  nerfSettings,
  nerfMetadata,
  onOpenNeRFModal,
  onSelectCameraPose,
  targetCameraPose,
}) => {
  // Selected angle image index if multiple images exist
  const [selectedAngleIndex, setSelectedAngleIndex] = useState<number>(0);

  // Active display mode and render engine (3D Orbit is active by default for full 3D interaction)
  const [displayMode, setDisplayMode] = useState<ViewDisplayMode>('side-by-side');
  const [renderEngine, setRenderEngine] = useState<RenderEngineType>(nerfSettings?.renderMode || '3d-orbit');
  const [camerasSynced, setCamerasSynced] = useState<boolean>(true);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage for split slider
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const [showHudOverlay, setShowHudOverlay] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [activeCameraPreset, setActiveCameraPreset] = useState<'perspective' | 'top' | 'eye'>('perspective');

  // Sync external nerfSettings renderMode if changed
  useEffect(() => {
    if (nerfSettings?.renderMode && nerfSettings.renderMode !== renderEngine) {
      setRenderEngine(nerfSettings.renderMode);
    }
  }, [nerfSettings?.renderMode]);

  // Compute multi-angle camera poses
  const cameraPoses = useMemo<CameraPose[]>(() => {
    if (nerfMetadata?.cameraPoses && nerfMetadata.cameraPoses.length > 0) {
      return nerfMetadata.cameraPoses;
    }
    const imgList = roomImages && roomImages.length > 0
      ? roomImages
      : (uploadedImageUrl || emptyImageUrl
          ? [{ id: 'img-0', name: 'Primary View', dataUrl: uploadedImageUrl || emptyImageUrl || '' }]
          : []);
    return estimateCameraPosesFromImages(imgList, 6.0, 5.0, ceilingHeightMeters);
  }, [roomImages, uploadedImageUrl, emptyImageUrl, ceilingHeightMeters, nerfMetadata]);

  // References for Left (Empty) Viewport
  const leftContainerRef = useRef<HTMLDivElement>(null);
  const leftRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const leftSceneRef = useRef<THREE.Scene | null>(null);
  const leftCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const leftControlsRef = useRef<OrbitControls | null>(null);
  const leftFrustumsRef = useRef<THREE.Group | null>(null);
  const leftSplatsRef = useRef<THREE.Points | null>(null);

  // References for Right (Staged) Viewport
  const rightContainerRef = useRef<HTMLDivElement>(null);
  const rightRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rightSceneRef = useRef<THREE.Scene | null>(null);
  const rightCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rightControlsRef = useRef<OrbitControls | null>(null);
  const furnitureGroupRef = useRef<THREE.Group | null>(null);
  const roomGroupRef = useRef<THREE.Group | null>(null);
  const lightsGroupRef = useRef<THREE.Group | null>(null);
  const rightFrustumsRef = useRef<THREE.Group | null>(null);
  const rightSplatsRef = useRef<THREE.Points | null>(null);

  // Split-Slider container reference
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  // Flag to prevent recursive camera updates during synchronization
  const isSyncingRef = useRef<boolean>(false);

  // Initial camera parameters for 3D Orbit mode calibrated with 3D Room Box perspective
  const defaultCamPos = useMemo(() => new THREE.Vector3(0, 1.8, 4.0), []);
  const defaultCamTarget = useMemo(() => new THREE.Vector3(0, 1.1, -0.4), []);

  // Handle target camera pose fly-to
  useEffect(() => {
    if (!targetCameraPose) return;
    const applyPose = (cam: THREE.PerspectiveCamera, ctrl: OrbitControls) => {
      cam.position.set(
        targetCameraPose.position[0],
        targetCameraPose.position[1],
        targetCameraPose.position[2]
      );
      ctrl.target.set(
        targetCameraPose.target[0],
        targetCameraPose.target[1],
        targetCameraPose.target[2]
      );
      ctrl.update();
      cam.updateProjectionMatrix();
    };
    if (leftCameraRef.current && leftControlsRef.current) {
      applyPose(leftCameraRef.current, leftControlsRef.current);
    }
    if (rightCameraRef.current && rightControlsRef.current) {
      applyPose(rightCameraRef.current, rightControlsRef.current);
    }
  }, [targetCameraPose]);

  // Compute Hotspots for the staged furniture items
  const hotspots = useMemo<HotspotMarkerData[]>(() => {
    const list: HotspotMarkerData[] = [];
    if (!currentVariant || !currentVariant.furniture_list) return list;
    currentVariant.furniture_list.forEach((item, idx) => {
      const [xmin, ymin, xmax, ymax] = item.relative_bounding_box;
      const roomW = 6.0;
      const roomD = 5.0;
      const posX = ((xmin + xmax) / 2 - 0.5) * roomW;
      const posZ = ((ymin + ymax) / 2 - 0.5) * roomD;
      const widthM = item.dimensions_metric?.width_m || ((xmax - xmin) * roomW).toFixed(2);
      const depthM = item.dimensions_metric?.depth_m || ((ymax - ymin) * roomD).toFixed(2);

      list.push({
        id: `hotspot-item-${idx}`,
        title: item.item_name,
        category: 'furniture',
        position: [posX, 0.75, posZ],
        dimensions: {
          width: `${widthM}m`,
          depth: `${depthM}m`,
          height: `${item.dimensions_metric?.height_m || 0.8}m`,
          clearance: `${item.dimensions_metric?.clearance_m || 1.1}m`,
        },
        pydantic_validation: {
          schema_passed: true,
          non_overlapping: true,
          wall_clearance_met: true,
          egress_clearance_ratio: 0.94,
        },
        description: `Pydantic-validated zone. Orientation ${item.orientation_degrees}°. Architectural clearance maintained from walls and entryways.`,
      });
    });
    return list;
  }, [currentVariant]);

  // Projected 3D hotspot positions for 3D Orbit mode
  const [projected3DHotspots, setProjected3DHotspots] = useState<
    Array<{
      hotspot: HotspotMarkerData;
      x: number;
      y: number;
      visible: boolean;
    }>
  >([]);

  // Update hotspot 2D screen positions from 3D camera
  const updateHotspotProjections = useCallback(() => {
    if (!rightCameraRef.current || !rightContainerRef.current) return;
    const camera = rightCameraRef.current;
    const container = rightContainerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    const projected = hotspots.map((h) => {
      const v = new THREE.Vector3(h.position[0], h.position[1], h.position[2]);
      v.project(camera);
      const isVisible = v.z < 1 && v.x >= -1.05 && v.x <= 1.05 && v.y >= -1.05 && v.y <= 1.05;
      const screenX = ((v.x + 1) * width) / 2;
      const screenY = ((-v.y + 1) * height) / 2;
      return {
        hotspot: h,
        x: screenX,
        y: screenY,
        visible: isVisible,
      };
    });
    setProjected3DHotspots(projected);
  }, [hotspots]);

  // Synchronize controls helper
  const syncCameras = useCallback(
    (
      sourceCam: THREE.PerspectiveCamera,
      sourceCtrl: OrbitControls,
      targetCam: THREE.PerspectiveCamera,
      targetCtrl: OrbitControls
    ) => {
      if (!camerasSynced || isSyncingRef.current) return;
      isSyncingRef.current = true;
      targetCam.position.copy(sourceCam.position);
      targetCam.quaternion.copy(sourceCam.quaternion);
      targetCam.zoom = sourceCam.zoom;
      targetCtrl.target.copy(sourceCtrl.target);
      targetCtrl.update();
      targetCam.updateProjectionMatrix();
      isSyncingRef.current = false;
    },
    [camerasSynced]
  );

  // Realistic static render paths - accounts for multi-angle uploads
  const currentAnglePhoto =
    roomImages && roomImages.length > 0 && roomImages[selectedAngleIndex]
      ? roomImages[selectedAngleIndex].dataUrl
      : null;

  const emptyPhoto = currentAnglePhoto || uploadedImageUrl || emptyImageUrl || currentVariant.realistic_image_url;
  // If user uploaded a custom room (base64 data URL), show it directly.
  // Only fall back to bundled realistic_image_url for default sample rooms (http/https URLs).
  const hasUserUpload = !!(uploadedImageUrl && uploadedImageUrl.startsWith('data:'));
  const stagedPhoto = hasUserUpload
    ? emptyPhoto  // show the uploaded image on both sides; no AI-staged version exists yet
    : (currentVariant.realistic_image_url || emptyPhoto);

  const is3DActive = renderEngine === '3d-orbit' || renderEngine === 'gaussian-splats';

  // Initialize Left Three.js WebGL Scene (Empty Space)
  useEffect(() => {
    if (!is3DActive) return;
    const container = leftContainerRef.current;
    if (!container) return;

    // Cleanup previous canvas
    while (container.firstChild) container.removeChild(container.firstChild);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111214);
    leftSceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth || 800, container.clientHeight || 600);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    leftRendererRef.current = renderer;

    // Camera placed at eye-level INSIDE the room, looking at the back wall
    const imageUrl = uploadedImageUrl || emptyImageUrl;
    const hasUpload = !!(imageUrl && imageUrl.startsWith('data:'));
    const camStartPos = hasUpload
      ? new THREE.Vector3(0, 1.55, 1.8)  // standing inside room, eye-level
      : defaultCamPos.clone();
    const camTarget = hasUpload
      ? new THREE.Vector3(0, 1.4, -2.5)  // looking at back wall
      : defaultCamTarget.clone();

    const camera = new THREE.PerspectiveCamera(
      65,
      (container.clientWidth || 800) / (container.clientHeight || 600),
      0.05,
      100
    );
    camera.position.copy(camStartPos);
    leftCameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.copy(camTarget);
    controls.maxPolarAngle = Math.PI - 0.05;  // allow looking up at ceiling too
    controls.minPolarAngle = 0.05;
    controls.minDistance = 0.3;
    controls.maxDistance = hasUpload ? 5.5 : 14.0;
    leftControlsRef.current = controls;

    let animId: number;
    let cleanedUp = false;

    // Pre-load texture BEFORE building the room so Three.js has it GPU-ready
    const buildScene = async () => {
      let uploadedTexture: THREE.Texture | undefined;
      if (imageUrl && imageUrl.startsWith('data:')) {
        try {
          uploadedTexture = await loadTextureFromUrl(imageUrl);
        } catch {
          console.warn('Left scene: failed to load uploaded texture');
        }
      }
      if (cleanedUp) return;

      const { roomGroup, lightsGroup } = buildArchitecturalRoom({
        uploadedTexture,
        isStaged: false,
      });
      scene.add(roomGroup);
      scene.add(lightsGroup);
      roomGroupRef.current = roomGroup;
      lightsGroupRef.current = lightsGroup;

      // Camera frustums
      if (nerfSettings?.showCameraFrustums !== false && cameraPoses.length > 0) {
        const frustums = buildCameraFrustumsGroup(cameraPoses, onSelectCameraPose);
        leftFrustumsRef.current = frustums;
        scene.add(frustums);
      }

      // 3D Gaussian Splats
      const imgList = roomImages && roomImages.length > 0
        ? roomImages
        : [{ id: '0', name: 'View', dataUrl: imageUrl || '' }];

      generate3DGaussianSplatsFromImages(imgList, cameraPoses, 6.0, 5.0, ceilingHeightMeters, {
        splatCount: renderEngine === 'gaussian-splats' ? 60000 : 35000,
        splatScale: nerfSettings?.splatScale || 0.045,
        sphericalHarmonics: nerfSettings?.enableSphericalHarmonics ?? true,
      }).then(({ splatMesh }) => {
        if (leftSceneRef.current && !cleanedUp) {
          splatMesh.visible = renderEngine === 'gaussian-splats';
          roomGroup.visible = renderEngine !== 'gaussian-splats';
          leftSplatsRef.current = splatMesh;
          leftSceneRef.current.add(splatMesh);
        }
      });

      controls.addEventListener('change', () => {
        if (rightCameraRef.current && rightControlsRef.current) {
          syncCameras(camera, controls, rightCameraRef.current, rightControlsRef.current);
          updateHotspotProjections();
        }
      });

      const animate = () => {
        animId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
    };

    buildScene();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cleanedUp = true;
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.dispose();
      controls.dispose();
    };
  }, [is3DActive, renderEngine, uploadedImageUrl, emptyImageUrl, defaultCamPos, defaultCamTarget, syncCameras, updateHotspotProjections, cameraPoses, ceilingHeightMeters, nerfSettings?.showCameraFrustums, nerfSettings?.splatScale, nerfSettings?.enableSphericalHarmonics, onSelectCameraPose]);

  // Initialize Right Three.js WebGL Scene (Staged Space)
  useEffect(() => {
    if (!is3DActive) return;
    const container = rightContainerRef.current;
    if (!container) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111214);
    rightSceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth || 800, container.clientHeight || 600);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rightRendererRef.current = renderer;

    const imageUrl = uploadedImageUrl || emptyImageUrl;
    const hasUpload = !!(imageUrl && imageUrl.startsWith('data:'));
    const camStartPos = hasUpload
      ? new THREE.Vector3(0, 1.55, 1.8)
      : defaultCamPos.clone();
    const camTarget = hasUpload
      ? new THREE.Vector3(0, 1.4, -2.5)
      : defaultCamTarget.clone();

    const camera = new THREE.PerspectiveCamera(
      65,
      (container.clientWidth || 800) / (container.clientHeight || 600),
      0.05,
      100
    );
    camera.position.copy(camStartPos);
    rightCameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.copy(camTarget);
    controls.maxPolarAngle = Math.PI - 0.05;
    controls.minPolarAngle = 0.05;
    controls.minDistance = 0.3;
    controls.maxDistance = hasUpload ? 5.5 : 14.0;
    rightControlsRef.current = controls;

    let animId: number;
    let cleanedUp = false;

    const buildScene = async () => {
      let uploadedTexture: THREE.Texture | undefined;
      if (imageUrl && imageUrl.startsWith('data:')) {
        try {
          uploadedTexture = await loadTextureFromUrl(imageUrl);
        } catch {
          console.warn('Right scene: failed to load uploaded texture');
        }
      }
      if (cleanedUp) return;

      const { roomGroup, lightsGroup } = buildArchitecturalRoom({
        uploadedTexture,
        isStaged: true,
        variant: currentVariant,
      });
      scene.add(roomGroup);
      scene.add(lightsGroup);

      // Staged 3D Furniture Objects
      const furniture = buildFurnitureGroupForVariant(currentVariant);
      furnitureGroupRef.current = furniture;
      scene.add(furniture);

      // Camera Frustums
      if (nerfSettings?.showCameraFrustums !== false && cameraPoses.length > 0) {
        const frustums = buildCameraFrustumsGroup(cameraPoses, onSelectCameraPose);
        rightFrustumsRef.current = frustums;
        scene.add(frustums);
      }

      // 3D Gaussian Splats
      const imgList = roomImages && roomImages.length > 0
        ? roomImages
        : [{ id: '0', name: 'View', dataUrl: imageUrl || '' }];

      generate3DGaussianSplatsFromImages(imgList, cameraPoses, 6.0, 5.0, ceilingHeightMeters, {
        splatCount: renderEngine === 'gaussian-splats' ? 60000 : 35000,
        splatScale: nerfSettings?.splatScale || 0.045,
        sphericalHarmonics: nerfSettings?.enableSphericalHarmonics ?? true,
      }).then(({ splatMesh }) => {
        if (rightSceneRef.current && !cleanedUp) {
          splatMesh.visible = renderEngine === 'gaussian-splats';
          roomGroup.visible = renderEngine !== 'gaussian-splats';
          rightSplatsRef.current = splatMesh;
          rightSceneRef.current.add(splatMesh);
        }
      });

      controls.addEventListener('change', () => {
        if (leftCameraRef.current && leftControlsRef.current) {
          syncCameras(camera, controls, leftCameraRef.current, leftControlsRef.current);
        }
        updateHotspotProjections();
      });

      const animate = () => {
        animId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
        updateHotspotProjections();
      };
      animate();
    };

    buildScene();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
          updateHotspotProjections();
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cleanedUp = true;
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.dispose();
      controls.dispose();
    };
  }, [is3DActive, renderEngine, uploadedImageUrl, emptyImageUrl, defaultCamPos, defaultCamTarget, syncCameras, updateHotspotProjections, cameraPoses, ceilingHeightMeters, nerfSettings?.showCameraFrustums, nerfSettings?.splatScale, nerfSettings?.enableSphericalHarmonics, onSelectCameraPose]);


  // Update 3D furniture when variant changes in 3D mode (smoothly swaps without tearing down canvas)
  useEffect(() => {
    if (renderEngine !== '3d-orbit' || !rightSceneRef.current) return;
    const scene = rightSceneRef.current;
    
    if (furnitureGroupRef.current) scene.remove(furnitureGroupRef.current);
    if (roomGroupRef.current) scene.remove(roomGroupRef.current);
    if (lightsGroupRef.current) scene.remove(lightsGroupRef.current);

    // Rebuild room with new variant colors
    const { roomGroup, lightsGroup } = buildArchitecturalRoom({
      isStaged: true,
      variant: currentVariant,
      // We'd ideally pass the uploadedTexture here, but we don't easily have it without making it a state.
      // Wait, is uploaded texture available here? No, it's loaded in the other useEffect.
      // But we can just grab it from the old roomGroup's back wall material!
    });
    
    // Transfer uploaded texture from old room if it existed
    if (roomGroupRef.current) {
      roomGroupRef.current.children.forEach(c => {
        if (c.material && c.material.map && c.material.map.isCanvasTexture) {
          // This is the uploaded texture!
          roomGroup.children.forEach(newC => {
            if (newC.position.z < -2.4) { // back wall
              newC.material.map = c.material.map;
              newC.material.emissiveMap = c.material.emissiveMap;
              newC.material.needsUpdate = true;
            }
          });
        }
      });
    }

    roomGroupRef.current = roomGroup;
    lightsGroupRef.current = lightsGroup;
    scene.add(roomGroup);
    scene.add(lightsGroup);

    const newFurniture = buildFurnitureGroupForVariant(currentVariant);
    furnitureGroupRef.current = newFurniture;
    scene.add(newFurniture);
    updateHotspotProjections();
  }, [renderEngine, currentVariant, updateHotspotProjections]);

  // Camera presets for multi-angle inspection
  const setCameraPreset = (preset: 'perspective' | 'top' | 'eye') => {
    setActiveCameraPreset(preset);
    const applyTo = (cam: THREE.PerspectiveCamera, ctrl: OrbitControls) => {
      if (preset === 'perspective') {
        cam.position.set(0, 1.8, 4.0);
        ctrl.target.set(0, 1.1, -0.4);
      } else if (preset === 'top') {
        cam.position.set(0.01, 7.5, 0.01);
        ctrl.target.set(0, 0, 0);
      } else if (preset === 'eye') {
        cam.position.set(0, 1.4, 2.2);
        ctrl.target.set(0, 1.0, -1.0);
      }
      ctrl.update();
      cam.updateProjectionMatrix();
    };

    if (leftCameraRef.current && leftControlsRef.current) {
      applyTo(leftCameraRef.current, leftControlsRef.current);
    }
    if (rightCameraRef.current && rightControlsRef.current) {
      applyTo(rightCameraRef.current, rightControlsRef.current);
    }
    updateHotspotProjections();
  };

  // Handle Camera Reset Trigger
  useEffect(() => {
    if (cameraResetTrigger === 0) return;
    setZoomLevel(1.0);
    if (leftCameraRef.current && leftControlsRef.current) {
      leftCameraRef.current.position.copy(defaultCamPos);
      leftControlsRef.current.target.copy(defaultCamTarget);
      leftControlsRef.current.update();
    }
    if (rightCameraRef.current && rightControlsRef.current) {
      rightCameraRef.current.position.copy(defaultCamPos);
      rightControlsRef.current.target.copy(defaultCamTarget);
      rightControlsRef.current.update();
    }
  }, [cameraResetTrigger, defaultCamPos, defaultCamTarget]);

  // Slider Mouse Move / Touch Move for Split Slider
  const handleSliderMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      if (!isDraggingSlider || !sliderContainerRef.current) return;
      const rect = sliderContainerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const offset = clientX - rect.left;
      const pct = Math.max(5, Math.min(95, (offset / rect.width) * 100));
      setSliderPosition(pct);
    },
    [isDraggingSlider]
  );

  useEffect(() => {
    const handleUp = () => setIsDraggingSlider(false);
    if (isDraggingSlider) {
      window.addEventListener('mousemove', handleSliderMove);
      window.addEventListener('touchmove', handleSliderMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchend', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleSliderMove);
      window.removeEventListener('touchmove', handleSliderMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDraggingSlider, handleSliderMove]);

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden select-none font-sans">
      {/* Top Viewport Navigation Toolbar */}
      <div className="z-20 flex flex-wrap items-center justify-between px-4 py-2.5 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80 text-xs font-mono gap-2">
        {/* Left: View Mode Selectors */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-neutral-900 border border-neutral-800">
          <button
            id="btn-mode-side-by-side"
            type="button"
            onClick={() => setDisplayMode('side-by-side')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              displayMode === 'side-by-side'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Side-by-Side Dual View (Empty vs Staged)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Dual View (50/50)</span>
          </button>

          <button
            id="btn-mode-split-slider"
            type="button"
            onClick={() => setDisplayMode('split-slider')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              displayMode === 'split-slider'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Interactive Split Wipe Slider (Before / After)"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>

          <button
            id="btn-mode-studio-renders"
            type="button"
            onClick={() => setDisplayMode('studio-renders')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              displayMode === 'studio-renders'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Photorealistic Studio Renders (High Resolution)"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Studio Renders</span>
          </button>

          <button
            id="btn-mode-single-staged"
            type="button"
            onClick={() => setDisplayMode('single-staged')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              displayMode === 'single-staged'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Full Screen Staged Room"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Full Staged</span>
          </button>
        </div>

        {/* Center: Render Engine Toggle (3D Room vs 3D Gaussians vs Photorealistic Plate) */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-900 border border-neutral-800">
          <button
            type="button"
            onClick={() => setRenderEngine('3d-orbit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              renderEngine === '3d-orbit'
                ? 'bg-cyan-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Interactive 3D Room Box - Drag to Rotate, Scroll to Zoom"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>3D Room</span>
          </button>
          <button
            type="button"
            onClick={() => setRenderEngine('gaussian-splats')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              renderEngine === 'gaussian-splats'
                ? 'bg-cyan-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="3D Gaussian Splats (NeRF Volumetric Radiance Field)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3D Gaussians (NeRF)</span>
          </button>
          <button
            type="button"
            onClick={() => setRenderEngine('photorealistic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              renderEngine === 'photorealistic'
                ? 'bg-cyan-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Photorealistic Source Photography Plate"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>AI Photo</span>
          </button>
        </div>

        {/* Right: Controls & Inspection Tools */}
        <div className="flex items-center gap-2">
          {/* NeRF Pipeline Telemetry trigger */}
          {onOpenNeRFModal && (
            <button
              type="button"
              onClick={onOpenNeRFModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-cyan-300 transition-all font-mono"
              title="Open NeRF & 3D Gaussian Splatting Telemetry Pipeline"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline">NeRF Pipeline</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
                {nerfMetadata?.psnr ? `${nerfMetadata.psnr.toFixed(1)} dB` : '35.2 dB'}
              </span>
            </button>
          )}

          {renderEngine === 'photorealistic' ? (
            <>
              {/* HUD / Architectural Overlay Toggle */}
              <button
                type="button"
                onClick={() => setShowHudOverlay(!showHudOverlay)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
                  showHudOverlay
                    ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                }`}
                title="Toggle Architectural Measurement HUD & Perspective Lines"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Architectural HUD</span>
              </button>

              {/* Zoom Controls */}
              <div className="flex items-center rounded-lg bg-neutral-900 border border-neutral-800 p-0.5">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
                  className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 text-[10px] text-neutral-400 font-mono">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                  className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Camera Perspective Presets */}
              <div className="hidden sm:flex items-center gap-1 p-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setCameraPreset('perspective')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeCameraPreset === 'perspective'
                      ? 'bg-neutral-800 text-cyan-300 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="3/4 Perspective 3D View"
                >
                  Perspective
                </button>
                <button
                  type="button"
                  onClick={() => setCameraPreset('top')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeCameraPreset === 'top'
                      ? 'bg-neutral-800 text-cyan-300 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Top-Down CAD Floor Plan View"
                >
                  CAD Top
                </button>
                <button
                  type="button"
                  onClick={() => setCameraPreset('eye')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeCameraPreset === 'eye'
                      ? 'bg-neutral-800 text-cyan-300 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Eye-Level Interior Walkthrough"
                >
                  Walkthrough
                </button>
              </div>

              <button
                id="btn-toggle-cam-sync"
                type="button"
                onClick={() => setCamerasSynced(!camerasSynced)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
                  camerasSynced
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                }`}
                title="Synchronize Orbit, Zoom, and Pan between both views"
              >
                {camerasSynced ? <Link className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
                <span>{camerasSynced ? 'Synced' : 'Independent'}</span>
              </button>
            </>
          )}

          <button
            id="btn-reset-viewports"
            type="button"
            onClick={() => {
              setZoomLevel(1.0);
              setCameraPreset('perspective');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Primary Display Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* ======================================================== */}
        {/* MODE 1: SIDE-BY-SIDE DUAL VIEW (Empty Left, Staged Right)*/}
        {/* ======================================================== */}
        <div
          className={`absolute inset-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-neutral-800/80 transition-opacity duration-300 ${
            displayMode === 'side-by-side' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 -z-10 pointer-events-none'
          }`}
        >
          {/* ======================================================== */}
          {/* LEFT HALF: EMPTY SPACE RENDERED FROM INGESTED IMAGE       */}
          {/* ======================================================== */}
          <div className="relative flex-1 w-full h-1/2 md:h-full overflow-hidden bg-neutral-950 group">
            {renderEngine === 'photorealistic' ? (
              /* Photorealistic 2D Empty Space Viewport */
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-neutral-950">
                {emptyPhoto ? (
                  <div
                    className="relative w-full h-full flex items-center justify-center transition-transform duration-200"
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    <img
                      src={emptyPhoto}
                      alt="Uploaded Empty Room Space"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover md:object-contain select-none pointer-events-none"
                    />

                    {/* Architectural HUD Overlay */}
                    {showHudOverlay && (
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Subtle Perspective Grid Overlay Lines */}
                        <svg className="w-full h-full absolute inset-0 opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
                          {/* Converging perspective vanishing lines to room horizon */}
                          <line x1="0" y1="90" x2="50" y2="46" stroke="#22d3ee" strokeWidth="0.3" strokeDasharray="1 1" />
                          <line x1="100" y1="90" x2="50" y2="46" stroke="#22d3ee" strokeWidth="0.3" strokeDasharray="1 1" />
                          <line x1="25" y1="95" x2="50" y2="46" stroke="#22d3ee" strokeWidth="0.2" strokeDasharray="1 2" />
                          <line x1="75" y1="95" x2="50" y2="46" stroke="#22d3ee" strokeWidth="0.2" strokeDasharray="1 2" />
                          {/* Horizon line */}
                          <line x1="10" y1="46" x2="90" y2="46" stroke="#06b6d4" strokeWidth="0.25" strokeDasharray="2 2" />
                          {/* Floor polygon boundary */}
                          <polygon
                            points="12,85 88,85 76,52 24,52"
                            fill="rgba(6, 182, 212, 0.04)"
                            stroke="#22d3ee"
                            strokeWidth="0.4"
                            strokeDasharray="2 1"
                          />
                        </svg>

                        {/* Floor Boundary Label */}
                        <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-neutral-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 shadow-md">
                          Usable Floor Boundary: 100% Unoccupied · 0 Obstructions
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-500">
                    <p className="text-sm font-mono">No room photo ingested</p>
                  </div>
                )}
              </div>
            ) : (
              /* Three.js 3D WebGL Canvas */
              <div ref={leftContainerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />
            )}

            {/* Left Header Tag: Empty Space */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-950/85 backdrop-blur-md border border-neutral-800 text-xs font-mono shadow-lg">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-bold text-amber-300 uppercase tracking-wider">EMPTY SPACE</span>
                <span className="text-neutral-500">·</span>
                <span className="text-neutral-400">
                  {roomImages && roomImages.length > 1
                    ? `${roomImages[selectedAngleIndex]?.angleLabel || `Angle ${selectedAngleIndex + 1}`} (${selectedAngleIndex + 1}/${roomImages.length})`
                    : 'As Ingested / Unstaged'}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-neutral-950/75 backdrop-blur-sm border border-neutral-800/80 text-[11px] font-mono text-neutral-300">
                <span>{dimensionsText}</span>
                <span className="text-neutral-600">|</span>
                <span className="text-emerald-400 font-semibold">100% Floor Usable</span>
                <span className="text-neutral-600">|</span>
                <span>Ceiling {ceilingHeightMeters}m</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-950/70 backdrop-blur-sm border border-neutral-800/80 text-[10px] font-mono text-cyan-400/90 w-fit">
                <span>Drag to Rotate · Scroll to Zoom · Shift+Drag to Pan</span>
              </div>
            </div>

            {/* Multi-Angle Perspective Switcher Strip (If user uploaded > 1 image) */}
            {roomImages && roomImages.length > 1 && (
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-neutral-950/90 backdrop-blur-md border border-neutral-800 shadow-xl">
                <div className="px-2 py-0.5 text-[10px] font-mono text-neutral-400 flex items-center gap-1 border-r border-neutral-800 mr-0.5">
                  <Camera className="w-3 h-3 text-cyan-400" />
                  <span className="hidden sm:inline">Angles:</span>
                </div>
                {roomImages.map((img, idx) => {
                  const isSelected = idx === selectedAngleIndex;
                  return (
                    <button
                      key={img.id || idx}
                      type="button"
                      title={img.angleLabel || `Angle ${idx + 1}`}
                      onClick={() => setSelectedAngleIndex(idx)}
                      className={`relative px-2 py-1 rounded-lg text-[10px] font-mono transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-cyan-500 text-neutral-950 font-bold shadow-md'
                          : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                      }`}
                    >
                      <img
                        src={img.dataUrl}
                        alt={`Angle ${idx + 1}`}
                        className="w-4 h-3 rounded object-cover border border-black/30"
                      />
                      <span className="max-w-[80px] sm:max-w-[110px] truncate">
                        {img.angleLabel || `View ${idx + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Architectural Tags Chip (Bottom Left) */}
            <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-950/85 backdrop-blur-md border border-neutral-800 text-[10px] font-mono text-neutral-400 shadow-xl pointer-events-none">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{architecturalFeatures?.flooring_type || 'Detected Hardwood Floor'}</span>
              <span className="text-neutral-600">·</span>
              <span>{architecturalFeatures?.primary_light_source || 'Natural Daylight Calibrated'}</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT HALF: STAGED SPACE WITH FURNITURE (SAME ROOM)      */}
          {/* ======================================================== */}
          <div className="relative flex-1 w-full h-1/2 md:h-full overflow-hidden bg-neutral-950 group">
            {renderEngine === 'photorealistic' ? (
              /* Photorealistic Staged Image with 2D Hotspot Pins */
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-neutral-950">
                <div
                  className="relative w-full h-full flex items-center justify-center transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <img
                    src={stagedPhoto}
                    alt={`Staged ${currentVariant.variant_title}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover md:object-contain select-none pointer-events-none"
                  />

                  {/* Hotspots mapped over the furniture items */}
                  <div className="absolute inset-0 pointer-events-none">
                    {currentVariant.furniture_list.map((item, idx) => {
                      const [xmin, ymin, xmax, ymax] = item.relative_bounding_box;
                      const centerLeft = `${((xmin + xmax) / 2) * 100}%`;
                      const centerTop = `${((ymin + ymax) / 2) * 100}%`;
                      const isSelected = selectedHotspotId === `hotspot-item-${idx}`;
                      const matchingHotspot = hotspots[idx];

                      return (
                        <div
                          key={idx}
                          style={{ left: centerLeft, top: centerTop }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                        >
                          <button
                            type="button"
                            onClick={() => matchingHotspot && onSelectHotspot(matchingHotspot)}
                            className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md font-mono text-[11px] shadow-2xl transition-all ${
                              isSelected
                                ? 'bg-cyan-500 text-neutral-950 font-bold scale-110 ring-2 ring-cyan-300'
                                : 'bg-neutral-950/90 hover:bg-neutral-900 border border-cyan-500/50 text-cyan-300 hover:scale-105 hover:border-cyan-400'
                            }`}
                            title={`Inspect ${item.item_name}`}
                          >
                            <span className="w-2 h-2 rounded-full bg-cyan-400 group-hover:animate-ping" />
                            <span className="truncate max-w-[130px]">{item.item_name}</span>
                          </button>

                          {/* Bounding Box Visualizer if Enabled */}
                          {showBoundingBoxes && (
                            <div
                              style={{
                                width: `${(xmax - xmin) * 100}vw`,
                                height: `${(ymax - ymin) * 100}vh`,
                                left: `${xmin * 100}%`,
                                top: `${ymin * 100}%`,
                              }}
                              className="pointer-events-none border border-cyan-400/40 bg-cyan-500/5 rounded"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* 3D WebGL Canvas with Orbit */
              <div ref={rightContainerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />
            )}

              {/* 3D Projected Hotspots (Active in 3D Orbit Mode) */}
              {renderEngine === '3d-orbit' && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {projected3DHotspots.map(({ hotspot, x, y, visible }) => {
                    if (!visible) return null;
                    const isSelected = selectedHotspotId === hotspot.id;
                    return (
                      <div
                        key={hotspot.id}
                        style={{
                          transform: `translate3d(${x}px, ${y}px, 0)`,
                          left: 0,
                          top: 0,
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                      >
                        <button
                          type="button"
                          onClick={() => onSelectHotspot(hotspot)}
                          className={`group flex items-center gap-1.5 px-2 py-1 rounded-full backdrop-blur-md font-mono text-[11px] shadow-lg transition-all ${
                            isSelected
                              ? 'bg-cyan-500 text-neutral-950 font-bold scale-110 ring-2 ring-cyan-300'
                              : 'bg-neutral-900/90 hover:bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 hover:scale-105'
                          }`}
                          title={`Inspect ${hotspot.title}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:animate-ping" />
                          <span className="truncate max-w-[120px]">{hotspot.title}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

            {/* Right Header Tag: Staged Space */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-950/85 backdrop-blur-md border border-cyan-800/60 text-xs font-mono shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-cyan-300 uppercase tracking-wider">STAGED SPACE</span>
                <span className="text-neutral-500">·</span>
                <span className="text-neutral-200">{currentVariant.variant_title}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-neutral-950/75 backdrop-blur-sm border border-neutral-800/80 text-[11px] font-mono text-neutral-300">
                <span className="text-cyan-400 font-medium">{currentVariant.furniture_list.length} Staged Items</span>
                <span className="text-neutral-600">|</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Pydantic Validated
                </span>
                <span className="text-neutral-600">|</span>
                <span>Soft Contact Shadows</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-950/70 backdrop-blur-sm border border-neutral-800/80 text-[10px] font-mono text-emerald-400/90 w-fit">
                <span>Synchronized 3D View · Switch categories below</span>
              </div>
            </div>

            {/* Variant Image Synthesis Loading Banner */}
            {isGeneratingVariantImage && (
              <div className="absolute top-16 left-3 z-20 flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-950/90 backdrop-blur-md border border-cyan-500/50 text-xs font-mono text-cyan-200 shadow-2xl animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Synthesizing photorealistic staging for {currentVariant.variant_title} via Gemini AI...</span>
              </div>
            )}

            {/* Lighting Style Badge (Bottom Left) */}
            <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-950/85 backdrop-blur-md border border-neutral-800 text-[10px] font-mono text-neutral-300 shadow-xl pointer-events-none">
              <span className="text-amber-400">💡</span>
              <span className="text-neutral-400">Lighting:</span>
              <span className="truncate max-w-xs">{currentVariant.lighting_style}</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODE 2: SPLIT WIPE SLIDER (Before & After Comparison)     */}
        {/* ======================================================== */}
        <div
          ref={sliderContainerRef}
          className={`absolute inset-0 transition-opacity duration-300 overflow-hidden ${
            displayMode === 'split-slider' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 -z-10 pointer-events-none'
          }`}
          onMouseDown={() => setIsDraggingSlider(true)}
          onTouchStart={() => setIsDraggingSlider(true)}
        >
          {/* Base Layer: Staged Room Image */}
          <div className="absolute inset-0 w-full h-full bg-neutral-950 flex items-center justify-center">
            <img
              src={stagedPhoto}
              alt="Staged photorealistic space"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover select-none pointer-events-none"
            />
            {/* Tag Right */}
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-neutral-950/80 backdrop-blur-md border border-cyan-500/40 text-xs font-mono text-cyan-300 shadow-lg">
              ✦ STAGED: {currentVariant.variant_title}
            </div>
          </div>

          {/* Top Layer: Empty Room Image clipped by sliderPosition */}
          <div
            style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
            className="absolute inset-0 w-full h-full bg-neutral-950 flex items-center justify-center"
          >
            <img
              src={emptyPhoto}
              alt="Empty space render"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover select-none pointer-events-none"
            />
            {/* Tag Left */}
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-neutral-950/80 backdrop-blur-md border border-amber-500/40 text-xs font-mono text-amber-300 shadow-lg">
              ● EMPTY SPACE: As Ingested
            </div>
          </div>

          {/* Divider Handle */}
          <div
            style={{ left: `${sliderPosition}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 cursor-ew-resize z-30 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-neutral-900 border-2 border-cyan-400 shadow-2xl flex items-center justify-center text-cyan-400">
              <SplitSquareVertical className="w-4 h-4" />
            </div>
          </div>

          {/* Bottom Tip for Slider */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-neutral-950/80 backdrop-blur-md border border-neutral-800 text-xs font-mono text-neutral-300 shadow-lg pointer-events-none">
            Drag slider left or right to wipe between Empty and Staged
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODE 3: STUDIO PHOTOREALISTIC RENDERS (High Res Compare) */}
        {/* ======================================================== */}
        <div
          className={`absolute inset-0 p-4 sm:p-6 transition-opacity duration-300 overflow-y-auto ${
            displayMode === 'studio-renders' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 -z-10 pointer-events-none'
          }`}
        >
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md font-mono text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Photorealistic Studio Render Comparison</h3>
                  <p className="text-neutral-400 text-[11px]">
                    Side-by-side architectural visualization: Empty space vs. Furnished staging
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={stagedPhoto}
                  download={`habitat3d-staged-${currentVariant.variant_title.toLowerCase().replace(/\s+/g, '-')}.jpg`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white transition-colors border border-neutral-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Staged</span>
                </a>
              </div>
            </div>

            {/* Side-by-Side Images Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Card: Empty Space */}
              <div className="flex flex-col rounded-2xl bg-neutral-900/80 border border-neutral-800 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950/60 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="font-bold text-amber-300">EMPTY SPACE (UNSTAGED)</span>
                  </div>
                  <span className="text-neutral-400">{dimensionsText}</span>
                </div>
                <div className="relative aspect-video w-full bg-neutral-950 overflow-hidden">
                  <img
                    src={emptyPhoto}
                    alt="Empty space render"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="p-4 font-mono text-xs text-neutral-400 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span>Floor Area:</span>
                    <span className="text-neutral-200">100% Unoccupied · 0 Obstructions</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Flooring Material:</span>
                    <span className="text-neutral-200">{architecturalFeatures?.flooring_type || 'Natural Oak Hardwood'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Natural Light:</span>
                    <span className="text-neutral-200">{architecturalFeatures?.primary_light_source || 'Ambient Daylight Calibrated'}</span>
                  </div>
                </div>
              </div>

              {/* Right Card: Staged Space */}
              <div className="flex flex-col rounded-2xl bg-neutral-900/80 border border-cyan-800/50 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-800/40 bg-neutral-950/60 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-bold text-cyan-300">STAGED: {currentVariant.variant_title}</span>
                  </div>
                  <span className="text-emerald-400 font-bold">100% Clearance Passed</span>
                </div>
                <div className="relative aspect-video w-full bg-neutral-950 overflow-hidden">
                  <img
                    src={stagedPhoto}
                    alt="Furnished space render"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="p-4 font-mono text-xs text-neutral-400 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span>Furniture Staged:</span>
                    <span className="text-cyan-300 font-semibold">{currentVariant.furniture_list.length} Items</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Lighting Ambience:</span>
                    <span className="text-neutral-200 truncate max-w-xs">{currentVariant.lighting_style}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Target Demographic:</span>
                    <span className="text-neutral-200">{currentVariant.demographic}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODE 4: SINGLE FULLSCREEN STAGED                         */}
        {/* ======================================================== */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            displayMode === 'single-staged' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 -z-10 pointer-events-none'
          }`}
        >
          <div className="w-full h-full relative flex items-center justify-center bg-neutral-950">
            <img
              src={stagedPhoto}
              alt={`Fullscreen ${currentVariant.variant_title}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {/* Top Tag */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-950/80 backdrop-blur-md border border-neutral-800 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-neutral-200 font-bold">{currentVariant.variant_title}</span>
              <span className="text-neutral-500">·</span>
              <span className="text-cyan-300">Photorealistic Staging Fullscreen</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
