import * as THREE from 'three';
import { StagingVariantPlan } from '../types';
import {
  getOakWoodTexture,
  getWalnutTexture,
  getBirchTexture,
  getWovenRugTexture,
  getPlasterWallTexture,
} from './photorealisticAssets';

export interface RoomBuildOptions {
  roomWidth?: number; // meters (default 6.0)
  roomDepth?: number; // meters (default 5.0)
  roomHeight?: number; // meters (default 3.0)
  uploadedImageUrl?: string;
  isStaged?: boolean;
}

/**
 * Creates the photorealistic architectural room enclosure:
 * Real oak hardwood floor, baseboard moldings, plaster walls, floor-to-ceiling windows,
 * sky view, direct sunlight stream, and soft shadows.
 */
export function buildArchitecturalRoom(options: RoomBuildOptions = {}): {
  roomGroup: THREE.Group;
  lightsGroup: THREE.Group;
} {
  const roomWidth = options.roomWidth || 6.0;
  const roomDepth = options.roomDepth || 5.0;
  const roomHeight = options.roomHeight || 3.0;

  const roomGroup = new THREE.Group();
  roomGroup.name = 'architectural_room_group';

  const lightsGroup = new THREE.Group();
  lightsGroup.name = 'lighting_group';

  // If an uploaded room image is provided, calibrate the scene to the real room image
  if (options.uploadedImageUrl) {
    // --- 1. Realistic Shadow Catcher Floor (aligned with uploaded room floor) ---
    const shadowFloorGeo = new THREE.PlaneGeometry(16, 16);
    const shadowFloorMat = new THREE.ShadowMaterial({
      opacity: 0.52,
    });
    const shadowFloor = new THREE.Mesh(shadowFloorGeo, shadowFloorMat);
    shadowFloor.rotation.x = -Math.PI / 2;
    shadowFloor.position.set(0, 0, 0);
    shadowFloor.receiveShadow = true;
    shadowFloor.name = 'calibrated_shadow_floor';
    roomGroup.add(shadowFloor);

    // Subtle architectural perspective floor grid
    const floorGrid = new THREE.GridHelper(10, 20, 0x06b6d4, 0x334155);
    floorGrid.position.set(0, 0.001, 0);
    (floorGrid.material as THREE.Material).transparent = true;
    (floorGrid.material as THREE.Material).opacity = 0.22;
    roomGroup.add(floorGrid);

    // --- 2. Camera-aligned Immersive Backdrop Plate ---
    const texLoader = new THREE.TextureLoader();
    texLoader.load(
      options.uploadedImageUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;

        const aspect = tex.image.width / tex.image.height;
        // Large panoramic backdrop plane positioned in the background
        const plateH = 7.5;
        const plateW = plateH * aspect;
        const plateGeo = new THREE.PlaneGeometry(plateW, plateH);
        const plateMat = new THREE.MeshBasicMaterial({
          map: tex,
          depthWrite: false,
        });
        const plate = new THREE.Mesh(plateGeo, plateMat);
        plate.position.set(0, plateH * 0.38, -5.2);
        plate.name = 'calibrated_room_backdrop';
        roomGroup.add(plate);
      },
      undefined,
      (err) => console.warn('Could not load room image backdrop', err)
    );

    // For empty space: draw detected usable floor boundary
    if (!options.isStaged) {
      const boundaryShape = new THREE.Shape();
      const hw = roomWidth * 0.42;
      const hd = roomDepth * 0.42;
      boundaryShape.moveTo(-hw, -hd);
      boundaryShape.lineTo(hw, -hd);
      boundaryShape.lineTo(hw, hd);
      boundaryShape.lineTo(-hw, hd);
      boundaryShape.closePath();

      const points = boundaryShape.getPoints();
      const geomPoints = new THREE.BufferGeometry().setFromPoints(
        points.map((p) => new THREE.Vector3(p.x, 0.015, p.y))
      );
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x22d3ee,
        linewidth: 2,
        transparent: true,
        opacity: 0.85,
      });
      const boundaryLine = new THREE.LineLoop(geomPoints, lineMat);
      roomGroup.add(boundaryLine);
    }

    // --- 3. Calibrated Natural Lighting for Uploaded Room ---
    const sunLight = new THREE.DirectionalLight(0xfff8ee, 1.8);
    sunLight.position.set(3.5, 5.0, 3.0);
    sunLight.target.position.set(0, 0.4, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0003;
    sunLight.shadow.radius = 2.5;
    lightsGroup.add(sunLight);
    lightsGroup.add(sunLight.target);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    lightsGroup.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xfffbf0, 0x475569, 0.55);
    hemiLight.position.set(0, 4, 0);
    lightsGroup.add(hemiLight);

    return { roomGroup, lightsGroup };
  }

  // --- STANDARD PROCEDURAL ROOM (Fallback when no image is uploaded) ---
  // --- 1. Realistic Oak Hardwood Floor ---
  const floorGeo = new THREE.PlaneGeometry(roomWidth, roomDepth, 32, 32);
  const woodTexture = getOakWoodTexture();
  const floorMat = new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.38,
    metalness: 0.04,
    bumpMap: woodTexture,
    bumpScale: 0.008,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 0);
  floor.receiveShadow = true;
  roomGroup.add(floor);

  // --- 2. Sunlight spill polygon on floor ---
  const sunSpillGeo = new THREE.PlaneGeometry(2.4, 3.2);
  const sunSpillMat = new THREE.MeshBasicMaterial({
    color: 0xfff3d6,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
  });
  const sunSpill = new THREE.Mesh(sunSpillGeo, sunSpillMat);
  sunSpill.rotation.x = -Math.PI / 2;
  sunSpill.rotation.z = -0.3;
  sunSpill.position.set(0.6, 0.002, 0.2);
  roomGroup.add(sunSpill);

  // --- 3. Baseboard Moldings (Satin White) ---
  const baseboardMat = new THREE.MeshStandardMaterial({
    color: 0xf3f3f0,
    roughness: 0.5,
  });
  const bbH = 0.14;
  const bbT = 0.025;

  // Back baseboard
  const bbBack = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, bbH, bbT), baseboardMat);
  bbBack.position.set(0, bbH / 2, -roomDepth / 2 + bbT / 2);
  roomGroup.add(bbBack);

  // Left baseboard
  const bbLeft = new THREE.Mesh(new THREE.BoxGeometry(bbT, bbH, roomDepth), baseboardMat);
  bbLeft.position.set(-roomWidth / 2 + bbT / 2, bbH / 2, 0);
  roomGroup.add(bbLeft);

  // Right baseboard (segments around window)
  const bbRight1 = new THREE.Mesh(new THREE.BoxGeometry(bbT, bbH, 1.0), baseboardMat);
  bbRight1.position.set(roomWidth / 2 - bbT / 2, bbH / 2, -roomDepth / 2 + 0.5);
  roomGroup.add(bbRight1);

  // --- 4. Plaster Architectural Walls ---
  const plasterTexture = getPlasterWallTexture();
  const wallMat = new THREE.MeshStandardMaterial({
    map: plasterTexture,
    color: 0xf5f3ee,
    roughness: 0.85,
    metalness: 0.0,
  });

  // Back Wall
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), wallMat);
  backWall.position.set(0, roomHeight / 2, -roomDepth / 2);
  backWall.receiveShadow = true;
  roomGroup.add(backWall);

  // Left Wall
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, roomHeight), wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
  leftWall.receiveShadow = true;
  roomGroup.add(leftWall);

  // --- 5. Floor-to-Ceiling Window Wall (Right) ---
  const windowGroup = new THREE.Group();
  windowGroup.position.set(roomWidth / 2, 0, 0);

  // Black architectural steel mullion frame
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e,
    roughness: 0.4,
    metalness: 0.8,
  });

  const winW = 3.6;
  const winH = 2.6;
  const frameThick = 0.06;

  // Outer frame
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(frameThick, frameThick, winW), frameMat);
  topBar.position.set(0, winH + 0.2, 0);
  windowGroup.add(topBar);

  const bottomBar = new THREE.Mesh(new THREE.BoxGeometry(frameThick, frameThick, winW), frameMat);
  bottomBar.position.set(0, 0.2, 0);
  windowGroup.add(bottomBar);

  const leftBar = new THREE.Mesh(new THREE.BoxGeometry(frameThick, winH, frameThick), frameMat);
  leftBar.position.set(0, winH / 2 + 0.2, -winW / 2);
  windowGroup.add(leftBar);

  const rightBar = new THREE.Mesh(new THREE.BoxGeometry(frameThick, winH, frameThick), frameMat);
  rightBar.position.set(0, winH / 2 + 0.2, winW / 2);
  windowGroup.add(rightBar);

  // Vertical Mullions (divide into 3 glass panes)
  for (let m = -1; m <= 1; m += 2) {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(frameThick * 0.7, winH, frameThick * 0.7), frameMat);
    mullion.position.set(0, winH / 2 + 0.2, (m * winW) / 3);
    windowGroup.add(mullion);
  }

  // Horizontal Transom Mullion
  const transom = new THREE.Mesh(new THREE.BoxGeometry(frameThick * 0.7, frameThick * 0.7, winW), frameMat);
  transom.position.set(0, winH * 0.7 + 0.2, 0);
  windowGroup.add(transom);

  // Subtle reflective window glass pane
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.15,
    roughness: 0.08,
    metalness: 0.1,
    transmission: 0.85,
    ior: 1.5,
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), glassMat);
  glass.rotation.y = -Math.PI / 2;
  glass.position.set(0, winH / 2 + 0.2, 0);
  windowGroup.add(glass);

  // Sky Backdrop outside the window
  const skyGeo = new THREE.PlaneGeometry(7.0, 4.5);
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 512;
  skyCanvas.height = 512;
  const sCtx = skyCanvas.getContext('2d')!;
  const skyGrad = sCtx.createLinearGradient(0, 0, 0, 512);
  skyGrad.addColorStop(0, '#5A8BBB');
  skyGrad.addColorStop(0.6, '#BBD2E8');
  skyGrad.addColorStop(0.85, '#E8E4D8');
  skyGrad.addColorStop(1, '#A4B89D');
  sCtx.fillStyle = skyGrad;
  sCtx.fillRect(0, 0, 512, 512);
  const skyTex = new THREE.CanvasTexture(skyCanvas);
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.rotation.y = -Math.PI / 2;
  sky.position.set(0.6, 2.0, 0);
  windowGroup.add(sky);

  roomGroup.add(windowGroup);

  // --- 6. Ceiling with Recessed Spotlights ---
  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0xfdfdfc,
    roughness: 0.9,
  });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, roomHeight, 0);
  roomGroup.add(ceiling);

  // Spot trims
  const spotPositions = [
    [-1.5, -1.2],
    [1.5, -1.2],
    [-1.5, 1.2],
    [1.5, 1.2],
  ];
  spotPositions.forEach(([sx, sz]) => {
    const bezel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    bezel.position.set(sx, roomHeight - 0.01, sz);
    roomGroup.add(bezel);

    const emitter = new THREE.Mesh(
      new THREE.CircleGeometry(0.05, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff2df })
    );
    emitter.rotation.x = Math.PI / 2;
    emitter.position.set(sx, roomHeight - 0.015, sz);
    roomGroup.add(emitter);
  });

  // --- 7. Lighting System ---
  // Directional warm sunlight streaming through the right window
  const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.4);
  sunLight.position.set(5.5, 4.2, 1.2);
  sunLight.target.position.set(0, 0.4, 0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 15;
  sunLight.shadow.camera.left = -4;
  sunLight.shadow.camera.right = 4;
  sunLight.shadow.camera.top = 4;
  sunLight.shadow.camera.bottom = -4;
  sunLight.shadow.bias = -0.0004;
  sunLight.shadow.radius = 2.2;
  lightsGroup.add(sunLight);
  lightsGroup.add(sunLight.target);

  // Soft sky ambient bounce
  const hemiLight = new THREE.HemisphereLight(0xedf4fc, 0x483a2c, 0.75);
  hemiLight.position.set(0, 4, 0);
  lightsGroup.add(hemiLight);

  // Soft ceiling fill light
  const ambientFill = new THREE.AmbientLight(0xfff8ee, 0.35);
  lightsGroup.add(ambientFill);

  return { roomGroup, lightsGroup };
}

