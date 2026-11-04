import * as THREE from 'three';
import { HEART_PARTS, HEART_PARTS_BY_ID } from './heartCatalog.js';
import { createCardiacTextureSet, fbm3 } from './textures.js';
import {
  createCardiacUniforms,
  kindForRole,
  makeTissueMaterial,
  updateCardiacUniformsFromBounds
} from './heartMaterials.js';

function makeTube(points, radius, tubularSegments = 48, radialSegments = 20, closed = false) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    closed,
    'catmullrom',
    0.5
  );
  return new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed);
}

function sculptShell(
  geo,
  { sx = 1, sy = 1, sz = 1, taper = 0.16, noiseAmp = 0.05, freq = 1.7, grooves = 0.012, seed = 0 } = {}
) {
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const endo = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const dir = v.clone().normalize();
    const yN = v.y;
    const taperK = 1 - taper * Math.max(0, -yN);
    const basal = 1 + 0.07 * Math.max(0, yN);
    v.x *= sx * taperK * basal;
    v.y *= sy;
    v.z *= sz * taperK;

    const n1 = fbm3(v.x * freq + seed, v.y * freq, v.z * freq, 4);
    const n2 = fbm3(v.x * freq * 2.3 + 4.0, v.y * freq * 2.1, v.z * freq * 2.2 + seed, 3);
    const fiber = Math.sin(v.y * 10.5 + v.x * 3.2 + v.z * 2.1 + n1 * 2.0);
    const disp = (n1 - 0.46) * noiseAmp + (n2 - 0.5) * noiseAmp * 0.55 + fiber * grooves;
    v.addScaledVector(dir, disp);
    pos.setXYZ(i, v.x, v.y, v.z);
    endo[i] = 0;
  }
  geo.setAttribute('_ENDOCARDIUM', new THREE.BufferAttribute(endo, 1));
  geo.computeVertexNormals();
  return geo;
}

function organicize(geo, amp = 0.02, freq = 3.2) {
  geo.computeVertexNormals();
  const pos = geo.attributes.position;
  const normals = geo.attributes.normal;
  const v = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  const endo = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    nrm.fromBufferAttribute(normals, i);
    const n = fbm3(v.x * freq + 1.7, v.y * freq + 0.4, v.z * freq + 2.3, 3);
    v.addScaledVector(nrm, (n - 0.48) * amp);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.setAttribute('_ENDOCARDIUM', new THREE.BufferAttribute(endo, 1));
  geo.computeVertexNormals();
  return geo;
}

function makeDoubleWall(opts) {
  const outer = sculptShell(new THREE.SphereGeometry(1, 56, 42), opts);
  const wall = opts.wall ?? 0.82;
  const inner = sculptShell(new THREE.SphereGeometry(1, 42, 32), {
    ...opts,
    sx: opts.sx * wall,
    sy: opts.sy * wall,
    sz: opts.sz * wall,
    noiseAmp: (opts.noiseAmp ?? 0.05) * 1.7,
    grooves: (opts.grooves ?? 0.012) * 2.6,
    freq: (opts.freq ?? 1.7) * 1.35,
    seed: (opts.seed ?? 0) + 9.2
  });
  return [
    { geometry: outer, kind: 'myocardium' },
    { geometry: inner, kind: 'endocardium' }
  ];
}

function makeFatLobules(specs) {
  return specs.map((s) => {
    const g = new THREE.IcosahedronGeometry(s.r, 2);
    const pos = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = fbm3(v.x * 7 + s.x, v.y * 7 + s.y, v.z * 7 + s.z, 3);
      const lobule = 0.82 + n * 0.38;
      v.x *= lobule * (s.sx || 1.65);
      v.y *= lobule * (s.sy || 0.32);
      v.z *= lobule * (s.sz || 1.2);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.translate(s.x, s.y, s.z);
    g.setAttribute('_ENDOCARDIUM', new THREE.BufferAttribute(new Float32Array(pos.count), 1));
    g.computeVertexNormals();
    return g;
  });
}

function makeTrabeculae(strands) {
  return strands.map((s) => organicize(makeTube(s.pts, s.r, 14, 6), s.amp ?? 0.018, 6.5));
}

/**
 * Synchronous procedural 26-part cardiac generator retained as a recoverable fallback
 * when offline or if GLB loading is unavailable.
 */
