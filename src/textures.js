import * as THREE from 'three';

/**
 * Deterministic 2D value-noise helper for organic tissue synthesis.
 */
function hash2(x, y) {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return h - Math.floor(h);
}

function smoothNoise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);

  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

export function fbm2(x, y, octaves = 4) {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise(x * freq, y * freq);
    freq *= 2.03;
    amp *= 0.5;
  }
  return val;
}

/**
 * Deterministic 3D fBm noise for seamless volumetric 3D vertex sculpting.
 */
function hash3(x, y, z) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
  return h - Math.floor(h);
}

function smoothNoise3(x, y, z) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);

  const n000 = hash3(ix, iy, iz);
  const n100 = hash3(ix + 1, iy, iz);
  const n010 = hash3(ix, iy + 1, iz);
  const n110 = hash3(ix + 1, iy + 1, iz);
  const n001 = hash3(ix, iy, iz + 1);
  const n101 = hash3(ix + 1, iy, iz + 1);
  const n011 = hash3(ix, iy + 1, iz + 1);
  const n111 = hash3(ix + 1, iy + 1, iz + 1);

  const nx00 = n000 + (n100 - n000) * ux;
  const nx10 = n010 + (n110 - n010) * ux;
  const nx01 = n001 + (n101 - n001) * ux;
  const nx11 = n011 + (n111 - n011) * ux;

  const nxy0 = nx00 + (nx10 - nx00) * uy;
  const nxy1 = nx01 + (nx11 - nx01) * uy;

  return nxy0 + (nxy1 - nxy0) * uz;
}

export function fbm3(x, y, z, octaves = 4) {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise3(x * freq, y * freq, z * freq);
    freq *= 2.02;
    amp *= 0.5;
  }
  return val;
}

/**
 * Converts a scalar heightfield Float32Array (size x size) into a tangent-space normal map CanvasTexture.
 */
