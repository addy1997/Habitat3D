import * as THREE from 'three';

// Cache generated textures so we don't recreate them needlessly
const textureCache: Record<string, THREE.CanvasTexture> = {};

/**
 * Generates a photorealistic oak hardwood plank texture
 */
export function getOakWoodTexture(): THREE.CanvasTexture {
  if (textureCache['oak_wood']) return textureCache['oak_wood'];

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base warm oak tone
  ctx.fillStyle = '#C8A882';
  ctx.fillRect(0, 0, 1024, 1024);

  const plankHeight = 64;
  const plankCount = 1024 / plankHeight;

  // Oak plank color variations
  const plankTones = [
    '#D1B28C', '#C8A77E', '#BE9D73', '#CFB08A',
    '#C4A279', '#D7BA94', '#B8966C', '#C2A178',
  ];

  for (let i = 0; i < plankCount; i++) {
    const y = i * plankHeight;
    const tone = plankTones[i % plankTones.length];
    ctx.fillStyle = tone;
    ctx.fillRect(0, y, 1024, plankHeight);

    // Plank seam / groove
    ctx.fillStyle = 'rgba(60, 40, 20, 0.45)';
    ctx.fillRect(0, y, 1024, 2);

    // Wood grain lines
    ctx.fillStyle = 'rgba(90, 60, 30, 0.08)';
    for (let g = 0; g < 12; g++) {
      const grainY = y + (g * plankHeight) / 12 + Math.sin(g) * 3;
      ctx.fillRect(0, grainY, 1024, 1 + Math.random());
    }

    // Vertical plank joint dividers
    const joints = [240 + ((i * 180) % 500), 680 + ((i * 130) % 250)];
    ctx.fillStyle = 'rgba(50, 35, 18, 0.45)';
    joints.forEach((jx) => {
      ctx.fillRect(jx, y, 2, plankHeight);
    });
  }

  // Soft overall noise
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let p = 0; p < data.length; p += 4) {
    const noise = (Math.random() - 0.5) * 8;
    data[p] = Math.min(255, Math.max(0, data[p] + noise));
    data[p + 1] = Math.min(255, Math.max(0, data[p + 1] + noise * 0.9));
    data[p + 2] = Math.min(255, Math.max(0, data[p + 2] + noise * 0.8));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.anisotropy = 8;
  textureCache['oak_wood'] = texture;
  return texture;
}

/**
 * Generates a dark walnut wood texture for executive desks and credenzas
 */
export function getWalnutTexture(): THREE.CanvasTexture {
  if (textureCache['walnut_wood']) return textureCache['walnut_wood'];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3E2718';
  ctx.fillRect(0, 0, 512, 512);

  // Walnut grain streaks
  for (let i = 0; i < 40; i++) {
    const y = i * 13;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(40, 22, 12, 0.7)' : 'rgba(74, 46, 28, 0.6)';
    ctx.fillRect(0, y, 512, 6);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  textureCache['walnut_wood'] = texture;
  return texture;
}

/**
 * Generates a light birch Scandinavian wood texture
 */
export function getBirchTexture(): THREE.CanvasTexture {
  if (textureCache['birch_wood']) return textureCache['birch_wood'];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#EBD5B3';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 30; i++) {
    const y = i * 17;
    ctx.fillStyle = 'rgba(210, 185, 150, 0.4)';
    ctx.fillRect(0, y, 512, 4);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  textureCache['birch_wood'] = texture;
  return texture;
}

/**
 * Generates a woven geometric area rug texture
 */
export function getWovenRugTexture(pattern: 'geometric' | 'cloud' | 'linen' = 'geometric'): THREE.CanvasTexture {
  const key = `rug_${pattern}`;
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (pattern === 'geometric') {
    ctx.fillStyle = '#E3DCD2';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#4A4643';
    ctx.lineWidth = 6;
    // Diamond pattern
    for (let x = -256; x < 768; x += 128) {
      for (let y = -256; y < 768; y += 128) {
        ctx.beginPath();
        ctx.moveTo(x, y + 64);
        ctx.lineTo(x + 64, y);
        ctx.lineTo(x + 128, y + 64);
        ctx.lineTo(x + 64, y + 128);
        ctx.closePath();
        ctx.stroke();
      }
    }
  } else if (pattern === 'cloud') {
    ctx.fillStyle = '#EDE7DC';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#DFD4C4';
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.arc(100 + ((i * 90) % 400), 80 + ((i * 110) % 400), 40 + (i % 3) * 15, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Linen
    ctx.fillStyle = '#F2EFEB';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = 'rgba(180, 170, 160, 0.25)';
    for (let i = 0; i < 512; i += 4) {
      ctx.fillRect(i, 0, 2, 512);
      ctx.fillRect(0, i, 512, 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  textureCache[key] = texture;
  return texture;
}

/**
 * Procedural plaster wall texture
 */
export function getPlasterWallTexture(): THREE.CanvasTexture {
  if (textureCache['plaster_wall']) return textureCache['plaster_wall'];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#F5F4EE';
  ctx.fillRect(0, 0, 512, 512);

  // Very subtle wall stippling
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let p = 0; p < data.length; p += 4) {
    const noise = (Math.random() - 0.5) * 6;
    data[p] = Math.min(255, Math.max(0, data[p] + noise));
    data[p + 1] = Math.min(255, Math.max(0, data[p + 1] + noise));
    data[p + 2] = Math.min(255, Math.max(0, data[p + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  textureCache['plaster_wall'] = texture;
  return texture;
}