/**
 * Builds photorealistic 3D furniture models based on the active variant plan:
 * Walnut executive desk, leather chair, area rugs, plants, platform bed, crib, etc.
 */
export function buildFurnitureGroupForVariant(variant: StagingVariantPlan): THREE.Group {
  const group = new THREE.Group();
  group.name = `furniture_variant_${variant.variant_title}`;

  const title = variant.variant_title.toLowerCase();

  if (title.includes('office') || title.includes('desk') || title.includes('work')) {
    buildOfficeFurniture(group);
  } else if (title.includes('nursery') || title.includes('kid') || title.includes('child')) {
    buildNurseryFurniture(group);
  } else {
    // Default to Guest Bedroom Suite
    buildBedroomFurniture(group);
  }

  return group;
}

/**
 * Helper to enable shadow casting & receiving on all meshes in a hierarchy
 */
function applyShadows(object: THREE.Object3D) {
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

/**
 * Helper to add soft contact shadow disk
 */
function addContactShadow(parent: THREE.Group, x: number, z: number, w: number, d: number, opacity = 0.35) {
  const shadowGeo = new THREE.PlaneGeometry(w, d);
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
  grad.addColorStop(0, `rgba(15, 12, 10, ${opacity})`);
  grad.addColorStop(0.7, `rgba(15, 12, 10, ${opacity * 0.4})`);
  grad.addColorStop(1, 'rgba(15, 12, 10, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const shadowTex = new THREE.CanvasTexture(canvas);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(x, 0.003, z);
  parent.add(shadow);
}

// ==========================================
// 1. EXECUTIVE HOME OFFICE FURNITURE SUITE
// ==========================================
function buildOfficeFurniture(parent: THREE.Group) {
  const officeGroup = new THREE.Group();

  // --- A. Area Rug under desk ---
  const rugGeo = new THREE.PlaneGeometry(2.8, 2.2);
  const rugTex = getWovenRugTexture('geometric');
  const rugMat = new THREE.MeshStandardMaterial({
    map: rugTex,
    roughness: 0.9,
    metalness: 0.0,
  });
  const rug = new THREE.Mesh(rugGeo, rugMat);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.005, 0.1);
  rug.receiveShadow = true;
  officeGroup.add(rug);

  // --- B. Solid Walnut Executive Desk ---
  const deskGroup = new THREE.Group();
  deskGroup.position.set(0, 0, 0);

  const walnutTex = getWalnutTexture();
  const woodMat = new THREE.MeshStandardMaterial({
    map: walnutTex,
    color: 0x422a1d,
    roughness: 0.35,
    metalness: 0.05,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.3,
    metalness: 0.85,
  });

  // Desktop Surface (1.8m x 0.85m x 0.04m)
  const topGeo = new THREE.BoxGeometry(1.8, 0.04, 0.85);
  const deskTop = new THREE.Mesh(topGeo, woodMat);
  deskTop.position.set(0, 0.74, 0);
  deskGroup.add(deskTop);

  // Leather Blotter Pad
  const blotterGeo = new THREE.BoxGeometry(0.85, 0.005, 0.5);
  const blotterMat = new THREE.MeshStandardMaterial({
    color: 0x1f1d1b,
    roughness: 0.7,
  });
  const blotter = new THREE.Mesh(blotterGeo, blotterMat);
  blotter.position.set(0, 0.762, 0.05);
  deskGroup.add(blotter);

  // Metal Trestle Legs (Left & Right)
  const legGeo = new THREE.BoxGeometry(0.05, 0.72, 0.75);
  const leftLeg = new THREE.Mesh(legGeo, metalMat);
  leftLeg.position.set(-0.75, 0.36, 0);
  deskGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, metalMat);
  rightLeg.position.set(0.75, 0.36, 0);
  deskGroup.add(rightLeg);

  // Ultrawide Curved Monitor
  const monitorGroup = new THREE.Group();
  monitorGroup.position.set(0, 0.76, -0.15);

  const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.008, 0.18), metalMat);
  monitorGroup.add(standBase);

  const standStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28), metalMat);
  standStem.position.set(0, 0.14, -0.04);
  monitorGroup.add(standStem);

  const screenGeo = new THREE.BoxGeometry(0.9, 0.32, 0.02);
  const screenCaseMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.4 });
  const screenCase = new THREE.Mesh(screenGeo, screenCaseMat);
  screenCase.position.set(0, 0.28, 0);

  // Glowing Screen Face
  const faceGeo = new THREE.PlaneGeometry(0.88, 0.3);
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = 512;
  faceCanvas.height = 256;
  const fCtx = faceCanvas.getContext('2d')!;
  fCtx.fillStyle = '#0F172A';
  fCtx.fillRect(0, 0, 512, 256);
  // Code editor lines
  fCtx.fillStyle = '#38BDF8';
  fCtx.fillRect(20, 25, 120, 10);
  fCtx.fillStyle = '#94A3B8';
  for (let i = 0; i < 10; i++) {
    fCtx.fillRect(20, 50 + i * 18, 180 + ((i * 45) % 200), 8);
  }
  const screenTex = new THREE.CanvasTexture(faceCanvas);
  const screenFaceMat = new THREE.MeshBasicMaterial({ map: screenTex });
  const screenFace = new THREE.Mesh(faceGeo, screenFaceMat);
  screenFace.position.set(0, 0, 0.011);
  screenCase.add(screenFace);

  monitorGroup.add(screenCase);
  deskGroup.add(monitorGroup);

  // Modern Brass Task Lamp
  const lampGroup = new THREE.Group();
  lampGroup.position.set(0.65, 0.76, -0.15);
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.9,
  });

  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.015, 24), brassMat);
  lampGroup.add(lampBase);

  const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.35, 16), brassMat);
  lampStem.position.set(0, 0.175, 0);
  lampGroup.add(lampStem);

  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.1, 24), brassMat);
  lampShade.rotation.x = Math.PI * 0.85;
  lampShade.position.set(0, 0.35, 0.06);
  lampGroup.add(lampShade);

  // Lamp Light Bulb Emissive + Light
  const lampLight = new THREE.PointLight(0xffdfa8, 0.6, 2.0);
  lampLight.position.set(0, 0.32, 0.08);
  lampGroup.add(lampLight);

  deskGroup.add(lampGroup);

  addContactShadow(deskGroup, 0, 0, 1.9, 0.95);
  officeGroup.add(deskGroup);

  // --- C. Ergonomic Leather Task Chair ---
  const chairGroup = new THREE.Group();
  chairGroup.position.set(0, 0, 0.7);

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.55,
    metalness: 0.1,
  });

  // 5-Star Chrome Base
  for (let s = 0; s < 5; s++) {
    const angle = (s * Math.PI * 2) / 5;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.32), metalMat);
    spoke.rotation.y = angle;
    spoke.position.set(Math.sin(angle) * 0.16, 0.06, Math.cos(angle) * 0.16);
    chairGroup.add(spoke);

    // Caster wheel
    const caster = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12), metalMat);
    caster.rotation.z = Math.PI / 2;
    caster.position.set(Math.sin(angle) * 0.32, 0.03, Math.cos(angle) * 0.32);
    chairGroup.add(caster);
  }

  // Cylinder stem
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.38, 16), metalMat);
  stem.position.set(0, 0.25, 0);
  chairGroup.add(stem);

  // Seat Cushion
  const seatGeo = new THREE.BoxGeometry(0.52, 0.08, 0.5);
  const seat = new THREE.Mesh(seatGeo, leatherMat);
  seat.position.set(0, 0.48, 0);
  chairGroup.add(seat);

  // Ergonomic Mesh Backrest
  const backGeo = new THREE.BoxGeometry(0.48, 0.55, 0.04);
  const backrest = new THREE.Mesh(backGeo, leatherMat);
  backrest.position.set(0, 0.78, 0.24);
  backrest.rotation.x = -0.08;
  chairGroup.add(backrest);

  // Armrests
  const armLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.28), metalMat);
  armLeft.position.set(-0.28, 0.62, 0.02);
  chairGroup.add(armLeft);

  const armRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.28), metalMat);
  armRight.position.set(0.28, 0.62, 0.02);
  chairGroup.add(armRight);

  addContactShadow(chairGroup, 0, 0, 0.7, 0.7);
  officeGroup.add(chairGroup);

  // --- D. Walnut Credenza / Bookshelf against back wall ---
  const credenzaGroup = new THREE.Group();
  credenzaGroup.position.set(-1.8, 0, -2.1);

  const credenzaGeo = new THREE.BoxGeometry(1.6, 0.75, 0.42);
  const credenza = new THREE.Mesh(credenzaGeo, woodMat);
  credenza.position.set(0, 0.375, 0);
  credenzaGroup.add(credenza);

  // Books and decorative vases on top
  const vaseMat = new THREE.MeshStandardMaterial({ color: 0xdfd8ca, roughness: 0.3 });
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.22, 16), vaseMat);
  vase.position.set(-0.5, 0.86, 0);
  credenzaGroup.add(vase);

  // Book row
  const bookColors = [0x991b1b, 0x1e3a8a, 0x14532d, 0xd97706];
  bookColors.forEach((col, bIdx) => {
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.18, 0.14),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 })
    );
    book.position.set(0.2 + bIdx * 0.04, 0.84, 0);
    credenzaGroup.add(book);
  });

  addContactShadow(credenzaGroup, 0, 0, 1.7, 0.5);
  officeGroup.add(credenzaGroup);

  // --- E. Fiddle Leaf Fig Indoor Plant ---
  const plantGroup = new THREE.Group();
  plantGroup.position.set(2.2, 0, -0.6);

  // Terracotta Planter
  const potMat = new THREE.MeshStandardMaterial({ color: 0xc2714f, roughness: 0.7 });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.48, 24), potMat);
  pot.position.set(0, 0.24, 0);
  plantGroup.add(pot);

  // Soil
  const soil = new THREE.Mesh(
    new THREE.CircleGeometry(0.24, 24),
    new THREE.MeshStandardMaterial({ color: 0x241810, roughness: 0.95 })
  );
  soil.rotation.x = -Math.PI / 2;
  soil.position.set(0, 0.47, 0);
  plantGroup.add(soil);

  // Stems and Leaves
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a4f,
    roughness: 0.35,
  });
  for (let l = 0; l < 8; l++) {
    const angle = (l * Math.PI * 2) / 8;
    const height = 0.55 + l * 0.12;
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.32), leafMat);
    leaf.rotation.set(0.3, angle, 0.2);
    leaf.position.set(Math.sin(angle) * 0.18, height, Math.cos(angle) * 0.18);
    plantGroup.add(leaf);
  }

  addContactShadow(plantGroup, 0, 0, 0.6, 0.6);
  officeGroup.add(plantGroup);

  // Framed Canvas Art on back wall
  const artGroup = new THREE.Group();
  artGroup.position.set(0.4, 1.8, -2.48);
  const frameGeo = new THREE.BoxGeometry(1.2, 0.9, 0.03);
  const frame = new THREE.Mesh(frameGeo, woodMat);
  artGroup.add(frame);

  const canvasArt = new THREE.Mesh(
    new THREE.PlaneGeometry(1.14, 0.84),
    new THREE.MeshStandardMaterial({ color: 0xded8cb, roughness: 0.9 })
  );
  canvasArt.position.set(0, 0, 0.016);
  artGroup.add(canvasArt);
  officeGroup.add(artGroup);

  applyShadows(officeGroup);
  parent.add(officeGroup);
}