function heightFieldToNormalTexture(heightField, size, strength = 3.2) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  const data = img.data;

  for (let y = 0; y < size; y++) {
    const ym = (y - 1 + size) % size;
    const yp = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size;
      const xp = (x + 1) % size;

      const dX = (heightField[y * size + xp] - heightField[y * size + xm]) * strength;
      const dY = (heightField[yp * size + x] - heightField[ym * size + x]) * strength;

      let nx = -dX;
      let ny = -dY;
      let nz = 1.0;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;

      const idx = (y * size + x) * 4;
      data[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

/**
 * Generates procedural wet myocardium, endocardial trabeculae, epicardial adipose fat,
 * and fibro-elastic arterial/valvular PBR textures.
 */
export function createCardiacTextureSet() {
  if (typeof document === 'undefined') {
    const dummy = new THREE.DataTexture(new Uint8Array([200, 120, 120, 255]), 1, 1);
    dummy.needsUpdate = true;
    return {
      myocardiumAlbedo: dummy,
      myocardiumNormal: dummy,
      myocardiumRoughness: dummy,
      endocardiumNormal: dummy,
      adiposeAlbedo: dummy,
      adiposeNormal: dummy,
      vesselNormal: dummy
    };
  }
  const size = 512;

  // 1. MYOCARDIUM STRIATED FIBER HEIGHTFIELD + ALBEDO + WETNESS ROUGHNESS
  const myoHeight = new Float32Array(size * size);
  const myoAlbedoCanvas = document.createElement('canvas');
  myoAlbedoCanvas.width = size;
  myoAlbedoCanvas.height = size;
  const myoCtx = myoAlbedoCanvas.getContext('2d');
  const myoImg = myoCtx.createImageData(size, size);

  const myoRoughCanvas = document.createElement('canvas');
  myoRoughCanvas.width = size;
  myoRoughCanvas.height = size;
  const roughCtx = myoRoughCanvas.getContext('2d');
  const roughImg = roughCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;

      // Helical muscle bundle orientation (~32 deg spiral across epicardium)
      const warp = fbm2(u * 8, v * 8, 3);
      const fiberCoord = u * 28 + v * 16 + warp * 2.1;
      const crossCoord = -u * 8 + v * 20;
      const primaryStriation = Math.sin(fiberCoord * Math.PI * 2) * 0.5 + 0.5;
      const fascicleBundle =
        Math.sin(fiberCoord * Math.PI * 0.55 + fbm2(u * 14, v * 14, 3) * 3.2) * 0.5 + 0.5;
      const microNoise = fbm2(u * 30 + crossCoord, v * 30, 4);

      // Subepicardial microvascular venules & arterioles
      const veinWave1 = Math.abs(Math.sin((u * 9 - v * 6 + microNoise * 0.95) * Math.PI));
      const veinWave2 = Math.abs(Math.sin((u * 5 + v * 11 - warp * 1.3) * Math.PI));
      const capillary = Math.max(
        Math.pow(1 - Math.min(1, veinWave1), 7),
        Math.pow(1 - Math.min(1, veinWave2), 8) * 0.75
      );

      const h =
        primaryStriation * 0.42 +
        fascicleBundle * 0.38 +
        microNoise * 0.2 -
        capillary * 0.22;
      myoHeight[y * size + x] = h;

      // Albedo variation: neutral-warm tissue multiplier so per-part surgical colors tint cleanly
      // High values on muscle ridges, deep crimson-purple in fascicle sulci & venules
      const shade = 0.74 + 0.26 * h - 0.18 * capillary;
      const r = Math.min(255, Math.max(0, Math.round(235 * shade + 18 * primaryStriation)));
      const g = Math.min(255, Math.max(0, Math.round(165 * shade - 28 * capillary + 10 * microNoise)));
      const b = Math.min(255, Math.max(0, Math.round(170 * shade + 24 * capillary)));

      const idx = (y * size + x) * 4;
      myoImg.data[idx] = r;
      myoImg.data[idx + 1] = g;
      myoImg.data[idx + 2] = b;
      myoImg.data[idx + 3] = 255;

      // Wet serous pericardial fluid roughness: ultra-glossy in fluid sulci (28..88)
      const roughVal = Math.round(28 + (1 - h) * 54);
      roughImg.data[idx] = roughVal;
      roughImg.data[idx + 1] = roughVal;
      roughImg.data[idx + 2] = roughVal;
      roughImg.data[idx + 3] = 255;
    }
  }

  myoCtx.putImageData(myoImg, 0, 0);
  roughCtx.putImageData(roughImg, 0, 0);

  const myocardiumAlbedo = new THREE.CanvasTexture(myoAlbedoCanvas);
  myocardiumAlbedo.wrapS = THREE.RepeatWrapping;
  myocardiumAlbedo.wrapT = THREE.RepeatWrapping;
  myocardiumAlbedo.repeat.set(3, 3);
  myocardiumAlbedo.colorSpace = THREE.SRGBColorSpace;

  const myocardiumRoughness = new THREE.CanvasTexture(myoRoughCanvas);
  myocardiumRoughness.wrapS = THREE.RepeatWrapping;
  myocardiumRoughness.wrapT = THREE.RepeatWrapping;
  myocardiumRoughness.repeat.set(3, 3);

  const myocardiumNormal = heightFieldToNormalTexture(myoHeight, size, 4.4);

  // 2. ENDOCARDIAL TRABECULAR CAVITY NORMAL MAP (deep anastomosing muscular ridges)
  const endoSize = 256;
  const endoHeight = new Float32Array(endoSize * endoSize);
  for (let y = 0; y < endoSize; y++) {
    const v = y / endoSize;
    for (let x = 0; x < endoSize; x++) {
      const u = x / endoSize;
      const n1 = fbm2(u * 10, v * 10, 4);
      const n2 = fbm2(u * 18 + 3.1, v * 18 + 7.4, 3);
      // Ridged multifractal trabecular network
      const ridge1 = 1.0 - Math.abs(Math.sin((u * 6 + v * 3 + n1 * 1.4) * Math.PI * 2));
      const ridge2 = 1.0 - Math.abs(Math.sin((u * 4 - v * 7 + n2 * 1.2) * Math.PI * 2));
      endoHeight[y * endoSize + x] = Math.pow(Math.max(ridge1, ridge2 * 0.85), 1.8);
    }
  }
  const endocardiumNormal = heightFieldToNormalTexture(endoHeight, endoSize, 5.5);
  endocardiumNormal.repeat.set(3, 3);

  // 3. EPICARDIAL ADIPOSE (FAT) LOBULE TEXTURE + NORMAL MAP
  const fatSize = 256;
  const fatHeight = new Float32Array(fatSize * fatSize);
  const fatCanvas = document.createElement('canvas');
  fatCanvas.width = fatSize;
  fatCanvas.height = fatSize;
  const fatCtx = fatCanvas.getContext('2d');
  const fatImg = fatCtx.createImageData(fatSize, fatSize);

  for (let y = 0; y < fatSize; y++) {
    const v = y / fatSize;
    for (let x = 0; x < fatSize; x++) {
      const u = x / fatSize;
      // Cellular adipocyte lobule clusters with fine capillary septa
      const n1 = fbm2(u * 12, v * 12, 4);
      const n2 = fbm2(u * 26 + 5.2, v * 26 + 1.7, 3);
      const cellA = Math.abs(Math.sin((u * 9 + n1 * 1.8) * Math.PI));
      const cellB = Math.abs(Math.sin((v * 9 + n2 * 1.8) * Math.PI));
      const lobule = Math.pow(cellA * cellB, 0.38) * 0.78 + n2 * 0.22;
      fatHeight[y * fatSize + x] = lobule;

      const idx = (y * fatSize + x) * 4;
      // Warm surgical butter-amber adipose with reddish-orange interlobular septa
      fatImg.data[idx] = Math.min(255, Math.round(212 + 40 * lobule));
      fatImg.data[idx + 1] = Math.min(255, Math.round(146 + 68 * lobule));
      fatImg.data[idx + 2] = Math.min(255, Math.round(52 + 46 * lobule));
      fatImg.data[idx + 3] = 255;
    }
  }
  fatCtx.putImageData(fatImg, 0, 0);

  const adiposeAlbedo = new THREE.CanvasTexture(fatCanvas);
  adiposeAlbedo.wrapS = THREE.RepeatWrapping;
  adiposeAlbedo.wrapT = THREE.RepeatWrapping;
  adiposeAlbedo.repeat.set(2, 2);
  adiposeAlbedo.colorSpace = THREE.SRGBColorSpace;

  const adiposeNormal = heightFieldToNormalTexture(fatHeight, fatSize, 4.8);
  adiposeNormal.repeat.set(2, 2);

  // 4. FIBRO-ELASTIC VESSEL / VALVE NORMAL MAP
  const vesselHeight = new Float32Array(fatSize * fatSize);
  for (let y = 0; y < fatSize; y++) {
    const v = y / fatSize;
    for (let x = 0; x < fatSize; x++) {
      const u = x / fatSize;
      const ring = Math.sin(v * 36 * Math.PI + fbm2(u * 10, v * 10, 3) * 2.0) * 0.5 + 0.5;
      const micro = fbm2(u * 20, v * 20, 3);
      vesselHeight[y * fatSize + x] = ring * 0.55 + micro * 0.45;
    }
  }
  const vesselNormal = heightFieldToNormalTexture(vesselHeight, fatSize, 2.5);
  vesselNormal.repeat.set(2, 4);

  return {
    myocardiumAlbedo,
    myocardiumNormal,
    myocardiumRoughness,
    endocardiumNormal,
    adiposeAlbedo,
    adiposeNormal,
    vesselNormal
  };
}

