import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { HEART_PARTS, HEART_PARTS_BY_ID } from './heartCatalog.js';
import { createCardiacTextureSet } from './textures.js';
import {
  createCardiacUniforms,
  kindForRole,
  makeTissueMaterial,
  updateCardiacUniformsFromBounds
} from './heartMaterials.js';
import { createProceduralHeartModel } from './heartProcedural.js';

/**
 * Fallback name-to-partId lookup table so raw or externally supplied HuBMAP GLBs
 * still map cleanly even if node extras were stripped.
 */
export const NODE_NAME_TO_PART_ID = {
  VH_M_right_cardiac_atrium: 'right_atrium',
  VH_M_heart_right_ventricle: 'right_ventricle',
  VH_M_left_cardiac_atrium: 'left_atrium',
  VH_M_heart_left_ventricle: 'left_ventricle',
  VH_M_interventricular_septum: 'interventricular_septum',
  VH_M_tricuspid_valve: 'tricuspid_valve',
  VH_M_mitral_valve: 'mitral_valve',
  VH_M_pulmonary_valve: 'pulmonary_valve',
  VH_M_aortic_valve: 'aortic_valve',
  VH_M_papillary_muscle_of_heart_anterior: 'papillary_muscles',
  VH_M_papillary_muscle_of_heart_anterolateral: 'papillary_muscles',
  VH_M_papillary_muscle_of_heart_medial: 'papillary_muscles',
  VH_M_papillary_muscle_of_heart_posterior: 'papillary_muscles',
  VH_M_papillary_muscle_of_heart_posteromedial: 'papillary_muscles',
  VH_M_ascending_aorta: 'aorta_arch',
  VH_M_aortic_arch: 'aorta_arch',
  VH_M_brachiocephalic_artery_a: 'aorta_arch',
  VH_M_brachiocephalic_artery_b: 'aorta_arch',
  VH_M_left_common_carotid_artery_a: 'aorta_arch',
  VH_M_left_subclavian_artery_a: 'aorta_arch',
  VH_M_descending_aorta_a: 'descending_aorta',
  VH_M_pulmonary_trunk: 'pulmonary_trunk',
  VH_M_pulmonary_artery_L: 'left_pulmonary_artery',
  VH_M_pulmonary_artery_R: 'right_pulmonary_artery',
  VH_M_superior_vena_cava: 'superior_vena_cava',
  VH_M_inferior_vena_cava_a: 'inferior_vena_cava',
  VH_M_pulmonary_vein_L_sup: 'left_pulmonary_veins',
  VH_M_pulmonary_vein_L_inf: 'left_pulmonary_veins',
  VH_M_pulmonary_vein_R_sup: 'right_pulmonary_veins',
  VH_M_pulmonary_vein_R_inf: 'right_pulmonary_veins',
  VH_M_coronary_sinus: 'coronary_sinus',
  VH_M_great_cardiac_vein: 'coronary_sinus',
  VH_M_middle_cardiac_vein: 'coronary_sinus',
  VH_M_small_cardiac_vein: 'coronary_sinus',
  VH_M_anterior_cardiac_vein: 'coronary_sinus',
  VH_M_posterior_vein_of_left_ventricle: 'coronary_sinus',
  VH_M_oblique_vein_of_left_atrium: 'coronary_sinus',
  VH_M_right_coronary_artery: 'right_coronary_artery',
  VH_M_right_marginal_artery: 'right_coronary_artery',
  VH_M_right_posterior_descending_artery: 'right_coronary_artery',
  VH_M_left_anterior_descending_artery: 'left_anterior_descending',
  VH_M_diagonal_branch_of_anterior_descending_branch_of_left_coronary_artery:
    'left_anterior_descending',
  VH_M_left_coronary_artery: 'left_circumflex_artery',
  VH_M_left_marginal_branch: 'left_circumflex_artery',
  VH_M_diagonal_branch_of_left_anterior_descending_artery: 'left_circumflex_artery',
  Supp_cardiac_apex: 'cardiac_apex',
  Supp_interatrial_septum_wall: 'interatrial_septum',
  Supp_fossa_ovalis_limbus: 'interatrial_septum'
};