// ==========================================
// 2. SCANDINAVIAN NURSERY FURNITURE SUITE
// ==========================================
function buildNurseryFurniture(parent: THREE.Group) {
  const nurseryGroup = new THREE.Group();

  const birchTex = getBirchTexture();
  const birchMat = new THREE.MeshStandardMaterial({
    map: birchTex,
    color: 0xf5deb3,
    roughness: 0.45,
  });

  // --- A. Natural Birch Convertible Crib ---
  const cribGroup = new THREE.Group();
  cribGroup.position.set(-1.4, 0, -0.6);

  // Mattress
  const mattressMat = new THREE.MeshStandardMaterial({ color: 0xfffdfa, roughness: 0.8 });
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 0.72), mattressMat);
  mattress.position.set(0, 0.38, 0);
  cribGroup.add(mattress);

  // Crib Corner Posts
  const postGeo = new THREE.BoxGeometry(0.045, 0.92, 0.045);
  const postOffsets = [
    [-0.68, -0.38],
    [0.68, -0.38],
    [-0.68, 0.38],
    [0.68, 0.38],
  ];
  postOffsets.forEach(([px, pz]) => {
    const post = new THREE.Mesh(postGeo, birchMat);
    post.position.set(px, 0.46, pz);
    cribGroup.add(post);
  });

  // Top & Bottom Rails
  const longRailGeo = new THREE.BoxGeometry(1.36, 0.04, 0.03);
  [-0.38, 0.38].forEach((rz) => {
    const railTop = new THREE.Mesh(longRailGeo, birchMat);
    railTop.position.set(0, 0.88, rz);
    cribGroup.add(railTop);

    const railBottom = new THREE.Mesh(longRailGeo, birchMat);
    railBottom.position.set(0, 0.28, rz);
    cribGroup.add(railBottom);
  });

  // Vertical Spindles
  const spindleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.58, 12);
  for (let sp = -6; sp <= 6; sp++) {
    [-0.38, 0.38].forEach((sz) => {
      const spindle = new THREE.Mesh(spindleGeo, birchMat);
      spindle.position.set(sp * 0.095, 0.58, sz);
      cribGroup.add(spindle);
    });
  }

  // Hanging Star & Moon Mobile
  const mobileGroup = new THREE.Group();
  mobileGroup.position.set(0, 1.45, 0);
  const mobileStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.4),
    new THREE.MeshBasicMaterial({ color: 0x888888 })
  );
  mobileGroup.add(mobileStem);

  const starMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.3 });
  for (let st = 0; st < 4; st++) {
    const star = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), starMat);
    const ang = (st * Math.PI) / 2;
    star.position.set(Math.cos(ang) * 0.16, -0.22, Math.sin(ang) * 0.16);
    mobileGroup.add(star);
  }
  cribGroup.add(mobileGroup);

  addContactShadow(cribGroup, 0, 0, 1.5, 0.9);
  nurseryGroup.add(cribGroup);

  // --- B. Cream Boucle Rocking Armchair ---
  const chairGroup = new THREE.Group();
  chairGroup.position.set(1.4, 0, 0.2);
  chairGroup.rotation.y = -0.4;

  const boucleMat = new THREE.MeshStandardMaterial({
    color: 0xf5efe6,
    roughness: 0.85,
  });

  const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.2, 0.68), boucleMat);
  seatCushion.position.set(0, 0.38, 0);
  chairGroup.add(seatCushion);

  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.65, 0.18), boucleMat);
  seatBack.position.set(0, 0.72, -0.26);
  chairGroup.add(seatBack);

  // Rocker Runners (Birch)
  const runnerGeo = new THREE.BoxGeometry(0.04, 0.03, 0.85);
  [-0.32, 0.32].forEach((rx) => {
    const runner = new THREE.Mesh(runnerGeo, birchMat);
    runner.position.set(rx, 0.04, 0);
    chairGroup.add(runner);

    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.25), birchMat);
    leg1.position.set(rx, 0.18, -0.2);
    chairGroup.add(leg1);

    const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.25), birchMat);
    leg2.position.set(rx, 0.18, 0.2);
    chairGroup.add(leg2);
  });

  addContactShadow(chairGroup, 0, 0, 0.85, 0.85);
  nurseryGroup.add(chairGroup);

  // --- C. Round Wool Cloud Playmat Rug ---
  const rugGeo = new THREE.CircleGeometry(1.1, 32);
  const cloudTex = getWovenRugTexture('cloud');
  const rugMat = new THREE.MeshStandardMaterial({
    map: cloudTex,
    roughness: 0.88,
  });
  const rug = new THREE.Mesh(rugGeo, rugMat);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0.1, 0.005, 0.4);
  rug.receiveShadow = true;
  nurseryGroup.add(rug);

  // --- D. Low Montessori 3-Tier Cubby Toy Shelf ---
  const shelfGroup = new THREE.Group();
  shelfGroup.position.set(0, 0, -2.15);

  const shelfGeo = new THREE.BoxGeometry(1.5, 0.62, 0.36);
  const shelf = new THREE.Mesh(shelfGeo, birchMat);
  shelf.position.set(0, 0.31, 0);
  shelfGroup.add(shelf);

  // Wooden toy blocks on top
  const blockColors = [0x60a5fa, 0xf472b6, 0x34d399, 0xfbbf24];
  blockColors.forEach((bc, bIdx) => {
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.08),
      new THREE.MeshStandardMaterial({ color: bc, roughness: 0.5 })
    );
    block.position.set(-0.35 + bIdx * 0.16, 0.66, 0);
    shelfGroup.add(block);
  });

  addContactShadow(shelfGroup, 0, 0, 1.6, 0.45);
  nurseryGroup.add(shelfGroup);

  applyShadows(nurseryGroup);
  parent.add(nurseryGroup);
}