/**
 * Generates a procedural surgical operating-room HDR-like PMREM environment map
 * with a multi-pod overhead surgical luminaire array so wet clearcoat tissue surfaces
 * exhibit crisp operating-theater specular reflections.
 */
export function createSurgicalEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x050811);

  const podGeo = new THREE.SphereGeometry(0.65, 24, 16);

  // Primary overhead multi-pod surgical luminaire (central pod + 6 satellite pods)
  const rigGroup = new THREE.Group();
  rigGroup.position.set(3.2, 6.8, 4.8);
  rigGroup.lookAt(0, 0, 0);

  const centerPod = new THREE.Mesh(
    podGeo,
    new THREE.MeshBasicMaterial({ color: new THREE.Color(8.5, 8.2, 7.8) })
  );
  centerPod.scale.set(1.2, 1.2, 0.28);
  rigGroup.add(centerPod);

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const sat = new THREE.Mesh(
      podGeo,
      new THREE.MeshBasicMaterial({ color: new THREE.Color(6.4, 6.2, 6.0) })
    );
    sat.position.set(Math.cos(angle) * 1.45, Math.sin(angle) * 1.45, 0);
    sat.scale.set(0.72, 0.72, 0.22);
    rigGroup.add(sat);
  }
  envScene.add(rigGroup);

  // Secondary surgical satellite lamp (cool sterile cyan-white)
  const dome2 = new THREE.Mesh(
    podGeo,
    new THREE.MeshBasicMaterial({ color: new THREE.Color(3.4, 4.6, 6.2) })
  );
  dome2.position.set(-5.0, 5.2, 3.8);
  dome2.scale.set(2.4, 0.45, 2.4);
  envScene.add(dome2);

  // Contralateral rim fill strip
  const rimStrip = new THREE.Mesh(
    podGeo,
    new THREE.MeshBasicMaterial({ color: new THREE.Color(4.2, 1.4, 1.6) })
  );
  rimStrip.position.set(0.6, 3.2, -6.8);
  rimStrip.scale.set(4.2, 1.2, 0.4);
  envScene.add(rimStrip);

  // Warm crimson sub-dermal surgical field bounce floor
  const bounce = new THREE.Mesh(
    podGeo,
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.06, 0.12) })
  );
  bounce.position.set(0, -6.2, -1.5);
  bounce.scale.set(6.5, 0.6, 6.5);
  envScene.add(bounce);

  const renderTarget = pmrem.fromScene(envScene, 0.03);
  pmrem.dispose();
  return renderTarget.texture;
}