export function createProceduralHeartModel(clippingPlane, qualityConfig = {}, existingTextures = null) {
  const root = new THREE.Group();
  root.name = 'HeartRoot';

  const partMeshes = new Map();
  const pickableMeshes = [];
  const textures = existingTextures || createCardiacTextureSet();
  const clipPlanes = clippingPlane ? [clippingPlane] : [];
  const cardiacUniforms = createCardiacUniforms();

  function registerPart(meta, geometriesOrMeshes, offset = [0, 0, 0], animRole = 'vessel') {
    const group = new THREE.Group();
    group.name = meta.id;
    group.position.set(offset[0], offset[1], offset[2]);

    const defaultKind = kindForRole(animRole);
    const matCache = new Map();
    const materials = [];
    const meshes = [];

    function materialFor(kind) {
      if (!matCache.has(kind)) {
        const mat = makeTissueMaterial(
          kind,
          meta,
          animRole,
          textures,
          clipPlanes,
          cardiacUniforms,
          qualityConfig
        );
        matCache.set(kind, mat);
        materials.push(mat);
      }
      return matCache.get(kind);
    }

    for (const item of geometriesOrMeshes) {
      const geometry = item.isBufferGeometry ? item : item.geometry;
      const kind = item.isBufferGeometry ? defaultKind : item.kind || defaultKind;
      if (
        (animRole === 'artery' || animRole === 'vein' || animRole === 'coronary') &&
        geometry.attributes?.position
      ) {
        organicize(
          geometry,
          animRole === 'coronary' ? 0.008 : 0.02,
          animRole === 'coronary' ? 5.5 : 2.6
        );
      } else if (geometry.attributes?.position && !geometry.attributes._ENDOCARDIUM) {
        geometry.setAttribute(
          '_ENDOCARDIUM',
          new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count), 1)
        );
      }
      const mesh = new THREE.Mesh(geometry, materialFor(kind));
      mesh.castShadow = qualityConfig.shadows !== false;
      mesh.receiveShadow = qualityConfig.shadows !== false;
      mesh.userData.partId = meta.id;
      mesh.userData.partMeta = meta;
      mesh.userData.tissueKind = kind;
      mesh.userData.animRole = animRole;
      group.add(mesh);
      meshes.push(mesh);
      pickableMeshes.push(mesh);
    }

    group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(group);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const explodeDir = center.clone();
    if (explodeDir.lengthSq() < 0.01) explodeDir.set(0, 0.3, 1);
    explodeDir.normalize();

    const record = {
      id: meta.id,
      meta,
      group,
      meshes,
      material: materials[0],
      materials,
      baseColor: new THREE.Color(meta.color),
      basePos: group.position.clone(),
      center,
      bounds: box,
      explodeDir,
      animRole
    };

    partMeshes.set(meta.id, record);
    root.add(group);
    return record;
  }

  const byId = HEART_PARTS_BY_ID;

  function withFatAndTrabeculae(shells, fatSpecs, strands, rotateZ = 0) {
    const items = [...shells];
    for (const geo of makeFatLobules(fatSpecs)) items.push({ geometry: geo, kind: 'fat' });
    for (const geo of makeTrabeculae(strands)) items.push({ geometry: geo, kind: 'trabecula' });
    if (rotateZ) {
      for (const item of items) item.geometry.rotateZ(rotateZ);
    }
    return items;
  }

  // 1. Chambers & Septa (7)
  {
    const shells = makeDoubleWall({
      sx: 0.92, sy: 0.85, sz: 0.86, taper: 0.08, noiseAmp: 0.042, freq: 1.85, grooves: 0.011, wall: 0.9, seed: 1.3
    });
    const auricle = sculptShell(new THREE.SphereGeometry(0.26, 28, 22), {
      sx: 1.35, sy: 0.42, sz: 0.62, taper: 0.12, noiseAmp: 0.09, freq: 3.6, grooves: 0.028, seed: 4.2
    });
    auricle.translate(-0.55, 0.02, 0.48);
    const items = withFatAndTrabeculae(
      shells,
      [{ x: 0.15, y: -0.62, z: 0.28, r: 0.16, sx: 1.8, sy: 0.28, sz: 1.1 }],
      [
        { r: 0.026, pts: [[-0.32, 0.18, 0.32], [-0.02, -0.02, 0.46], [0.22, 0.16, 0.28]] },
        { r: 0.02, pts: [[0.12, 0.32, 0.16], [-0.16, 0.04, 0.4], [-0.26, -0.22, 0.24]] }
      ],
      -0.18
    );
    items.push(auricle);
    registerPart(byId.right_atrium, items, [-0.98, 0.78, 0.1], 'atrium');
  }

  {
    const shells = makeDoubleWall({
      sx: 1.06, sy: 1.52, sz: 0.8, taper: 0.24, noiseAmp: 0.055, freq: 1.45, grooves: 0.016, wall: 0.84, seed: 2.2
    });
    const items = withFatAndTrabeculae(
      shells,
      [
        { x: 0.02, y: 0.95, z: 0.86, r: 0.16, sx: 2.1, sy: 0.34, sz: 0.7 },
        { x: -0.55, y: 0.72, z: 0.62, r: 0.12, sx: 1.5, sy: 0.32, sz: 0.75 }
      ],
      [
        { r: 0.04, pts: [[-0.15, -0.85, 0.28], [0.22, -0.25, 0.42], [0.05, 0.35, 0.22]] },
        { r: 0.032, pts: [[0.35, -0.55, 0.12], [-0.05, -0.15, 0.38], [-0.28, 0.28, 0.18]] }
      ],
      -0.24
    );
    registerPart(byId.right_ventricle, items, [-0.5, -0.58, 0.22], 'ventricle');
  }

  {
    const shells = makeDoubleWall({
      sx: 0.94, sy: 0.82, sz: 0.86, taper: 0.06, noiseAmp: 0.04, freq: 1.9, grooves: 0.01, wall: 0.9, seed: 3.1
    });
    const auricle = sculptShell(new THREE.SphereGeometry(0.24, 26, 20), {
      sx: 1.3, sy: 0.4, sz: 0.58, taper: 0.1, noiseAmp: 0.085, freq: 3.5, grooves: 0.026, seed: 6
    });
    auricle.translate(0.58, 0.04, 0.42);
    const items = withFatAndTrabeculae(
      shells,
      [{ x: 0.05, y: -0.58, z: 0.12, r: 0.15, sx: 1.7, sy: 0.28, sz: 1.05 }],
      [{ r: 0.022, pts: [[0.28, 0.12, 0.22], [-0.02, -0.08, 0.4], [-0.22, 0.16, 0.18]] }]
    );
    items.push(auricle);
    registerPart(byId.left_atrium, items, [0.9, 0.82, -0.18], 'atrium');
  }

  {
    const items = withFatAndTrabeculae(
      makeDoubleWall({
        sx: 1.14, sy: 1.72, sz: 1.02, taper: 0.3, noiseAmp: 0.05, freq: 1.4, grooves: 0.015, wall: 0.68, seed: 5.4
      }),
      [
        { x: 0.08, y: 1.05, z: 0.98, r: 0.15, sx: 2.2, sy: 0.32, sz: 0.62 },
        { x: 0.62, y: 0.82, z: 0.55, r: 0.12, sx: 1.5, sy: 0.3, sz: 0.7 }
      ],
      [
        { r: 0.045, pts: [[0.15, -0.95, 0.22], [-0.2, -0.35, 0.38], [0.05, 0.25, 0.18]] },
        { r: 0.038, pts: [[-0.28, -0.7, -0.05], [0.12, -0.2, 0.28], [0.32, 0.35, 0.02]] }
      ],
      0.22
    );
    registerPart(byId.left_ventricle, items, [0.48, -0.66, 0.02], 'ventricle');
  }

  {
    const septumGeo = new THREE.CylinderGeometry(0.22, 0.14, 2.25, 28, 18);
    septumGeo.scale(0.55, 1.0, 1.65);
    organicize(septumGeo, 0.055, 2.4);
    septumGeo.rotateZ(0.14);
    registerPart(byId.interventricular_septum, [septumGeo], [0.02, -0.78, 0.18], 'septum');
  }

  {
    const iasGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.14, 32);
    iasGeo.rotateZ(Math.PI / 2);
    iasGeo.rotateY(0.22);
    organicize(iasGeo, 0.02, 3.5);
    const fossaRing = new THREE.TorusGeometry(0.22, 0.045, 14, 28);
    fossaRing.rotateY(Math.PI / 2);
    registerPart(byId.interatrial_septum, [iasGeo, fossaRing], [-0.04, 0.95, -0.02], 'septum');
  }

  {
    const apexOuter = sculptShell(new THREE.ConeGeometry(0.76, 1.05, 40, 8), {
      sx: 1, sy: 1, sz: 0.9, taper: 0, noiseAmp: 0.04, freq: 2.1, grooves: 0.012, seed: 8
    });
    const apexInner = sculptShell(new THREE.ConeGeometry(0.46, 0.68, 28, 6), {
      sx: 1, sy: 1, sz: 0.9, taper: 0, noiseAmp: 0.05, freq: 2.8, grooves: 0.02, seed: 11
    });
    apexInner.translate(0, -0.08, 0);
    const items = [
      { geometry: apexOuter, kind: 'myocardium' },
      { geometry: apexInner, kind: 'endocardium' }
    ];
    for (const item of items) item.geometry.rotateZ(Math.PI + 0.32);
    registerPart(byId.cardiac_apex, items, [0.62, -1.72, 0.12], 'apex');
  }

  // 2. Valves & Subvalvular Apparatus (6)
  function makeValveGeometry(leaflets = 3, ringRadius = 0.34) {
    const geoms = [];
    const ring = new THREE.TorusGeometry(ringRadius, 0.045, 14, 32);
    ring.rotateX(Math.PI / 2);
    geoms.push(ring);
    for (let i = 0; i < leaflets; i++) {
      const a0 = (i / leaflets) * Math.PI * 2;
      const span = (Math.PI * 2) / leaflets - 0.14;
      const cusp = new THREE.CircleGeometry(ringRadius * 0.92, 16, a0, span);
      cusp.rotateX(Math.PI / 2 + 0.18);
      geoms.push(cusp);
    }
    return geoms;
  }

  registerPart(byId.tricuspid_valve, makeValveGeometry(3, 0.38), [-0.92, 0.18, 0.32], 'av_valve');
  registerPart(byId.mitral_valve, makeValveGeometry(2, 0.38), [0.88, 0.2, -0.04], 'av_valve');

  {
    const geoms = makeValveGeometry(3, 0.31);
    geoms.forEach((g) => g.rotateZ(-0.22));
    registerPart(byId.pulmonary_valve, geoms, [-0.18, 1.32, 0.64], 'sl_valve');
  }

  {
    const geoms = makeValveGeometry(3, 0.33);
    geoms.forEach((g) => g.rotateZ(0.18));
    registerPart(byId.aortic_valve, geoms, [0.26, 0.72, 0.12], 'sl_valve');
  }

  {
    const cords = [];
    const anchors = [
      [[-0.95, -0.58, 0.42], [-0.92, 0.15, 0.36]],
      [[-0.72, -0.64, 0.22], [-0.82, 0.15, 0.24]],
      [[0.92, -0.66, 0.18], [0.88, 0.18, 0.06]],
      [[0.68, -0.72, -0.14], [0.78, 0.18, -0.12]]
    ];
    for (const [p0, p1] of anchors) {
      const mid = [(p0[0] + p1[0]) * 0.5, (p0[1] + p1[1]) * 0.5, (p0[2] + p1[2]) * 0.5 + 0.04];
      cords.push(makeTube([p0, mid, p1], 0.026, 16, 8));
    }
    registerPart(byId.chordae_tendineae, cords, [0, 0, 0], 'chordae');
  }

  {
    const p1 = organicize(new THREE.ConeGeometry(0.16, 0.52, 18), 0.03, 4);
    p1.translate(-0.92, -0.72, 0.36);
    const p2 = organicize(new THREE.ConeGeometry(0.15, 0.48, 18), 0.028, 4.4);
    p2.translate(-0.72, -0.78, 0.18);
    const p3 = organicize(new THREE.ConeGeometry(0.18, 0.58, 18), 0.032, 3.8);
    p3.translate(0.92, -0.82, 0.14);
    const p4 = organicize(new THREE.ConeGeometry(0.17, 0.54, 18), 0.03, 4.2);
    p4.translate(0.68, -0.86, -0.14);
    registerPart(byId.papillary_muscles, [p1, p2, p3, p4], [0, 0, 0], 'ventricle');
  }

  // 3. Great Vessels (9)
  {
    const archTube = makeTube([[0.26, 0.72, 0.12], [0.14, 1.55, 0.18], [0.02, 2.32, 0.04], [0.24, 2.68, -0.32], [0.52, 2.38, -0.68]], 0.38, 48, 24);
    const brachiocephalic = makeTube([[0.04, 2.48, -0.02], [-0.18, 3.12, -0.05]], 0.13, 16, 12);
    const leftCarotid = makeTube([[0.18, 2.62, -0.22], [0.16, 3.22, -0.24]], 0.1, 16, 12);
    const leftSubclavian = makeTube([[0.36, 2.58, -0.44], [0.44, 3.15, -0.48]], 0.1, 16, 12);
    registerPart(byId.aorta_arch, [archTube, brachiocephalic, leftCarotid, leftSubclavian], [0, 0, 0], 'artery');
  }

  registerPart(byId.descending_aorta, [makeTube([[0.52, 2.38, -0.68], [0.48, 1.15, -0.88], [0.38, -0.35, -0.92], [0.32, -1.95, -0.86]], 0.34, 40, 20)], [0, 0, 0], 'artery');
  registerPart(byId.pulmonary_trunk, [makeTube([[-0.18, 1.32, 0.64], [-0.04, 1.78, 0.52], [0.12, 2.04, 0.24]], 0.34, 32, 22)], [0, 0, 0], 'artery');
  registerPart(byId.left_pulmonary_artery, [makeTube([[0.12, 2.04, 0.24], [0.78, 2.12, 0.08], [1.68, 2.04, -0.14]], 0.24, 28, 18)], [0, 0, 0], 'artery');
  registerPart(byId.right_pulmonary_artery, [makeTube([[0.12, 2.04, 0.24], [-0.64, 2.06, 0.02], [-1.68, 1.98, -0.18]], 0.24, 28, 18)], [0, 0, 0], 'artery');
  registerPart(byId.superior_vena_cava, [makeTube([[-1.18, 1.25, 0.12], [-1.16, 2.15, 0.08], [-1.12, 2.98, 0.04]], 0.31, 28, 20)], [0, 0, 0], 'vein');
  registerPart(byId.inferior_vena_cava, [makeTube([[-1.18, 0.42, -0.14], [-1.16, -0.75, -0.28], [-1.12, -2.02, -0.34]], 0.33, 28, 20)], [0, 0, 0], 'vein');
  registerPart(byId.left_pulmonary_veins, [makeTube([[2.05, 1.38, -0.26], [1.45, 1.22, -0.26]], 0.16, 20, 14), makeTube([[2.02, 0.88, -0.34], [1.42, 0.86, -0.3]], 0.16, 20, 14)], [0, 0, 0], 'vein');
  registerPart(byId.right_pulmonary_veins, [makeTube([[-1.95, 1.32, -0.52], [-0.45, 1.18, -0.58], [0.82, 1.14, -0.44]], 0.15, 28, 14), makeTube([[-1.92, 0.84, -0.58], [-0.42, 0.82, -0.62], [0.82, 0.84, -0.46]], 0.15, 28, 14)], [0, 0, 0], 'vein');

  // 4. Coronary Vasculature (4)
  registerPart(byId.coronary_sinus, [makeTube([[1.18, 0.34, -0.78], [0.42, 0.22, -0.92], [-0.38, 0.25, -0.82], [-0.95, 0.42, -0.45]], 0.11, 32, 14)], [0, 0, 0], 'coronary');
  registerPart(byId.right_coronary_artery, [makeTube([[0.12, 0.78, 0.36], [-0.65, 0.52, 0.88], [-1.38, 0.12, 0.65], [-1.42, -0.45, 0.08], [-0.82, -0.95, -0.68], [-0.08, -1.35, -0.72]], 0.068, 48, 12), makeTube([[-1.38, -0.18, 0.52], [-1.18, -0.95, 0.78], [-0.72, -1.48, 0.72]], 0.046, 24, 10)], [0, 0, 0], 'coronary');
  registerPart(byId.left_anterior_descending, [makeTube([[0.36, 0.78, 0.32], [0.18, 0.42, 0.86], [0.08, -0.18, 1.06], [0.24, -0.88, 1.04], [0.56, -1.52, 0.82], [0.88, -1.96, 0.48]], 0.072, 48, 12), makeTube([[0.14, -0.05, 1.04], [0.78, -0.52, 1.08], [1.26, -1.08, 0.82]], 0.048, 24, 10)], [0, 0, 0], 'coronary');
  registerPart(byId.left_circumflex_artery, [makeTube([[0.36, 0.78, 0.32], [0.92, 0.56, 0.58], [1.48, 0.35, 0.14], [1.52, 0.08, -0.48], [1.12, -0.45, -0.88]], 0.066, 40, 12), makeTube([[1.48, 0.22, -0.05], [1.62, -0.58, 0.12], [1.38, -1.28, 0.08]], 0.046, 24, 10)], [0, 0, 0], 'coronary');

  root.updateMatrixWorld(true);
  const fullBox = new THREE.Box3().setFromObject(root);
  const bounds = {
    min: [fullBox.min.x, fullBox.min.y, fullBox.min.z],
    max: [fullBox.max.x, fullBox.max.y, fullBox.max.z]
  };
  updateCardiacUniformsFromBounds(cardiacUniforms, bounds);

  return {
    root,
    partMeshes,
    pickableMeshes,
    partsCatalog: HEART_PARTS,
    cardiacUniforms,
    textures,
    bounds,
    manifest: null,
    isFallback: true,
    tier: qualityConfig.tier || 'high'
  };
}