// ==========================================
// 3. GUEST BEDROOM SUITE FURNITURE SUITE
// ==========================================
function buildBedroomFurniture(parent: THREE.Group) {
  const bedGroup = new THREE.Group();

  const walnutTex = getWalnutTexture();
  const woodMat = new THREE.MeshStandardMaterial({
    map: walnutTex,
    color: 0x483224,
    roughness: 0.4,
  });

  // --- A. Platform Bed Frame & Mattress ---
  const platformGroup = new THREE.Group();
  platformGroup.position.set(0, 0, -0.4);

  // Low upholstered bed base
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.75 });
  const bedBase = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.28, 2.15), baseMat);
  bedBase.position.set(0, 0.14, 0);
  platformGroup.add(bedBase);

  // Tall Vertical Tufted Headboard
  const headboardMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.15, 0.12), headboardMat);
  headboard.position.set(0, 0.65, -1.02);
  platformGroup.add(headboard);

  // White Linen Mattress
  const linenTex = getWovenRugTexture('linen');
  const linenMat = new THREE.MeshStandardMaterial({
    map: linenTex,
    color: 0xfafafa,
    roughness: 0.8,
  });
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.24, 2.05), linenMat);
  mattress.position.set(0, 0.4, 0.02);
  platformGroup.add(mattress);

  // Folded Layered Duvet
  const duvetMat = new THREE.MeshStandardMaterial({ color: 0xf0ede6, roughness: 0.75 });
  const duvet = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.1, 1.35), duvetMat);
  duvet.position.set(0, 0.52, 0.35);
  platformGroup.add(duvet);

  // Textured Knit Throw Blanket
  const throwMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });
  const throwB = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.04, 0.45), throwMat);
  throwB.position.set(0, 0.56, 0.78);
  platformGroup.add(throwB);

  // Four Sleeping Pillows
  const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
  const pOffsets = [
    [-0.45, -0.72],
    [0.45, -0.72],
    [-0.45, -0.52],
    [0.45, -0.52],
  ];
  pOffsets.forEach(([px, pz]) => {
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.35), pillowMat);
    pillow.rotation.x = -0.15;
    pillow.position.set(px, 0.58, pz);
    platformGroup.add(pillow);
  });

  addContactShadow(platformGroup, 0, 0, 2.1, 2.3);
  bedGroup.add(platformGroup);

  // --- B. Symmetrical Fluted Oak Nightstands & Brass Globe Lamps ---
  [-1.25, 1.25].forEach((nx) => {
    const nsGroup = new THREE.Group();
    nsGroup.position.set(nx, 0, -1.35);

    const nightstand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.52, 0.42), woodMat);
    nightstand.position.set(0, 0.26, 0);
    nsGroup.add(nightstand);

    // Warm Brass Sphere Lamp
    const lampStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.85 })
    );
    lampStem.position.set(0, 0.61, 0);
    nsGroup.add(lampStem);

    const globeLamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xffeed1 })
    );
    globeLamp.position.set(0, 0.72, 0);
    nsGroup.add(globeLamp);

    // Glowing warm pointlight
    const warmPt = new THREE.PointLight(0xffdfa8, 0.45, 2.2);
    warmPt.position.set(0, 0.72, 0);
    nsGroup.add(warmPt);

    addContactShadow(nsGroup, 0, 0, 0.6, 0.5);
    bedGroup.add(nsGroup);
  });

  // --- C. Large Plush Bedroom Area Rug ---
  const rugGeo = new THREE.PlaneGeometry(3.2, 2.8);
  const rugTex = getWovenRugTexture('linen');
  const rugMat = new THREE.MeshStandardMaterial({
    map: rugTex,
    color: 0xe8e4dc,
    roughness: 0.92,
  });
  const rug = new THREE.Mesh(rugGeo, rugMat);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.005, 0.1);
  rug.receiveShadow = true;
  bedGroup.add(rug);

  // --- D. End-of-Bed Walnut Luggage Bench ---
  const benchGroup = new THREE.Group();
  benchGroup.position.set(0, 0, 0.95);

  const benchFrame = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.04, 0.42), woodMat);
  benchFrame.position.set(0, 0.42, 0);
  benchGroup.add(benchFrame);

  const benchCushion = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.08, 0.38),
    new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.8 })
  );
  benchCushion.position.set(0, 0.48, 0);
  benchGroup.add(benchCushion);

  // 4 Slim Legs
  const legPositions = [
    [-0.6, -0.16],
    [0.6, -0.16],
    [-0.6, 0.16],
    [0.6, 0.16],
  ];
  legPositions.forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.012, 0.42), woodMat);
    leg.position.set(lx, 0.21, lz);
    benchGroup.add(leg);
  });

  addContactShadow(benchGroup, 0, 0, 1.45, 0.5);
  bedGroup.add(benchGroup);

  applyShadows(bedGroup);
  parent.add(bedGroup);
}