export function resolvePartMetadataFromNode(node) {
  const userData = node?.userData || {};
  const meshData = node?.geometry?.userData || {};
  const rawName = node?.name || '';

  let partId = userData.partId || meshData.partId || NODE_NAME_TO_PART_ID[rawName] || null;
  if (!partId && rawName.startsWith('Supp_chordae_tendineae')) {
    partId = 'chordae_tendineae';
  }
  if (!partId && rawName.startsWith('Supp_pulmonary_semilunar')) {
    partId = 'pulmonary_valve';
  }
  if (!partId && rawName.startsWith('Supp_aortic_semilunar')) {
    partId = 'aortic_valve';
  }
  if (!partId && HEART_PARTS_BY_ID[rawName]) {
    partId = rawName;
  }

  const meta = partId ? HEART_PARTS_BY_ID[partId] || null : null;
  if (!meta) return null;

  const defaultAnimRole =
    meta.category === 'Chambers & Septa'
      ? meta.subGroup === 'Atria'
        ? 'atrium'
        : meta.subGroup === 'Cardiac Septa'
          ? 'septum'
          : meta.id === 'cardiac_apex'
            ? 'apex'
            : 'ventricle'
      : meta.category === 'Valves & Apparatus'
        ? meta.subGroup === 'Atrioventricular Valves'
          ? 'av_valve'
          : meta.subGroup === 'Semilunar Valves'
            ? 'sl_valve'
            : meta.id === 'chordae_tendineae'
              ? 'chordae'
              : 'ventricle'
        : meta.category === 'Coronary System'
          ? 'coronary'
          : meta.oxygenation.toLowerCase().includes('deoxygenated') &&
              !meta.id.includes('pulmonary')
            ? 'vein'
            : 'artery';

  const animRole = userData.animRole || meshData.animRole || defaultAnimRole;
  const tissueKind = userData.tissueKind || meshData.tissueKind || kindForRole(animRole);

  return {
    partId,
    meta,
    animRole,
    tissueKind,
    ontologyId: userData.ontologyId || meta.ontologyId,
    sourceProvenance: userData.sourceProvenance || meta.sourceProvenance
  };
}

/**
 * Ensures a loaded BufferGeometry has UVs (`uv`) and `_ENDOCARDIUM` attributes.
 */
function ensureGeometryAttributes(geo) {
  const pos = geo.attributes.position;
  if (!pos) return;
  const count = pos.count;

  if (!geo.attributes.normal) {
    geo.computeVertexNormals();
  }

  if (!geo.attributes.uv) {
    const uvs = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      uvs[i * 2] = x * 0.42 + z * 0.28 + 0.5;
      uvs[i * 2 + 1] = y * 0.42 + 0.5;
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  }

  if (!geo.attributes._ENDOCARDIUM) {
    geo.setAttribute('_ENDOCARDIUM', new THREE.BufferAttribute(new Float32Array(count), 1));
  }
}

/**
 * Asynchronously loads the bundled HuBMAP anatomical heart GLB for the requested
 * quality tier, maps all 26 structures, and attaches surgical PBR + SSS shaders.
 */
