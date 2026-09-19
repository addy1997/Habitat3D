import * as THREE from 'three';
import { StagingVariantPlan, FurniturePlacement } from '../types';
import {
  getOakWoodTexture,
  getWalnutTexture,
  getBirchTexture,
  getWovenRugTexture,
  getPlasterWallTexture,
  getMarbleTexture,
  getBoucleTexture,
  getTravertineTexture,
} from './photorealisticAssets';

export interface RoomBuildOptions {
  roomWidth?: number; // meters (default 6.0)
  roomDepth?: number; // meters (default 5.0)
  roomHeight?: number; // meters (default 3.0)
  uploadedImageUrl?: string;   // kept for legacy; prefer uploadedTexture
  uploadedTexture?: THREE.Texture; // pre-loaded texture, applied to back wall
  isStaged?: boolean;
  variant?: StagingVariantPlan;
}

/**
 * Asynchronously loads any URL (including base64 data: URLs) into a THREE.Texture.
 * Uses a native HTMLImageElement + CanvasTexture so it works for large data: URLs
 * that THREE.TextureLoader (XHR-based) fails to handle.
 */
export function loadTextureFromUrl(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Draw into an offscreen canvas so Three.js gets a CanvasTexture
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No 2D context')); return; }
      ctx.drawImage(img, 0, 0);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.needsUpdate = true;
      resolve(tex);
    };
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}


/**
 * Calculates Projective Camera UV Coordinates for 3D room surfaces.
 * This converts a 2D room photo into actual 3D spatial room surfaces
 * (Floor, Back Wall, Left Wall, Right Wall, Ceiling) with perspective alignment.
 */
export function applyProjectiveUVs(
  geometry: THREE.BufferGeometry,
  meshMatrixWorld: THREE.Matrix4,
  projectorCamera: THREE.PerspectiveCamera
) {
  projectorCamera.updateMatrixWorld(true);
  projectorCamera.updateProjectionMatrix();

  const projViewMatrix = new THREE.Matrix4().multiplyMatrices(
    projectorCamera.projectionMatrix,
    projectorCamera.matrixWorldInverse
  );

  const posAttr = geometry.getAttribute('position');
  const uvAttr = geometry.getAttribute('uv');
  const count = posAttr.count;

  const vertex = new THREE.Vector3();
  const worldPos = new THREE.Vector4();
  const clipPos = new THREE.Vector4();

  for (let i = 0; i < count; i++) {
    vertex.fromBufferAttribute(posAttr, i);
    worldPos.set(vertex.x, vertex.y, vertex.z, 1.0).applyMatrix4(meshMatrixWorld);
    clipPos.copy(worldPos).applyMatrix4(projViewMatrix);

    if (clipPos.w > 0.0001) {
      const u = (clipPos.x / clipPos.w) * 0.5 + 0.5;
      const v = (clipPos.y / clipPos.w) * 0.5 + 0.5;
      uvAttr.setXY(i, Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v)));
    }
  }
  uvAttr.needsUpdate = true;
}