/**
 * Injects torsional / longitudinal heartbeat kinematics plus dual-lobe myocardial
 * subsurface scattering and endocardial lumen shading into a MeshPhysicalMaterial.
 * Deformation is driven from dynamic model bounds (`uHeartMin`, `uHeartMax`, `uHeartCenter`)
 * so both the HuBMAP GLB anatomy and procedural fallback wring cohesively.
 */
export function attachSubsurfaceShader(
  material,
  sssHex = 0xff2418,
  sssIntensity = 0.48,
  cardiacUniforms,
  muscle = 1,
  enableSss = true
) {
  const sssColor = new THREE.Color(sssHex);
  material.userData.sssColor = sssColor;
  material.userData.sssIntensity = enableSss ? sssIntensity : 0.0;
  material.userData.uMuscle = muscle;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSssColor = { value: material.userData.sssColor };
    shader.uniforms.uSssIntensity = { value: material.userData.sssIntensity };
    shader.uniforms.uSystolePulse = cardiacUniforms.uSystolePulse;
    shader.uniforms.uAtrial = cardiacUniforms.uAtrial;
    shader.uniforms.uVentricular = cardiacUniforms.uVentricular;
    shader.uniforms.uTorsion = cardiacUniforms.uTorsion;
    shader.uniforms.uShorten = cardiacUniforms.uShorten;
    shader.uniforms.uHeartMin = cardiacUniforms.uHeartMin;
    shader.uniforms.uHeartMax = cardiacUniforms.uHeartMax;
    shader.uniforms.uHeartCenter = cardiacUniforms.uHeartCenter;
    shader.uniforms.uMuscle = { value: material.userData.uMuscle };

    shader.vertexShader =
      `
      attribute float _ENDOCARDIUM;
      varying float vEndocardium;
      varying vec3 vObjPos;
      uniform float uAtrial;
      uniform float uVentricular;
      uniform float uTorsion;
      uniform float uShorten;
      uniform vec3 uHeartMin;
      uniform vec3 uHeartMax;
      uniform vec3 uHeartCenter;
      uniform float uMuscle;
      ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `#include <beginnormal_vertex>
      vEndocardium = clamp(_ENDOCARDIUM, 0.0, 1.0);
      vObjPos = position;
      vec3 heartOrigin = (modelMatrix * vec4(position, 1.0)).xyz;
      float hSpanN = max(0.5, uHeartMax.y - uHeartMin.y);
      float hyNormN = (heartOrigin.y - uHeartCenter.y) / (hSpanN * 0.5);
      float heartAngN = uTorsion * (hyNormN - 0.12);
      float heartCN = cos(heartAngN);
      float heartSN = sin(heartAngN);
      vec3 heartWN = mat3(modelMatrix) * objectNormal;
      float tnx = heartWN.x * heartCN - heartWN.z * heartSN;
      float tnz = heartWN.x * heartSN + heartWN.z * heartCN;
      heartWN.x = tnx;
      heartWN.z = tnz;
      objectNormal = inverse(mat3(modelMatrix)) * heartWN;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vec4 heartWorld = modelMatrix * vec4(transformed, 1.0);
      float hSpan = max(0.5, uHeartMax.y - uHeartMin.y);
      float hyNorm = (heartWorld.y - uHeartCenter.y) / (hSpan * 0.5);
      float atrialBand = smoothstep(-0.08, 0.28, hyNorm) * smoothstep(0.95, 0.52, hyNorm);
      float ventBand = smoothstep(0.24, -0.18, hyNorm);
      float radialSqueeze = uMuscle * (uVentricular * ventBand * 0.135 + uAtrial * atrialBand * 0.095);
      float invR = 1.0 - radialSqueeze;
      float wx = uHeartCenter.x + (heartWorld.x - uHeartCenter.x) * invR;
      float wz = uHeartCenter.z + (heartWorld.z - uHeartCenter.z) * invR;
      float pivotY = uHeartCenter.y + 0.12 * hSpan;
      float wy = heartWorld.y + uMuscle * uShorten * ventBand * 0.075 * (pivotY - heartWorld.y);
      float ang = uTorsion * (hyNorm - 0.12);
      float c = cos(ang);
      float s = sin(ang);
      float dx = wx - uHeartCenter.x;
      float dz = wz - uHeartCenter.z;
      heartWorld = vec4(uHeartCenter.x + dx * c - dz * s, wy, uHeartCenter.z + dx * s + dz * c, 1.0);
      transformed = (inverse(modelMatrix) * heartWorld).xyz;
      `
    );

    shader.fragmentShader =
      `
      varying float vEndocardium;
      varying vec3 vObjPos;
      uniform vec3 uSssColor;
      uniform float uSssIntensity;
      uniform float uSystolePulse;
      ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      // Seamless 3D helical muscle fiber micro-striation (free of UV wrap seams)
      float fiberWave = sin(vObjPos.y * 26.0 + vObjPos.x * 16.0 + vObjPos.z * 14.0) * 0.5 + 0.5;
      float bundleWave = sin(vObjPos.y * 9.0 - vObjPos.x * 11.0 + vObjPos.z * 8.0) * 0.5 + 0.5;
      diffuseColor.rgb *= (0.92 + 0.08 * fiberWave + 0.05 * bundleWave);

      // Warm salmon-ivory endocardial cavity lining on inward-facing chamber lumen walls
      if (vEndocardium > 0.01 || !gl_FrontFacing) {
        float endoWeight = max(vEndocardium, !gl_FrontFacing ? 0.78 : 0.0);
        vec3 endoTint = vec3(0.87, 0.58, 0.55) * (0.90 + 0.10 * bundleWave);
        diffuseColor.rgb = mix(diffuseColor.rgb, endoTint, endoWeight * 0.76);
      }

      #if NUM_CLIPPING_PLANES > 0
      // Crisp pale ivory-cream endocardial/epicardial lamina rim along the cross-section cut edge
      float clipEdgeDist = abs(dot(vClipPosition, clippingPlanes[0].xyz) - clippingPlanes[0].w);
      float cutRim = 1.0 - smoothstep(0.004, 0.034, clipEdgeDist);
      if (cutRim > 0.01) {
        vec3 ivoryLamina = vec3(0.96, 0.91, 0.83);
        diffuseColor.rgb = mix(diffuseColor.rgb, ivoryLamina, cutRim * 0.85);
      }
      #endif
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `
      // Dual-lobe biological subsurface scattering + wet serous rim
      vec3 viewDirSss = normalize(vViewPosition);
      vec3 normalSss = normalize(normal);
      vec3 keyLightDir = normalize(vec3(0.48, 0.66, 0.57));
      vec3 rimLightDir = normalize(vec3(0.05, -0.62, -0.78));

      float ndotl = dot(normalSss, keyLightDir);
      float wrapDiff = max(0.0, (ndotl + 0.62) / 1.62);
      float terminatorScatter = smoothstep(-0.45, 0.15, ndotl) * (1.0 - smoothstep(0.05, 0.65, ndotl));
      float backLight = max(0.0, dot(-normalSss, keyLightDir)) + 0.65 * max(0.0, dot(-normalSss, rimLightDir));
      float rimSss = pow(1.0 - max(0.0, dot(viewDirSss, normalSss)), 2.4);

      float perfusionBoost = 1.0 + 0.22 * uSystolePulse;
      vec3 sssContrib = uSssColor * (uSssIntensity * perfusionBoost) * (
        0.36 * wrapDiff +
        0.52 * terminatorScatter +
        0.55 * pow(backLight, 1.5) +
        0.44 * rimSss
      );
      outgoingLight += sssContrib * (0.45 + 0.55 * diffuseColor.rgb);
      #include <opaque_fragment>
      `
    );
  };
  material.needsUpdate = true;
}