export async function loadAnatomicalHeartModel({
  clippingPlane,
  qualityConfig = {},
  onProgress
} = {}) {
  const tier = qualityConfig.tier || 'high';
  const modelUrl = qualityConfig.modelUrl || `/models/heart-${tier}.glb`;
  const manifestUrl = '/models/heart-manifest.json';

  const textures = createCardiacTextureSet();
  const clipPlanes = clippingPlane ? [clippingPlane] : [];
  const cardiacUniforms = createCardiacUniforms();

  try {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    const [gltf, manifest] = await Promise.all([
      new Promise((resolve, reject) => {
        loader.load(
          modelUrl,
          resolve,
          (evt) => {
            if (onProgress && evt.total > 0) {
              onProgress(Math.min(0.95, evt.loaded / evt.total));
            }
          },
          reject
        );
      }),
      fetch(manifestUrl)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    ]);

    const root = new THREE.Group();
    root.name = 'HeartRoot';

    const partMeshes = new Map();
    const pickableMeshes = [];
    const unmappedNodes = [];

    // Collect meshes grouped by partId
    const buckets = new Map();
    gltf.scene.traverse((child) => {
      if (!child.isMesh) return;
      const resolved = resolvePartMetadataFromNode(child);
      if (!resolved) {
        unmappedNodes.push(child.name || 'unnamed');
        return;
      }
      if (!buckets.has(resolved.partId)) {
        buckets.set(resolved.partId, []);
      }
      buckets.get(resolved.partId).push({ mesh: child, resolved });
    });

    for (const [partId, entries] of buckets.entries()) {
      const meta = HEART_PARTS_BY_ID[partId];
      const group = new THREE.Group();
      group.name = partId;

      const matCache = new Map();
      const materials = [];
      const meshes = [];
      const primaryRole = entries[0].resolved.animRole;

      function materialFor(kind, animRole) {
        const key = `${kind}_${animRole}`;
        if (!matCache.has(key)) {
          const mat = makeTissueMaterial(
            kind,
            meta,
            animRole,
            textures,
            clipPlanes,
            cardiacUniforms,
            qualityConfig
          );
          matCache.set(key, mat);
          materials.push(mat);
        }
        return matCache.get(key);
      }

      for (const { mesh: srcMesh, resolved } of entries) {
        const geo = srcMesh.geometry.clone();
        ensureGeometryAttributes(geo);

        const mat = materialFor(resolved.tissueKind, resolved.animRole);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.name = srcMesh.name;
        mesh.castShadow = qualityConfig.shadows !== false;
        mesh.receiveShadow = qualityConfig.shadows !== false;
        mesh.userData = {
          ...srcMesh.userData,
          partId,
          partMeta: meta,
          tissueKind: resolved.tissueKind,
          animRole: resolved.animRole,
          ontologyId: resolved.ontologyId,
          sourceProvenance: resolved.sourceProvenance
        };

        // Preserve any morph targets if present on the asset
        if (srcMesh.morphTargetInfluences) {
          mesh.morphTargetInfluences = [...srcMesh.morphTargetInfluences];
          mesh.morphTargetDictionary = { ...srcMesh.morphTargetDictionary };
        }

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

      partMeshes.set(partId, {
        id: partId,
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
        animRole: primaryRole
      });

      root.add(group);
    }

    // Supplement any missing catalog parts from procedural fallback if a partial custom GLB was loaded
    if (partMeshes.size < HEART_PARTS.length) {
      const fallback = createProceduralHeartModel(clippingPlane, qualityConfig, textures);
      for (const part of HEART_PARTS) {
        if (!partMeshes.has(part.id) && fallback.partMeshes.has(part.id)) {
          const rec = fallback.partMeshes.get(part.id);
          partMeshes.set(part.id, rec);
          root.add(rec.group);
          pickableMeshes.push(...rec.meshes);
        }
      }
    }

    root.updateMatrixWorld(true);
    const fullBox = new THREE.Box3().setFromObject(root);
    const bounds = manifest?.bounds || {
      min: [fullBox.min.x, fullBox.min.y, fullBox.min.z],
      max: [fullBox.max.x, fullBox.max.y, fullBox.max.z]
    };
    updateCardiacUniformsFromBounds(cardiacUniforms, bounds);

    if (onProgress) onProgress(1.0);

    return {
      root,
      partMeshes,
      pickableMeshes,
      partsCatalog: HEART_PARTS,
      cardiacUniforms,
      textures,
      bounds,
      manifest,
      unmappedNodes,
      isFallback: false,
      tier
    };
  } catch (err) {
    console.warn('GLB load failed, falling back to procedural heart model:', err);
    const fallback = createProceduralHeartModel(clippingPlane, qualityConfig, textures);
    fallback.loadError = err;
    if (onProgress) onProgress(1.0);
    return fallback;
  }
}