/**
 * Converts a 2D room image into a true 3D architectural room model:
 * 1. 3D Floor Plane ($Y = 0$)
 * 2. 3D Back Wall Plane ($Z = -D/2$)
 * 3. 3D Left Wall Plane ($X = -W/2$)
 * 4. 3D Right Wall Plane ($X = W/2$)
 * 5. 3D Ceiling Plane ($Y = H$)
 * 6. Dense 3D Volumetric Depth Cloud unprojected from image pixels
 * 7. Baseboards, architectural trims, and directional daylight
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

  // --- Materials setup ---
  const woodTexture = getOakWoodTexture();
  const floorMat = new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.35,
    metalness: 0.05,
    bumpMap: woodTexture,
    bumpScale: 0.006,
  });

  const plasterTexture = getPlasterWallTexture();

  // Use a pre-loaded THREE.Texture if supplied (avoids async timing bugs).
  // The caller should load the texture via `loadTextureFromUrl()` first.
  const uploadedTex = options.uploadedTexture ?? null;

  const backWallMat = uploadedTex
    ? new THREE.MeshStandardMaterial({
        map: uploadedTex,
        roughness: 0.55,
        metalness: 0.0,
        // Slightly boost emissive so the image stays visible under any lighting
        emissiveMap: uploadedTex,
        emissive: new THREE.Color(0x111111),
      })
    : new THREE.MeshStandardMaterial({
        map: plasterTexture,
        color: 0xf5f3ee,
        roughness: 0.85,
      });

    const vColors = options.variant?.color_palette || [];
  const wallColor = vColors.length >= 2 ? parseInt(vColors[0].replace('#', '0x')) : 0xf5f3ee;
  const floorTint = vColors.length >= 3 ? parseInt(vColors[1].replace('#', '0x')) : 0xffffff;
  
  // Floor tinting
  floorMat.color = new THREE.Color(floorTint);
  floorMat.color.lerp(new THREE.Color(0xffffff), 0.6); // Keep it natural

  const leftWallMat = new THREE.MeshStandardMaterial({
    map: plasterTexture,
    color: wallColor,
    roughness: 0.85,
  });

  const rightWallMat = new THREE.MeshStandardMaterial({
    map: plasterTexture,
    color: wallColor,
    roughness: 0.85,
  });

  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0xfdfdfc,
    roughness: 0.9,
  });


  // --- 1. 3D Architectural Floor Mesh ---
  const floorGeo = new THREE.PlaneGeometry(roomWidth, roomDepth, 32, 32);
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(0, 0, 0);
  floorMesh.receiveShadow = true;
  floorMesh.name = 'architectural_floor_3d';
  floorMesh.updateMatrixWorld(true);
  roomGroup.add(floorMesh);

  // For empty space: draw subtle CAD grid and usable boundary clearance polygon
  if (!options.isStaged) {
    const floorGrid = new THREE.GridHelper(roomWidth, 14, 0x06b6d4, 0x334155);
    floorGrid.position.set(0, 0.002, 0);
    (floorGrid.material as THREE.Material).transparent = true;
    (floorGrid.material as THREE.Material).opacity = 0.35;
    roomGroup.add(floorGrid);

    const boundaryShape = new THREE.Shape();
    const hw = roomWidth * 0.44;
    const hd = roomDepth * 0.44;
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
    boundaryLine.name = 'usable_floor_boundary';
    roomGroup.add(boundaryLine);
  }

  // --- 2. Baseboard Moldings (Satin White) ---
  const baseboardMat = new THREE.MeshStandardMaterial({
    color: 0xf3f3f0,
    roughness: 0.5,
  });
  const bbH = 0.14;
  const bbT = 0.025;

  const bbBack = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, bbH, bbT), baseboardMat);
  bbBack.position.set(0, bbH / 2, -roomDepth / 2 + bbT / 2);
  roomGroup.add(bbBack);

  const bbLeft = new THREE.Mesh(new THREE.BoxGeometry(bbT, bbH, roomDepth), baseboardMat);
  bbLeft.position.set(-roomWidth / 2 + bbT / 2, bbH / 2, 0);
  roomGroup.add(bbLeft);

  const bbRight = new THREE.Mesh(new THREE.BoxGeometry(bbT, bbH, roomDepth), baseboardMat);
  bbRight.position.set(roomWidth / 2 - bbT / 2, bbH / 2, 0);
  roomGroup.add(bbRight);

  // --- 3. 3D Architectural Wall Meshes ---
  const backWallMesh = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight, 32, 32), backWallMat);
  backWallMesh.position.set(0, roomHeight / 2, -roomDepth / 2);
  backWallMesh.receiveShadow = true;
  backWallMesh.name = 'architectural_back_wall_3d';
  backWallMesh.updateMatrixWorld(true);
  roomGroup.add(backWallMesh);

  const leftWallMesh = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, roomHeight, 32, 32), leftWallMat);
  leftWallMesh.rotation.y = Math.PI / 2;
  leftWallMesh.position.set(-roomWidth / 2, roomHeight / 2, 0);
  leftWallMesh.receiveShadow = true;
  leftWallMesh.name = 'architectural_left_wall_3d';
  leftWallMesh.updateMatrixWorld(true);
  roomGroup.add(leftWallMesh);

  const rightWallMesh = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, roomHeight, 32, 32), rightWallMat);
  rightWallMesh.rotation.y = -Math.PI / 2;
  rightWallMesh.position.set(roomWidth / 2, roomHeight / 2, 0);
  rightWallMesh.receiveShadow = true;
  rightWallMesh.name = 'architectural_right_wall_3d';
  rightWallMesh.updateMatrixWorld(true);
  roomGroup.add(rightWallMesh);

  // --- 4. 3D Ceiling Mesh ---
  const ceilingMesh = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth, 32, 32), ceilingMat);
  ceilingMesh.rotation.x = Math.PI / 2;
  ceilingMesh.position.set(0, roomHeight, 0);
  ceilingMesh.name = 'architectural_ceiling_3d';
  ceilingMesh.updateMatrixWorld(true);
  roomGroup.add(ceilingMesh);

  // --- 5. Floor-to-Ceiling Architectural Window (Natural Daylight Source) ---
  // Only add when no uploaded image is covering the back wall, so it doesn't occlude the photo.
  if (!uploadedTex) {
    const windowFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const windowGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.85,
      transparent: true,
      opacity: 0.7,
    });

    const winW = 2.8;
    const winH = 2.2;
    const winZ = -roomDepth / 2 + 0.01;
    const winY = 1.4;

    // Window frame & mullions
    const frameOuter = new THREE.Mesh(new THREE.BoxGeometry(winW, winH, 0.04), windowFrameMat);
    frameOuter.position.set(0, winY, winZ);
    roomGroup.add(frameOuter);

    const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(winW - 0.1, winH - 0.1), windowGlassMat);
    glassPane.position.set(0, winY, winZ + 0.01);
    roomGroup.add(glassPane);

    // Vertical and Horizontal Mullions
    const vertMullion = new THREE.Mesh(new THREE.BoxGeometry(0.03, winH, 0.05), windowFrameMat);
    vertMullion.position.set(0, winY, winZ);
    roomGroup.add(vertMullion);

    const horizMullion = new THREE.Mesh(new THREE.BoxGeometry(winW, 0.03, 0.05), windowFrameMat);
    horizMullion.position.set(0, winY, winZ);
    roomGroup.add(horizMullion);
  }

  // --- 6. Lighting System ---
  const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
  sunLight.name = 'sun_directional_light';
  sunLight.position.set(5.0, 4.2, 1.5);
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
  sunLight.shadow.radius = 2.0;
  lightsGroup.add(sunLight);
  lightsGroup.add(sunLight.target);

  const hemiLight = new THREE.HemisphereLight(0xedf4fc, 0x483a2c, 0.85);
  hemiLight.name = 'hemi_ambient_light';
  hemiLight.position.set(0, 4, 0);
  lightsGroup.add(hemiLight);

  const ambientFill = new THREE.AmbientLight(0xfff8ee, 0.45);
  ambientFill.name = 'ambient_fill_light';
  lightsGroup.add(ambientFill);

  return { roomGroup, lightsGroup };
}

/**
 * Enable shadow casting & receiving on all meshes in a hierarchy
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
 * Adds soft contact shadow disk on floor
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

// ============================================================================
// INDIVIDUAL PROCEDURAL 3D FURNITURE BUILDERS (LIVING, BED, OFFICE, NURSERY)
// ============================================================================

export function createSofaMesh(width = 2.4, depth = 0.95, height = 0.78, fabricColor = 0x2d3139, styleId = 'minimalist'): THREE.Group {
  const group = new THREE.Group();
  const fabricMat = new THREE.MeshStandardMaterial({ color: fabricColor, roughness: 0.85 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2719, roughness: 0.6 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });

  if (styleId === 'industrial') {
    // Chesterfield: thick back/arms same height, low
    const seat = new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, depth), fabricMat);
    seat.position.y = 0.2; group.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(width, height - 0.4, 0.25), fabricMat);
    back.position.set(0, 0.4 + (height-0.4)/2, -depth/2 + 0.125); group.add(back);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.25, height - 0.4, depth), fabricMat);
    armL.position.set(-width/2 + 0.125, 0.4 + (height-0.4)/2, 0); group.add(armL);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.25, height - 0.4, depth), fabricMat);
    armR.position.set(width/2 - 0.125, 0.4 + (height-0.4)/2, 0); group.add(armR);
  } else if (styleId === 'midcentury') {
    // Tapered legs, slim profile
    const seat = new THREE.Mesh(new THREE.BoxGeometry(width - 0.2, 0.15, depth - 0.1), fabricMat);
    seat.position.y = 0.25; group.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(width - 0.2, height - 0.25, 0.15), fabricMat);
    back.position.set(0, 0.25 + (height-0.25)/2, -depth/2 + 0.1); 
    back.rotation.x = -0.1; group.add(back);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, depth - 0.1), woodMat);
    armL.position.set(-width/2 + 0.15, 0.4, 0); group.add(armL);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, depth - 0.1), woodMat);
    armR.position.set(width/2 - 0.15, 0.4, 0); group.add(armR);
    // Legs
    for (let x of [-1, 1]) for (let z of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.015, 0.25), woodMat);
      leg.position.set(x * (width/2 - 0.2), 0.125, z * (depth/2 - 0.2));
      leg.rotation.z = x * 0.15; leg.rotation.x = z * 0.15;
      group.add(leg);
    }
  } else if (styleId === 'classic' || styleId === 'coastal') {
    // Skirted, rolled arms
    const seat = new THREE.Mesh(new THREE.BoxGeometry(width, 0.45, depth), fabricMat);
    seat.position.y = 0.225; group.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(width, height - 0.45, 0.2), fabricMat);
    back.position.set(0, 0.45 + (height-0.45)/2, -depth/2 + 0.1); group.add(back);
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, depth, 16), fabricMat);
    armL.rotation.x = Math.PI/2; armL.position.set(-width/2 + 0.15, 0.5, 0); group.add(armL);
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, depth, 16), fabricMat);
    armR.rotation.x = Math.PI/2; armR.position.set(width/2 - 0.15, 0.5, 0); group.add(armR);
  } else {
    // Japandi / Minimalist: floor hugging thick block
    const seat = new THREE.Mesh(new THREE.BoxGeometry(width, 0.35, depth), fabricMat);
    seat.position.y = 0.175; group.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(width, height - 0.35, 0.25), fabricMat);
    back.position.set(0, 0.35 + (height-0.35)/2, -depth/2 + 0.125); group.add(back);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, depth), fabricMat);
    armL.position.set(-width/2 + 0.1, 0.45, 0); group.add(armL);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, depth), fabricMat);
    armR.position.set(width/2 - 0.1, 0.45, 0); group.add(armR);
  }

  group.castShadow = true;
  group.receiveShadow = true;
  group.children.forEach(c => { c.castShadow = true; c.receiveShadow = true; });
  return group;
}

export function createCoffeeTableMesh(width = 1.3, depth = 0.75, height = 0.42, tableStyle = 'travertine', styleId = 'minimalist'): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2719, roughness: 0.45 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
  const travMat = new THREE.MeshStandardMaterial({ color: 0xe6e1d6, roughness: 0.7 });

  if (styleId === 'midcentury') {
    // Oval / Kidney shaped
    const top = new THREE.Mesh(new THREE.CylinderGeometry(width/2, width/2, 0.05, 32), woodMat);
    top.scale.set(1, 1, depth/width);
    top.position.y = height - 0.025; group.add(top);
    for(let i=0; i<3; i++) {
      const angle = (i/3) * Math.PI * 2;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.01, height - 0.05), woodMat);
      leg.position.set(Math.cos(angle) * (width/2 - 0.15), (height-0.05)/2, Math.sin(angle) * (depth/2 - 0.15));
      leg.rotation.x = Math.sin(angle) * 0.2; leg.rotation.z = -Math.cos(angle) * 0.2;
      group.add(leg);
    }
  } else if (styleId === 'industrial') {
    // Metal pipe frame, wood top
    const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, depth), woodMat);
    top.position.y = height - 0.04; group.add(top);
    for (let x of [-1, 1]) for (let z of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, height - 0.08), metalMat);
      leg.position.set(x * (width/2 - 0.05), (height-0.08)/2, z * (depth/2 - 0.05));
      group.add(leg);
    }
  } else if (styleId === 'classic' || styleId === 'coastal') {
    // White painted wood, lower shelf
    const paintMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, depth), tableStyle === 'walnut' ? woodMat : paintMat);
    top.position.y = height - 0.025; group.add(top);
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, 0.03, depth - 0.1), paintMat);
    shelf.position.y = 0.15; group.add(shelf);
    for (let x of [-1, 1]) for (let z of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, height, 0.06), paintMat);
      leg.position.set(x * (width/2 - 0.05), height/2, z * (depth/2 - 0.05));
      group.add(leg);
    }
  } else {
    // Japandi / Minimalist: Solid low travertine block
    const block = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), travMat);
    block.position.y = height/2; group.add(block);
  }

  group.children.forEach(c => { c.castShadow = true; c.receiveShadow = true; });
  return group;
}

export function createArmchairMesh(width = 0.82, depth = 0.85, height = 0.82, isBoucle = true, styleId = 'minimalist', color = 0xdddddd): THREE.Group {
  return createSofaMesh(width, depth, height, color, styleId); // Re-use our robust sofa generator scaled down
}

export function createMediaCredenzaMesh(width = 2.0, depth = 0.45, height = 0.65, styleId = 'minimalist', color = 0x3d2719): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });

  if (styleId === 'industrial') {
    const box = new THREE.Mesh(new THREE.BoxGeometry(width, height - 0.15, depth), mat);
    box.position.y = 0.15 + (height-0.15)/2; group.add(box);
    for (let x of [-1, 1]) for (let z of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, height), metalMat);
      leg.position.set(x * (width/2 - 0.02), height/2, z * (depth/2 - 0.02));
      group.add(leg);
    }
  } else if (styleId === 'midcentury') {
    const box = new THREE.Mesh(new THREE.BoxGeometry(width, height - 0.2, depth), mat);
    box.position.y = 0.2 + (height-0.2)/2; group.add(box);
    for (let x of [-1, 1]) for (let z of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.01, 0.2), mat);
      leg.position.set(x * (width/2 - 0.1), 0.1, z * (depth/2 - 0.1));
      leg.rotation.z = x * 0.2; leg.rotation.x = z * 0.2;
      group.add(leg);
    }
  } else {
    // Minimalist / Coastal
    const box = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
    box.position.y = height/2; group.add(box);
  }
  
  group.children.forEach(c => { c.castShadow = true; c.receiveShadow = true; });
  return group;
}

export function createFloorLampMesh(height = 1.95, styleId = 'minimalist'): THREE.Group {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xc5a059, metalness: 0.9, roughness: 0.1 });
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0x443311, roughness: 0.9, transparent: true, opacity: 0.9 });
  const fabricMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });

  if (styleId === 'japandi' || styleId === 'boho') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05), metalMat);
    base.position.y = 0.025; group.add(base);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, height - 0.4), metalMat);
    pole.position.y = (height - 0.4)/2; group.add(pole);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), paperMat);
    globe.position.y = height - 0.2; group.add(globe);
  } else if (styleId === 'midcentury') {
    // Arc lamp
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05), brassMat);
    base.position.y = 0.025; group.add(base);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, height), brassMat);
    pole.position.y = height/2; group.add(pole);
    const shade = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 16, 0, Math.PI*2, 0, Math.PI/2), metalMat);
    shade.position.set(0.4, height, 0); 
    shade.rotation.z = -0.5; group.add(shade);
    const connector = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.4), brassMat);
    connector.position.set(0.2, height, 0); connector.rotation.z = Math.PI/2; group.add(connector);
  } else {
    // Classic / Default
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05), metalMat);
    base.position.y = 0.025; group.add(base);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, height - 0.3), metalMat);
    pole.position.y = (height - 0.3)/2; group.add(pole);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 0.3), fabricMat);
    shade.position.y = height - 0.15; group.add(shade);
  }
  
  group.children.forEach(c => { c.castShadow = true; });
  return group;
}

export function createPottedPlantMesh(styleId = 'minimalist'): THREE.Group {
  const group = new THREE.Group();
  const potMat = new THREE.MeshStandardMaterial({ color: styleId==='boho' ? 0xcc6633 : 0xe0e0e0, roughness: 0.8 });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.4), potMat);
  pot.position.y = 0.2; group.add(pot);
  
  const plantMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.6 });
  const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), plantMat);
  leaves.scale.set(1, 1.5, 1);
  leaves.position.y = 0.8; group.add(leaves);
  
  group.children.forEach(c => { c.castShadow = true; });
  return group;
}

export function createAreaRugMesh(width = 3.0, depth = 2.4, pattern: string = 'geometric', color = 0xdddddd): THREE.Group {
  const group = new THREE.Group();
  const rugMat = new THREE.MeshStandardMaterial({ color, roughness: 0.92 });
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), rugMat);
  rug.rotation.x = -Math.PI / 2;
  rug.receiveShadow = true;
  group.add(rug);
  return group;
}

export function createDeskMesh(width = 1.8, depth = 0.85, height = 0.75, styleId = 'minimalist', color = 0x3d2719): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });

  if (styleId === 'industrial') {
    const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, depth), mat);
    top.position.y = height - 0.025; group.add(top);
    for (let x of [-1, 1]) for (let z of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, height - 0.05), metalMat);
      leg.position.set(x * (width/2 - 0.05), (height-0.05)/2, z * (depth/2 - 0.05));
      group.add(leg);
    }
  } else {
    // Standard wood desk
    const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, depth), mat);
    top.position.y = height - 0.025; group.add(top);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.05, height - 0.05, depth), mat);
    legL.position.set(-width/2 + 0.025, (height-0.05)/2, 0); group.add(legL);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.05, height - 0.05, depth), mat);
    legR.position.set(width/2 - 0.025, (height-0.05)/2, 0); group.add(legR);
  }
  
  group.children.forEach(c => { c.castShadow = true; c.receiveShadow = true; });
  return group;
}

export function createTaskChairMesh(): THREE.Group {
  const group = new THREE.Group();
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.2 });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), blackMat);
  seat.position.y = 0.45; group.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.05), blackMat);
  back.position.set(0, 0.75, -0.225); group.add(back);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4), metalMat);
  pole.position.y = 0.2; group.add(pole);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 5), metalMat);
  base.position.y = 0.025; group.add(base);

  group.children.forEach(c => { c.castShadow = true; });
  return group;
}

export function createBedMesh(width = 1.85, depth = 2.15, headboardHeight = 1.15, styleId = 'minimalist', color = 0xffffff): THREE.Group {
  const group = new THREE.Group();
  const mattressMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2719, roughness: 0.5 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });

  if (styleId === 'japandi') {
    // Extremely low platform extending past mattress
    const plat = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.15, depth + 0.4), woodMat);
    plat.position.y = 0.075; group.add(plat);
    const mat = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, depth), mattressMat);
    mat.position.y = 0.15 + 0.1; group.add(mat);
  } else if (styleId === 'classic' || styleId === 'coastal') {
    // High headboard, tall mattress
    const frame = new THREE.Mesh(new THREE.BoxGeometry(width, 0.3, depth), woodMat);
    frame.position.y = 0.15; group.add(frame);
    const mat = new THREE.Mesh(new THREE.BoxGeometry(width - 0.05, 0.25, depth - 0.05), mattressMat);
    mat.position.y = 0.3 + 0.125; group.add(mat);
    const hb = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, headboardHeight, 0.1), mattressMat);
    hb.position.set(0, headboardHeight/2, -depth/2); group.add(hb);
  } else if (styleId === 'industrial') {
    // Pipe frame
    const mat = new THREE.Mesh(new THREE.BoxGeometry(width, 0.25, depth), mattressMat);
    mat.position.y = 0.3; group.add(mat);
    for (let x of [-1, 1]) {
      const pipeL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3), metalMat);
      pipeL.position.set(x * (width/2 - 0.05), 0.15, depth/2 - 0.05); group.add(pipeL);
      const pipeR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, headboardHeight), metalMat);
      pipeR.position.set(x * (width/2 - 0.05), headboardHeight/2, -depth/2 + 0.05); group.add(pipeR);
    }
    const hbPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, width - 0.1), metalMat);
    hbPipe.rotation.z = Math.PI/2; hbPipe.position.set(0, headboardHeight - 0.1, -depth/2 + 0.05); group.add(hbPipe);
  } else {
    // Midcentury / Default
    const frame = new THREE.Mesh(new THREE.BoxGeometry(width, 0.15, depth), woodMat);
    frame.position.y = 0.2; group.add(frame);
    for (let x of [-1, 1]) for (let z of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.01, 0.2), woodMat);
      leg.position.set(x * (width/2 - 0.1), 0.1, z * (depth/2 - 0.1));
      leg.rotation.z = x * 0.1; leg.rotation.x = z * 0.1; group.add(leg);
    }
    const mat = new THREE.Mesh(new THREE.BoxGeometry(width - 0.05, 0.2, depth - 0.05), mattressMat);
    mat.position.y = 0.275 + 0.1; group.add(mat);
    const hb = new THREE.Mesh(new THREE.BoxGeometry(width, 0.6, 0.1), woodMat);
    hb.position.set(0, 0.6, -depth/2 + 0.05); hb.rotation.x = -0.1; group.add(hb);
  }

  group.children.forEach(c => { c.castShadow = true; c.receiveShadow = true; });
  return group;
}

export function createNightstandMesh(isLeft = true, styleId = 'minimalist', color = 0x3d2719): THREE.Group {
  return createMediaCredenzaMesh(0.5, 0.4, 0.5, styleId, color);
}

export function createCribMesh(): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0xe6dfd5, roughness: 0.6 });
  const mat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  mat.position.y = 0.4; group.add(mat);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.95, 0.85), new THREE.MeshBasicMaterial({ wireframe: true, color: 0xe6dfd5 }));
  frame.position.y = 0.95/2; group.add(frame);
  return group;
}



export function buildFurnitureGroupForVariant(variant: any): THREE.Group {
  const group = new THREE.Group();
  group.name = 'furniture_variant_' + variant.variant_title;

  const roomWidth = 6.0;
  const roomDepth = 5.0;
  
  // Style extraction
  const titleLower = (variant.variant_title || '').toLowerCase();
  let styleId = 'minimalist';
  if (titleLower.includes('industrial')) styleId = 'industrial';
  else if (titleLower.includes('mid-century')) styleId = 'midcentury';
  else if (titleLower.includes('french') || titleLower.includes('classic')) styleId = 'classic';
  else if (titleLower.includes('boho') || titleLower.includes('bohemian')) styleId = 'boho';
  else if (titleLower.includes('japandi')) styleId = 'japandi';
  else if (titleLower.includes('coastal') || titleLower.includes('hampton')) styleId = 'coastal';
  else if (titleLower.includes('executive')) styleId = 'executive';

  const palette = variant.color_palette || [];
  const primaryColor = palette.length > 0 ? parseInt(palette[0].replace('#', '0x')) : 0x2d3139;
  const secondaryColor = palette.length > 1 ? parseInt(palette[1].replace('#', '0x')) : 0xaaaaaa;

  if (variant.furniture_list && variant.furniture_list.length > 0) {
    let hasRug = false;
    let hasPlant = false;

    variant.furniture_list.forEach((item: any) => {
      const box = item.relative_bounding_box;
      if (!box || box.length !== 4) return;
      
      const xmin = box[0]; const ymin = box[1]; const xmax = box[2]; const ymax = box[3];
      const posX = ((xmin + xmax) / 2 - 0.5) * roomWidth;
      const posZ = ((ymin + ymax) / 2 - 0.5) * roomDepth;
      const width = item.dimensions_metric?.width_m || Math.max(0.4, (xmax - xmin) * roomWidth);
      const depth = item.dimensions_metric?.depth_m || Math.max(0.4, (ymax - ymin) * roomDepth);
      const height = item.dimensions_metric?.height_m || 0.8;
      const name = String(item.item_name || '').toLowerCase();
      const cat = String(item.category || 'decor').toLowerCase();

      let meshGroup = null;

      if (name.includes('sofa') || name.includes('couch') || name.includes('sectional') || (cat === 'seating' && width > 1.4)) {
        meshGroup = createSofaMesh(width, depth, height, primaryColor, styleId);
      } else if (name.includes('coffee') || name.includes('cocktail') || (name.includes('table') && !name.includes('dining') && !name.includes('side') && !name.includes('nightstand') && !name.includes('end'))) {
        const tableStyle = styleId === 'industrial' ? 'walnut' : (styleId === 'japandi' ? 'travertine' : 'marble');
        meshGroup = createCoffeeTableMesh(width, depth, height, tableStyle, styleId);
      } else if (name.includes('dining') && name.includes('table')) {
        meshGroup = createDeskMesh(width, depth, height, styleId, primaryColor);
      } else if (name.includes('armchair') || name.includes('accent') || name.includes('lounge') || name.includes('glider') || name.includes('chair') || name.includes('seat') || name.includes('stool') || name.includes('pouf') || name.includes('bench') || cat === 'seating') {
        if (name.includes('task') || name.includes('office') || name.includes('desk chair')) {
          meshGroup = createTaskChairMesh();
        } else {
          meshGroup = createArmchairMesh(width, depth, height, true, styleId, secondaryColor);
        }
      } else if (name.includes('desk') || name.includes('workstation') || name.includes('vanity') || cat === 'desk') {
        meshGroup = createDeskMesh(width, depth, height, styleId, primaryColor);
      } else if (name.includes('credenza') || name.includes('console') || name.includes('tv') || name.includes('media') || name.includes('bookshelf') || name.includes('dresser') || name.includes('chest') || name.includes('wardrobe') || name.includes('cabinet') || name.includes('shelf') || cat === 'storage') {
        meshGroup = createMediaCredenzaMesh(width, depth, height, styleId, primaryColor);
      } else if (name.includes('bed') || name.includes('mattress') || cat === 'bed') {
        meshGroup = createBedMesh(width, depth, height, styleId, secondaryColor);
      } else if (name.includes('nightstand') || name.includes('bedside') || name.includes('end table') || name.includes('side table')) {
        meshGroup = createNightstandMesh(posX < 0, styleId, primaryColor);
      } else if (name.includes('crib') || name.includes('bassinet') || cat === 'crib') {
        meshGroup = createCribMesh();
      } else if (name.includes('lamp') || name.includes('light') || name.includes('sconce') || name.includes('chandelier') || cat === 'lighting') {
        meshGroup = createFloorLampMesh(height, styleId);
      } else if (name.includes('rug') || name.includes('mat') || name.includes('carpet')) {
        const p = styleId === 'boho' ? 'geometric' : (styleId === 'japandi' ? 'linen' : 'cloud');
        meshGroup = createAreaRugMesh(width, depth, p, secondaryColor);
        hasRug = true;
      } else if (name.includes('plant') || name.includes('tree') || name.includes('fig') || name.includes('planter') || name.includes('fern') || name.includes('monstera') || name.includes('ficus')) {
        meshGroup = createPottedPlantMesh(styleId);
        hasPlant = true;
      } else {
        if (cat === 'table') {
          meshGroup = createCoffeeTableMesh(width, depth, height, 'walnut', styleId);
        } else if (cat === 'decor' || name.includes('art') || name.includes('painting') || name.includes('mirror') || name.includes('picture')) {
          meshGroup = null;
        } else {
          meshGroup = createMediaCredenzaMesh(width, depth, height, styleId, primaryColor);
        }
      }

      if (meshGroup) {
        meshGroup.position.set(posX, 0, posZ);
        if (item.orientation_degrees !== undefined) {
          meshGroup.rotation.y = THREE.MathUtils.degToRad(item.orientation_degrees);
        }
        group.add(meshGroup);
        addContactShadow(group, posX, posZ, width * 1.1, depth * 1.1);
      }
    });
  }

  // Fallback defaults if no list
  if (!variant.furniture_list || variant.furniture_list.length === 0) {
      const sofa = createSofaMesh(2.4, 0.95, 0.78, primaryColor, styleId);
      sofa.position.set(0, 0, -0.2);
      group.add(sofa);
  }

  return group;
}
