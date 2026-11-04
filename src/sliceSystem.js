import * as THREE from 'three';
import { attachSubsurfaceShader } from './textures.js';

export const DEFAULT_SLICE_PRESETS = [
  {
    id: 'inside-heart',
    label: 'Inside of heart',
    axis: 'z',
    percent: 46,
    obliqueNormal: [-0.18, 0.05, -0.982],
    description: 'Anatomical coronal cutaway exposing all 4 chambers, valves, chordae, and great vessel roots.'
  },
  {
    id: 'four-chamber',
    label: '4-Chamber',
    axis: 'z',
    percent: 52,
    description: 'Coronal cut through RA, RV, LA, LV, septa, and AV valves.'
  },
  {
    id: 'outflow-tract',
    label: 'Outflow (LVOT)',
    axis: 'z',
    percent: 38,
    description: 'Anterior coronal cut across the RV infundibulum, pulmonary valve, and aortic root.'
  },
  {
    id: 'sagittal-valves',
    label: 'Sagittal Bicaval',
    axis: 'x',
    percent: 48,
    description: 'Left-to-right cut across the interventricular septum, AV rings, and venae cavae.'
  },
  {
    id: 'short-axis',
    label: 'Short-Axis',
    axis: 'y',
    percent: 62,
    description: 'Transverse mid-ventricular cut comparing concentric LV wall thickness against the crescentic RV.'
  }
];

const LAYER_CONFIGS = [
  {
    key: 'myocardium',
    matchKinds: ['myocardium', 'endocardium'],
    color: 0xd05c5e,
    sssHex: 0xff382c,
    roughness: 0.46,
    clearcoat: 0.52,
    muscle: 1
  },
  {
    key: 'fat',
    matchKinds: ['fat'],
    color: 0xecc488,
    sssHex: 0xffb868,
    roughness: 0.48,
    clearcoat: 0.32,
    muscle: 1
  },
  {
    key: 'valve',
    matchKinds: ['valve', 'cord'],
    color: 0xf5ebd6,
    sssHex: 0xffe4b8,
    roughness: 0.28,
    clearcoat: 0.58,
    muscle: 1
  },
  {
    key: 'artery',
    matchKinds: ['artery'],
    color: 0xcf585c,
    sssHex: 0xff3842,
    roughness: 0.38,
    clearcoat: 0.58,
    muscle: 0.35
  },
  {
    key: 'vein',
    matchKinds: ['vein'],
    color: 0x5c7ca6,
    sssHex: 0x3b68a0,
    roughness: 0.38,
    clearcoat: 0.58,
    muscle: 0.35
  }
];

/**
 * Builds the surgical cross-section slice system:
 * - Bounds-derived coronal (z), sagittal (x), and short-axis (y) plane kinematics
 * - Multi-layer front/back stencil passes + textured cross-section cap planes
 * - Interactive visual slice frame helper
 * - Real-time detection of anatomical structures intersected by the cut plane
 */
export function createSliceSystem({ clippingPlane }) {
  const root = new THREE.Group();
  root.name = 'SliceSystemRoot';

  let heartModel = null;
  let bounds = {
    min: [-1.8, -2.46, -2.12],
    max: [1.95, 3.09, 1.75]
  };

  const state = {
    enabled: false,
    percent: 0,
    axis: 'z',
    presetId: null,
    showPlane: true,
    showCaps: true,
    offsetWorld: 8.0,
    offsetMm: 0
  };

  // Visual surgical slice frame (translucent plane + border ring + crosshairs)
  const helperGroup = new THREE.Group();
  helperGroup.visible = false;

  const frameOuterGeo = new THREE.RingGeometry(2.18, 2.21, 72);
  const frameOuterMat = new THREE.MeshBasicMaterial({
    color: 0xd5cdc0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.45,
    depthWrite: false
  });
  const frameRingMesh = new THREE.Mesh(frameOuterGeo, frameOuterMat);
  helperGroup.add(frameRingMesh);

  const glassPlaneGeo = new THREE.CircleGeometry(2.18, 72);
  const glassPlaneMat = new THREE.MeshBasicMaterial({
    color: 0xf4f0e8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.03,
    depthWrite: false
  });
  const glassPlaneMesh = new THREE.Mesh(glassPlaneGeo, glassPlaneMat);
  helperGroup.add(glassPlaneMesh);

  root.add(helperGroup);

  // Stencil cap containers
  const stencilRoot = new THREE.Group();
  stencilRoot.name = 'StencilCapLayers';
  root.add(stencilRoot);

  let layerRecords = [];

  function disposeStencilLayers() {
    for (const rec of layerRecords) {
      rec.backMat.dispose();
      rec.frontMat.dispose();
      rec.capMat.dispose();
      rec.capGeo.dispose();
    }
    layerRecords = [];
    stencilRoot.clear();
  }

  function rebuildStencilLayers() {
    disposeStencilLayers();
    if (!heartModel || !heartModel.partMeshes) return;

    const textures = heartModel.textures;
    const cardiacUniforms = heartModel.cardiacUniforms;
    const spanX = bounds.max[0] - bounds.min[0];
    const spanY = bounds.max[1] - bounds.min[1];
    const spanZ = bounds.max[2] - bounds.min[2];
    const capSize = Math.max(spanX, spanY, spanZ) * 1.45;

    LAYER_CONFIGS.forEach((layerCfg, layerIdx) => {
      const baseOrder = 10 + layerIdx * 4;
      const backMat = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        clippingPlanes: [clippingPlane],
        colorWrite: false,
        depthWrite: false,
        depthTest: false,
        stencilWrite: true,
        stencilFunc: THREE.AlwaysStencilFunc,
        stencilFail: THREE.IncrementWrapStencilOp,
        stencilZFail: THREE.IncrementWrapStencilOp,
        stencilZPass: THREE.IncrementWrapStencilOp
      });
      const frontMat = new THREE.MeshBasicMaterial({
        side: THREE.FrontSide,
        clippingPlanes: [clippingPlane],
        colorWrite: false,
        depthWrite: false,
        depthTest: false,
        stencilWrite: true,
        stencilFunc: THREE.AlwaysStencilFunc,
        stencilFail: THREE.DecrementWrapStencilOp,
        stencilZFail: THREE.DecrementWrapStencilOp,
        stencilZPass: THREE.DecrementWrapStencilOp
      });

      // Inject the exact same torsional heartbeat vertex deformation into stencil passes
      if (cardiacUniforms) {
        attachSubsurfaceShader(backMat, layerCfg.sssHex, 0, cardiacUniforms, layerCfg.muscle, false);
        attachSubsurfaceShader(frontMat, layerCfg.sssHex, 0, cardiacUniforms, layerCfg.muscle, false);
      }

      const pairs = [];
      for (const partRec of heartModel.partMeshes.values()) {
        for (const srcMesh of partRec.meshes) {
          const kind = srcMesh.userData.tissueKind || 'myocardium';
          if (!layerCfg.matchKinds.includes(kind)) continue;
          // Exclude supplemental overlapping caps from stencil winding so hollow chambers stay open
          if (srcMesh.name && srcMesh.name.startsWith('Supp_cardiac_apex')) continue;

          const backMesh = new THREE.Mesh(srcMesh.geometry, backMat);
          backMesh.renderOrder = baseOrder;
          backMesh.frustumCulled = false;

          const frontMesh = new THREE.Mesh(srcMesh.geometry, frontMat);
          frontMesh.renderOrder = baseOrder + 1;
          frontMesh.frustumCulled = false;

          stencilRoot.add(backMesh);
          stencilRoot.add(frontMesh);
          pairs.push({ srcMesh, partRec, backMesh, frontMesh });
        }
      }

      const capGeo = new THREE.PlaneGeometry(capSize, capSize);
      const capMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(layerCfg.color),
        map:
          layerCfg.key === 'fat'
            ? textures?.adiposeAlbedo || null
            : textures?.myocardiumAlbedo || null,
        normalMap:
          layerCfg.key === 'fat'
            ? textures?.adiposeNormal || null
            : textures?.myocardiumNormal || null,
        normalScale: new THREE.Vector2(0.75, 0.75),
        roughness: layerCfg.roughness,
        metalness: 0.02,
        clearcoat: layerCfg.clearcoat,
        clearcoatRoughness: 0.18,
        side: THREE.DoubleSide,
        stencilWrite: true,
        stencilRef: 0,
        stencilFunc: THREE.NotEqualStencilFunc,
        stencilFail: THREE.ReplaceStencilOp,
        stencilZFail: THREE.ReplaceStencilOp,
        stencilZPass: THREE.ReplaceStencilOp
      });

      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.renderOrder = baseOrder + 2;
      capMesh.frustumCulled = false;
      stencilRoot.add(capMesh);

      layerRecords.push({
        key: layerCfg.key,
        pairs,
        backMat,
        frontMat,
        capGeo,
        capMat,
        capMesh
      });
    });
  }

  function bindHeartModel(newHeartModel) {
    heartModel = newHeartModel;
    if (heartModel?.bounds) {
      bounds = {
        min: [...heartModel.bounds.min],
        max: [...heartModel.bounds.max]
      };
    }

    // Scale helper ring to match model bounds
    const maxSpan = Math.max(
      bounds.max[0] - bounds.min[0],
      bounds.max[1] - bounds.min[1],
      bounds.max[2] - bounds.min[2]
    );
    const radiusScale = Math.max(0.85, (maxSpan * 0.46) / 2.2);
    frameRingMesh.scale.setScalar(radiusScale);
    glassPlaneMesh.scale.setScalar(radiusScale);

    rebuildStencilLayers();
    applyPlaneTransform();
  }

  function applyPlaneTransform() {
    const isActive = state.enabled && state.percent > 0;
    if (!isActive) {
      clippingPlane.normal.set(0, 0, -1);
      clippingPlane.constant = 12.0;
      helperGroup.visible = false;
      stencilRoot.visible = false;
      state.offsetWorld = 12.0;
      state.offsetMm = 0;
      return;
    }

    const axisIdx = state.axis === 'x' ? 0 : state.axis === 'y' ? 1 : 2;
    const minVal = bounds.min[axisIdx];
    const maxVal = bounds.max[axisIdx];
    const pad = (maxVal - minVal) * 0.04;
    const start = maxVal - pad;
    const end = minVal + pad;
    const t = Math.max(0.01, Math.min(0.99, state.percent / 100));
    const offset = start - t * (start - end);

    state.offsetWorld = offset;
    const mid = (minVal + maxVal) * 0.5;
    // 1 scene unit = 1/30 m = 33.33 mm
    state.offsetMm = Math.round((offset - mid) * 33.3);

    const cx = (bounds.min[0] + bounds.max[0]) * 0.5;
    const cy = (bounds.min[1] + bounds.max[1]) * 0.5;
    const cz = (bounds.min[2] + bounds.max[2]) * 0.5;

    if (state.axis === 'z') {
      if (state.presetId === 'inside-heart') {
        clippingPlane.normal.set(-0.18, 0.05, -0.982).normalize();
      } else {
        clippingPlane.normal.set(0, 0, -1);
      }
      clippingPlane.constant = offset;
      helperGroup.position.set(cx, cy, offset);
      helperGroup.lookAt(
        cx - clippingPlane.normal.x,
        cy - clippingPlane.normal.y,
        offset - clippingPlane.normal.z
      );
    } else if (state.axis === 'x') {
      clippingPlane.normal.set(-1, 0, 0);
      clippingPlane.constant = offset;
      helperGroup.rotation.set(0, Math.PI / 2, 0);
      helperGroup.position.set(offset, cy, cz);
    } else {
      clippingPlane.normal.set(0, -1, 0);
      clippingPlane.constant = offset;
      helperGroup.rotation.set(Math.PI / 2, 0, 0);
      helperGroup.position.set(cx, offset, cz);
    }

    helperGroup.visible = Boolean(state.showPlane);
    stencilRoot.visible = Boolean(state.showCaps);

    // Coplanar orientation for each layer cap plane
    const lookTarget = helperGroup.position.clone().add(clippingPlane.normal);
    for (const rec of layerRecords) {
      rec.capMesh.position.copy(helperGroup.position);
      rec.capMesh.lookAt(lookTarget);
    }
  }

  /**
   * Synchronizes stencil pass world transforms and visibility with the animated/exploded heart meshes.
   */
  function update() {
    if (!state.enabled || state.percent <= 0 || !state.showCaps) {
      stencilRoot.visible = false;
      return;
    }
    stencilRoot.visible = true;
    for (const rec of layerRecords) {
      let anyVisible = false;
      for (const pair of rec.pairs) {
        const vis =
          pair.partRec.group.visible &&
          pair.srcMesh.visible &&
          !pair.srcMesh.material?.transparent;
        pair.backMesh.visible = vis;
        pair.frontMesh.visible = vis;
        if (vis) {
          anyVisible = true;
          pair.backMesh.position.copy(pair.partRec.group.position);
          pair.backMesh.rotation.copy(pair.partRec.group.rotation);
          pair.backMesh.scale.copy(pair.partRec.group.scale);
          pair.frontMesh.position.copy(pair.partRec.group.position);
          pair.frontMesh.rotation.copy(pair.partRec.group.rotation);
          pair.frontMesh.scale.copy(pair.partRec.group.scale);
        }
      }
      rec.capMesh.visible = anyVisible;
    }
  }

  /**
   * Returns the list of anatomical structures whose 3D bounding box is intersected by the active slice plane.
   */
  const tempBox = new THREE.Box3();
  function getExposedStructures() {
    if (!state.enabled || state.percent <= 0 || !heartModel?.partMeshes) {
      return [];
    }
    const exposed = [];
    for (const rec of heartModel.partMeshes.values()) {
      if (!rec.group.visible) continue;
      tempBox.copy(rec.bounds).translate(rec.group.position);
      if (tempBox.intersectsPlane(clippingPlane)) {
        exposed.push(rec.meta);
      }
    }
    return exposed;
  }

  function getAnatomicalReadout() {
    if (!state.enabled || state.percent <= 0) {
      return 'No section cut';
    }
    const axisName =
      state.axis === 'z'
        ? 'Coronal'
        : state.axis === 'x'
          ? 'Sagittal'
          : 'Axial';
    const sign = state.offsetMm >= 0 ? `+${state.offsetMm}` : `${state.offsetMm}`;
    return `${axisName} · ${state.percent}% (${sign} mm)`;
  }

  function setSlice({ enabled, percent, axis, presetId, showPlane, showCaps } = {}) {
    if (typeof axis === 'string') state.axis = axis;
    if (typeof percent === 'number') {
      state.percent = Math.max(0, Math.min(100, Math.round(percent)));
      state.enabled = state.percent > 0;
    }
    if (typeof enabled === 'boolean') {
      state.enabled = enabled;
      if (enabled && state.percent === 0) state.percent = 50;
      if (!enabled) state.percent = 0;
    }
    if (presetId !== undefined) state.presetId = presetId;
    if (typeof showPlane === 'boolean') state.showPlane = showPlane;
    if (typeof showCaps === 'boolean') state.showCaps = showCaps;

    applyPlaneTransform();
    return getState();
  }

  function applyPreset(presetId) {
    const presets = heartModel?.manifest?.slicePresets || DEFAULT_SLICE_PRESETS;
    const found = presets.find((p) => p.id === presetId);
    if (!found) return getState();
    return setSlice({
      enabled: true,
      axis: found.axis,
      percent: found.percent,
      presetId: found.id
    });
  }

  function reset() {
    return setSlice({ enabled: false, percent: 0, presetId: null });
  }

  function getPresets() {
    return heartModel?.manifest?.slicePresets || DEFAULT_SLICE_PRESETS;
  }

  function getState() {
    return {
      ...state,
      readout: getAnatomicalReadout()
    };
  }

  return {
    root,
    helperMesh: glassPlaneMesh,
    bindHeartModel,
    update,
    setSlice,
    applyPreset,
    reset,
    getState,
    getPresets,
    getExposedStructures,
    getAnatomicalReadout
  };
}
