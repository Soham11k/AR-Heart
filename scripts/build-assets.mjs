import fs from 'node:fs';
import path from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { cloneDocument, dedup, prune, reorder, simplify, weld } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import * as THREE from 'three';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const MODELS_DIR = path.join(ROOT_DIR, 'public', 'models');

const CACHE_DIR = path.join(ROOT_DIR, 'node_modules', '.cache', 'heart-assets');
const HEART_RAW_PATH = path.join(CACHE_DIR, 'VH_M_Heart.raw.glb');
const VASC_RAW_PATH = path.join(CACHE_DIR, 'VH_M_Blood_Vasculature_Heart.raw.glb');

const HEART_RAW_URL =
  'https://raw.githubusercontent.com/hubmapconsortium/ccf-3d-reference-object-library/main/VH_Male/v1.2/VH_M_Heart.glb';
const VASC_RAW_URL =
  'https://raw.githubusercontent.com/hubmapconsortium/ccf-3d-reference-object-library/main/VH_Male/v1.2/VH_M_Blood_Vasculature_Heart.glb';

async function ensureSourceFile(filePath, url) {
  if (fs.existsSync(filePath)) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filePath, buf);
}

// Normalization from Visible Human Male meter space into Heart AR scene space
const RAW_CENTER = [0.0165, 0.482, 0.032];
const SCENE_SCALE = 30.0;

/**
 * Direct mapping from HuBMAP node/mesh names to our 26-part catalog IDs,
 * tissue shader kinds, animation roles, and ontology IDs.
 */
const HUBMAP_NODE_MAP = {
  // Chambers & Septa
  VH_M_right_cardiac_atrium: {
    partId: 'right_atrium',
    tissueKind: 'myocardium',
    animRole: 'atrium',
    ontologyId: 'UBERON:0002078',
    label: 'Right cardiac atrium'
  },
  VH_M_heart_right_ventricle: {
    partId: 'right_ventricle',
    tissueKind: 'myocardium',
    animRole: 'ventricle',
    ontologyId: 'UBERON:0002080',
    label: 'Right cardiac ventricle'
  },
  VH_M_left_cardiac_atrium: {
    partId: 'left_atrium',
    tissueKind: 'myocardium',
    animRole: 'atrium',
    ontologyId: 'UBERON:0002079',
    label: 'Left cardiac atrium'
  },
  VH_M_heart_left_ventricle: {
    partId: 'left_ventricle',
    tissueKind: 'myocardium',
    animRole: 'ventricle',
    ontologyId: 'UBERON:0002084',
    label: 'Left cardiac ventricle'
  },
  VH_M_interventricular_septum: {
    partId: 'interventricular_septum',
    tissueKind: 'myocardium',
    animRole: 'septum',
    ontologyId: 'UBERON:0002094',
    label: 'Interventricular septum'
  },

  // Valves & Papillary Muscles
  VH_M_tricuspid_valve: {
    partId: 'tricuspid_valve',
    tissueKind: 'valve',
    animRole: 'av_valve',
    ontologyId: 'UBERON:0002134',
    label: 'Tricuspid valve'
  },
  VH_M_mitral_valve: {
    partId: 'mitral_valve',
    tissueKind: 'valve',
    animRole: 'av_valve',
    ontologyId: 'UBERON:0002135',
    label: 'Mitral valve'
  },
  VH_M_pulmonary_valve: {
    partId: 'pulmonary_valve',
    tissueKind: 'valve',
    animRole: 'sl_valve',
    ontologyId: 'UBERON:0002146',
    label: 'Pulmonary valve'
  },
  VH_M_aortic_valve: {
    partId: 'aortic_valve',
    tissueKind: 'valve',
    animRole: 'sl_valve',
    ontologyId: 'UBERON:0002137',
    label: 'Aortic valve'
  },
  VH_M_papillary_muscle_of_heart_anterior: {
    partId: 'papillary_muscles',
    tissueKind: 'myocardium',
    animRole: 'ventricle',
    ontologyId: 'FMA:7264',
    label: 'Anterior papillary muscle'
  },
  VH_M_papillary_muscle_of_heart_anterolateral: {
    partId: 'papillary_muscles',
    tissueKind: 'myocardium',
    animRole: 'ventricle',
    ontologyId: 'FMA:7265',
    label: 'Anterolateral papillary muscle'
  },
  VH_M_papillary_muscle_of_heart_medial: {
    partId: 'papillary_muscles',
    tissueKind: 'myocardium',
    animRole: 'ventricle',
    ontologyId: 'FMA:7262',
    label: 'Septal papillary muscle'
  },
  VH_M_papillary_muscle_of_heart_posterior: {
    partId: 'papillary_muscles',
    tissueKind: 'myocardium',
    animRole: 'ventricle',
    ontologyId: 'FMA:7261',
    label: 'Posterior papillary muscle'
  },
  VH_M_papillary_muscle_of_heart_posteromedial: {
    partId: 'papillary_muscles',
    tissueKind: 'myocardium',
    animRole: 'ventricle',
    ontologyId: 'FMA:7267',
    label: 'Posteromedial papillary muscle'
  },

  // Great Vessels
  VH_M_ascending_aorta: {
    partId: 'aorta_arch',
    tissueKind: 'artery',
    animRole: 'artery',
    ontologyId: 'UBERON:0001496',
    label: 'Ascending aorta'
  },
  VH_M_aortic_arch: {
    partId: 'aorta_arch',
    tissueKind: 'artery',
    animRole: 'artery',
    ontologyId: 'UBERON:0001508',
    label: 'Arch of aorta'
  },
  VH_M_brachiocephalic_artery_a: {
    partId: 'aorta_arch',
    tissueKind: 'artery',
    animRole: 'artery',
    ontologyId: 'UBERON:0001529',
    label: 'Brachiocephalic trunk'
  },
  VH_M_left_common_carotid_artery_a: {
    partId: 'aorta_arch',
    tissueKind: 'artery',
    animRole: 'artery',
    ontologyId: 'UBERON:0001530',
    label: 'Left common carotid artery (proximal)'
  },
  VH_M_left_subclavian_artery_a: {
    partId: 'aorta_arch',
    tissueKind: 'artery',
    animRole: 'artery',
    ontologyId: 'UBERON:0001533',
    label: 'Left subclavian artery (proximal)'
  },
  VH_M_descending_aorta_a: {
    partId: 'descending_aorta',
    tissueKind: 'artery',
    animRole: 'artery',
    ontologyId: 'UBERON:0001515',
    label: 'Descending thoracic aorta'
  },
  VH_M_pulmonary_trunk: {
    partId: 'pulmonary_trunk',
    tissueKind: 'artery',
    animRole: 'artery',
    ontologyId: 'UBERON:0002333',
    label: 'Pulmonary trunk'
  },
  VH_M_pulmonary_artery_L: {
    partId: 'left_pulmonary_artery',
    tissueKind: 'artery',
    animRole: 'artery',
    ontologyId: 'UBERON:0002012',
    label: 'Left pulmonary artery'
  },
  VH_M_pulmonary_artery_R: {
    partId: 'right_pulmonary_artery',
    tissueKind: 'artery',
    animRole: 'artery',
    ontologyId: 'UBERON:0002012',
    label: 'Right pulmonary artery'
  },
  VH_M_superior_vena_cava: {
    partId: 'superior_vena_cava',
    tissueKind: 'vein',
    animRole: 'vein',
    ontologyId: 'FMA:4720',
    label: 'Superior vena cava'
  },
  VH_M_inferior_vena_cava_a: {
    partId: 'inferior_vena_cava',
    tissueKind: 'vein',
    animRole: 'vein',
    ontologyId: 'FMA:10951',
    label: 'Inferior vena cava (thoracic)'
  },
  VH_M_pulmonary_vein_L_sup: {
    partId: 'left_pulmonary_veins',
    tissueKind: 'artery',
    animRole: 'vein',
    ontologyId: 'FMA:49916',
    label: 'Left superior pulmonary vein'
  },
  VH_M_pulmonary_vein_L_inf: {
    partId: 'left_pulmonary_veins',
    tissueKind: 'artery',
    animRole: 'vein',
    ontologyId: 'FMA:49913',
    label: 'Left inferior pulmonary vein'
  },
  VH_M_pulmonary_vein_R_sup: {
    partId: 'right_pulmonary_veins',
    tissueKind: 'artery',
    animRole: 'vein',
    ontologyId: 'FMA:49914',
    label: 'Right superior pulmonary vein'
  },
  VH_M_pulmonary_vein_R_inf: {
    partId: 'right_pulmonary_veins',
    tissueKind: 'artery',
    animRole: 'vein',
    ontologyId: 'FMA:49911',
    label: 'Right inferior pulmonary vein'
  },

  // Coronary System
  VH_M_coronary_sinus: {
    partId: 'coronary_sinus',
    tissueKind: 'vein',
    animRole: 'coronary',
    ontologyId: 'UBERON:0005438',
    label: 'Coronary sinus'
  },
  VH_M_great_cardiac_vein: {
    partId: 'coronary_sinus',
    tissueKind: 'vein',
    animRole: 'coronary',
    ontologyId: 'UBERON:0006635',
    label: 'Great cardiac vein'
  },
  VH_M_middle_cardiac_vein: {
    partId: 'coronary_sinus',
    tissueKind: 'vein',
    animRole: 'coronary',
    ontologyId: 'UBERON:0009687',
    label: 'Middle cardiac vein'
  },
  VH_M_small_cardiac_vein: {
    partId: 'coronary_sinus',
    tissueKind: 'vein',
    animRole: 'coronary',
    ontologyId: 'UBERON:0035374',
    label: 'Small cardiac vein'
  },
  VH_M_anterior_cardiac_vein: {
    partId: 'coronary_sinus',
    tissueKind: 'vein',
    animRole: 'coronary',
    ontologyId: 'FMA:76767',
    label: 'Anterior cardiac vein'
  },
  VH_M_posterior_vein_of_left_ventricle: {
    partId: 'coronary_sinus',
    tissueKind: 'vein',
    animRole: 'coronary',
    ontologyId: 'FMA:4712',
    label: 'Posterior vein of left ventricle'
  },
  VH_M_oblique_vein_of_left_atrium: {
    partId: 'coronary_sinus',
    tissueKind: 'vein',
    animRole: 'coronary',
    ontologyId: 'FMA:4715',
    label: 'Oblique vein of left atrium'
  },
  VH_M_right_coronary_artery: {
    partId: 'right_coronary_artery',
    tissueKind: 'artery',
    animRole: 'coronary',
    ontologyId: 'UBERON:0001628',
    label: 'Right coronary artery'
  },
  VH_M_right_marginal_artery: {
    partId: 'right_coronary_artery',
    tissueKind: 'artery',
    animRole: 'coronary',
    ontologyId: 'UBERON:0001628',
    label: 'Right marginal artery'
  },
  VH_M_right_posterior_descending_artery: {
    partId: 'right_coronary_artery',
    tissueKind: 'artery',
    animRole: 'coronary',
    ontologyId: 'UBERON:0001628',
    label: 'Posterior interventricular artery'
  },
  VH_M_left_anterior_descending_artery: {
    partId: 'left_anterior_descending',
    tissueKind: 'artery',
    animRole: 'coronary',
    ontologyId: 'UBERON:0001626',
    label: 'Left anterior descending artery'
  },
  VH_M_diagonal_branch_of_anterior_descending_branch_of_left_coronary_artery: {
    partId: 'left_anterior_descending',
    tissueKind: 'artery',
    animRole: 'coronary',
    ontologyId: 'UBERON:0001626',
    label: 'Diagonal branch of LAD'
  },
  VH_M_left_coronary_artery: {
    partId: 'left_circumflex_artery',
    tissueKind: 'artery',
    animRole: 'coronary',
    ontologyId: 'UBERON:0001625',
    label: 'Left main coronary artery'
  },
  VH_M_left_marginal_branch: {
    partId: 'left_circumflex_artery',
    tissueKind: 'artery',
    animRole: 'coronary',
    ontologyId: 'UBERON:0001627',
    label: 'Left marginal branch (circumflex)'
  },
  VH_M_diagonal_branch_of_left_anterior_descending_artery: {
    partId: 'left_circumflex_artery',
    tissueKind: 'artery',
    animRole: 'coronary',
    ontologyId: 'UBERON:0001627',
    label: 'Lateral circumflex ramus'
  }
};

function toScenePos(rawX, rawY, rawZ) {
  return [
    (rawX - RAW_CENTER[0]) * SCENE_SCALE,
    (rawY - RAW_CENTER[1]) * SCENE_SCALE,
    (rawZ - RAW_CENTER[2]) * SCENE_SCALE
  ];
}

/**
 * Generates cylindrical-spherical anatomical UVs and per-vertex endocardial cavity weights.
 */
function computeUVsAndEndo(posArray, nrmArray, isChamber) {
  const count = posArray.length / 3;
  const uvs = new Float32Array(count * 2);
  const endo = new Float32Array(count);

  let cx = 0,
    cy = 0,
    cz = 0;
  for (let i = 0; i < posArray.length; i += 3) {
    cx += posArray[i];
    cy += posArray[i + 1];
    cz += posArray[i + 2];
  }
  cx /= count;
  cy /= count;
  cz /= count;

  for (let i = 0; i < count; i++) {
    const px = posArray[i * 3];
    const py = posArray[i * 3 + 1];
    const pz = posArray[i * 3 + 2];
    const nx = nrmArray[i * 3];
    const ny = nrmArray[i * 3 + 1];
    const nz = nrmArray[i * 3 + 2];

    const dx = px - cx;
    const dy = py - cy;
    const dz = pz - cz;

    // Continuous triplanar-friendly UV projection (no Math.floor or atan2 seam jumps across triangles)
    const u = dx * 0.42 + dz * 0.28 + 0.5;
    const v = dy * 0.42 + 0.5;
    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;

    if (isChamber) {
      const len = Math.hypot(dx, dy, dz) || 1;
      const dot = (dx * nx + dy * ny + dz * nz) / len;
      // Negative dot means normal points inward toward the chamber lumen (endocardium)
      endo[i] = dot < -0.08 ? Math.min(1, (-dot - 0.08) / 0.35) : 0;
    } else {
      endo[i] = 0;
    }
  }

  return { uvs, endo, centroid: [cx, cy, cz] };
}

/**
 * Appends a THREE.BufferGeometry into the glTF Document as a named Node + Mesh.
 */
function appendThreeGeometry(doc, buffer, rootNode, geo, meta) {
  geo.computeVertexNormals();
  const posAttr = geo.attributes.position;
  const nrmAttr = geo.attributes.normal;
  const count = posAttr.count;

  const posArr = new Float32Array(count * 3);
  const nrmArr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    posArr[i * 3] = posAttr.getX(i);
    posArr[i * 3 + 1] = posAttr.getY(i);
    posArr[i * 3 + 2] = posAttr.getZ(i);
    nrmArr[i * 3] = nrmAttr.getX(i);
    nrmArr[i * 3 + 1] = nrmAttr.getY(i);
    nrmArr[i * 3 + 2] = nrmAttr.getZ(i);
  }

  const { uvs, endo, centroid } = computeUVsAndEndo(
    posArr,
    nrmArr,
    meta.tissueKind === 'myocardium'
  );

  let idxArr;
  if (geo.index) {
    idxArr = new Uint32Array(geo.index.array);
  } else {
    idxArr = Uint32Array.from({ length: count }, (_, i) => i);
  }

  const posAcc = doc.createAccessor().setType('VEC3').setArray(posArr).setBuffer(buffer);
  const nrmAcc = doc.createAccessor().setType('VEC3').setArray(nrmArr).setBuffer(buffer);
  const uvAcc = doc.createAccessor().setType('VEC2').setArray(uvs).setBuffer(buffer);
  const endoAcc = doc.createAccessor().setType('SCALAR').setArray(endo).setBuffer(buffer);
  const idxAcc = doc.createAccessor().setType('SCALAR').setArray(idxArr).setBuffer(buffer);

  const prim = doc
    .createPrimitive()
    .setAttribute('POSITION', posAcc)
    .setAttribute('NORMAL', nrmAcc)
    .setAttribute('TEXCOORD_0', uvAcc)
    .setAttribute('_ENDOCARDIUM', endoAcc)
    .setIndices(idxAcc);

  const extras = {
    partId: meta.partId,
    tissueKind: meta.tissueKind,
    animRole: meta.animRole,
    ontologyId: meta.ontologyId,
    sourceProvenance: meta.sourceProvenance,
    label: meta.label
  };

  const mesh = doc.createMesh(meta.nodeName).addPrimitive(prim).setExtras(extras);
  const node = doc.createNode(meta.nodeName).setMesh(mesh).setExtras(extras);
  rootNode.addChild(node);

  return { centroid, vertexCount: count, triangleCount: idxArr.length / 3 };
}

/**
 * Extracts a closed watertight Cardiac Apex cap molded directly from the apical region
 * of VH_M_heart_left_ventricle and VH_M_heart_right_ventricle.
 */
function buildApicalCapGeometry(lvPosArray, lvNrmArray, lvIdxArray) {
  // Apical axis points toward (+X, -Y, +Z) in normalized scene space
  const ax = 0.62,
    ay = -0.60,
    az = 0.50;
  const threshold = 1.38;

  const keptPositions = [];
  const keptNormals = [];
  const keptIndices = [];
  const oldToNew = new Map();
  const boundaryVerts = [];

  function addVert(oldIdx) {
    if (oldToNew.has(oldIdx)) return oldToNew.get(oldIdx);
    const nx = lvNrmArray[oldIdx * 3];
    const ny = lvNrmArray[oldIdx * 3 + 1];
    const nz = lvNrmArray[oldIdx * 3 + 2];
    // Slight 0.014 scene-unit outward offset so the apical cap sits cleanly on the epicardial tip
    const px = lvPosArray[oldIdx * 3] + nx * 0.014;
    const py = lvPosArray[oldIdx * 3 + 1] + ny * 0.014;
    const pz = lvPosArray[oldIdx * 3 + 2] + nz * 0.014;
    const newIdx = keptPositions.length / 3;
    keptPositions.push(px, py, pz);
    keptNormals.push(nx, ny, nz);
    oldToNew.set(oldIdx, newIdx);
    return newIdx;
  }

  for (let t = 0; t < lvIdxArray.length; t += 3) {
    const i0 = lvIdxArray[t],
      i1 = lvIdxArray[t + 1],
      i2 = lvIdxArray[t + 2];
    const s0 =
      lvPosArray[i0 * 3] * ax + lvPosArray[i0 * 3 + 1] * ay + lvPosArray[i0 * 3 + 2] * az;
    const s1 =
      lvPosArray[i1 * 3] * ax + lvPosArray[i1 * 3 + 1] * ay + lvPosArray[i1 * 3 + 2] * az;
    const s2 =
      lvPosArray[i2 * 3] * ax + lvPosArray[i2 * 3 + 1] * ay + lvPosArray[i2 * 3 + 2] * az;

    if (s0 >= threshold || s1 >= threshold || s2 >= threshold) {
      const n0 = addVert(i0);
      const n1 = addVert(i1);
      const n2 = addVert(i2);
      keptIndices.push(n0, n1, n2);
      if (s0 < threshold) boundaryVerts.push(n0);
      if (s1 < threshold) boundaryVerts.push(n1);
      if (s2 < threshold) boundaryVerts.push(n2);
    }
  }

  // Close the basal rim of the apical cap toward its centroid so stencil capping is watertight
  if (boundaryVerts.length >= 3) {
    let bx = 0,
      by = 0,
      bz = 0;
    for (const bi of boundaryVerts) {
      bx += keptPositions[bi * 3];
      by += keptPositions[bi * 3 + 1];
      bz += keptPositions[bi * 3 + 2];
    }
    bx /= boundaryVerts.length;
    by /= boundaryVerts.length;
    bz /= boundaryVerts.length;
    const centerIdx = keptPositions.length / 3;
    keptPositions.push(bx, by, bz);
    keptNormals.push(-ax, -ay, -az);
    for (let i = 0; i < boundaryVerts.length; i++) {
      const a = boundaryVerts[i];
      const b = boundaryVerts[(i + 1) % boundaryVerts.length];
      keptIndices.push(a, b, centerIdx);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(keptPositions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(keptNormals, 3));
  geo.setIndex(keptIndices);
  return geo;
}

/**
 * Builds supplemental anatomically anchored structures for the 3 catalog items not
 * segmented as separate meshes in HuBMAP (`interatrial_septum`, `chordae_tendineae`, `cardiac_apex`)
 * plus sulcus epicardial fat pads (`tissueKind: 'fat'`) and ventricular trabeculae (`tissueKind: 'trabecula'`).
 */
function buildSupplementalStructures(doc, buffer, rootNode, lvRawMeshData, partCentroids) {
  const stats = [];

  // 1. CARDIAC APEX (molded directly from the HuBMAP Left Ventricle apical mesh)
  const apexGeo = buildApicalCapGeometry(
    lvRawMeshData.pos,
    lvRawMeshData.nrm,
    lvRawMeshData.idx
  );
  stats.push({
    partId: 'cardiac_apex',
    ...appendThreeGeometry(doc, buffer, rootNode, apexGeo, {
      nodeName: 'Supp_cardiac_apex',
      partId: 'cardiac_apex',
      tissueKind: 'myocardium',
      animRole: 'apex',
      ontologyId: 'UBERON:0002098',
      sourceProvenance: 'hubmap-vhm-derived',
      label: 'Cardiac apex (derived from VHM left ventricle)'
    })
  });

  // 2. INTERATRIAL SEPTUM (positioned between HuBMAP Right Atrium & Left Atrium centroids)
  const raC = partCentroids.get('right_atrium') || [-1.02, -0.03, 0.07];
  const laC = partCentroids.get('left_atrium') || [-0.36, 0.32, -0.71];
  const iasPos = [
    (raC[0] + laC[0]) * 0.5,
    (raC[1] + laC[1]) * 0.5,
    (raC[2] + laC[2]) * 0.5
  ];
  const iasDisk = new THREE.CylinderGeometry(0.46, 0.46, 0.11, 32, 4);
  iasDisk.rotateZ(Math.PI * 0.42);
  iasDisk.rotateY(-0.58);
  iasDisk.translate(iasPos[0], iasPos[1], iasPos[2]);

  const fossaTorus = new THREE.TorusGeometry(0.19, 0.038, 14, 28);
  fossaTorus.rotateY(0.85);
  fossaTorus.translate(iasPos[0] - 0.04, iasPos[1] - 0.02, iasPos[2] + 0.04);

  stats.push({
    partId: 'interatrial_septum',
    ...appendThreeGeometry(doc, buffer, rootNode, iasDisk, {
      nodeName: 'Supp_interatrial_septum_wall',
      partId: 'interatrial_septum',
      tissueKind: 'myocardium',
      animRole: 'septum',
      ontologyId: 'UBERON:0002085',
      sourceProvenance: 'supplemental-anatomical',
      label: 'Interatrial septum'
    })
  });
  appendThreeGeometry(doc, buffer, rootNode, fossaTorus, {
    nodeName: 'Supp_fossa_ovalis_limbus',
    partId: 'interatrial_septum',
    tissueKind: 'myocardium',
    animRole: 'septum',
    ontologyId: 'UBERON:0002085',
    sourceProvenance: 'supplemental-anatomical',
    label: 'Limbus of fossa ovalis'
  });

  // 3. CHORDAE TENDINEAE (32 fan-like collagenous tendons connecting the 5 HuBMAP papillary muscles
  //    to the HuBMAP tricuspid and mitral valve leaflets, plus sculpted fibrous leaflet curtains)
  const tvC = partCentroids.get('tricuspid_valve') || [-0.66, -0.66, 0.41];
  const mvC = partCentroids.get('mitral_valve') || [0.19, -0.15, -0.61];
  const pvC = partCentroids.get('pulmonary_valve') || [0.02, 0.80, 0.30];
  const avC = partCentroids.get('aortic_valve') || [-0.29, 0.52, -0.10];

  const papillaryFans = [
    // RV Anterior papillary muscle fan -> Tricuspid anterior & posterior leaflets
    {
      origin: [-0.04, -0.89, 1.32],
      insertions: [
        [tvC[0] + 0.28, tvC[1] + 0.04, tvC[2] + 0.34],
        [tvC[0] + 0.22, tvC[1] + 0.02, tvC[2] + 0.24],
        [tvC[0] + 0.15, tvC[1] + 0.00, tvC[2] + 0.15],
        [tvC[0] + 0.08, tvC[1] - 0.02, tvC[2] + 0.28],
        [tvC[0] + 0.32, tvC[1] - 0.01, tvC[2] + 0.12]
      ]
    },
    // RV Medial (septal) papillary muscle fan -> Tricuspid septal & anterior leaflets
    {
      origin: [0.22, -1.14, 0.68],
      insertions: [
        [tvC[0] + 0.30, tvC[1] + 0.02, tvC[2] + 0.04],
        [tvC[0] + 0.24, tvC[1] - 0.02, tvC[2] - 0.06],
        [tvC[0] + 0.16, tvC[1] - 0.04, tvC[2] - 0.14],
        [tvC[0] + 0.20, tvC[1] + 0.04, tvC[2] + 0.12]
      ]
    },
    // RV Posterior papillary muscle fan -> Tricuspid posterior & septal leaflets
    {
      origin: [-0.12, -1.42, 0.80],
      insertions: [
        [tvC[0] - 0.04, tvC[1] - 0.04, tvC[2] + 0.18],
        [tvC[0] + 0.04, tvC[1] - 0.05, tvC[2] + 0.06],
        [tvC[0] - 0.12, tvC[1] - 0.06, tvC[2] + 0.04],
        [tvC[0] + 0.10, tvC[1] - 0.04, tvC[2] - 0.04]
      ]
    },
    // LV Anterolateral papillary muscle fan -> Mitral anterior (A1/A2) & posterior (P1) scallops
    {
      origin: [0.85, -0.42, 0.28],
      insertions: [
        [mvC[0] + 0.28, mvC[1] + 0.05, mvC[2] + 0.28],
        [mvC[0] + 0.20, mvC[1] + 0.02, mvC[2] + 0.18],
        [mvC[0] + 0.12, mvC[1] + 0.00, mvC[2] + 0.10],
        [mvC[0] + 0.04, mvC[1] - 0.02, mvC[2] + 0.22],
        [mvC[0] + 0.24, mvC[1] - 0.03, mvC[2] + 0.04],
        [mvC[0] + 0.16, mvC[1] + 0.06, mvC[2] + 0.32]
      ]
    },
    // LV Posteromedial papillary muscle fan -> Mitral anterior (A2/A3) & posterior (P2/P3) scallops
    {
      origin: [0.82, -0.74, 0.24],
      insertions: [
        [mvC[0] + 0.22, mvC[1] - 0.04, mvC[2] - 0.02],
        [mvC[0] + 0.14, mvC[1] - 0.06, mvC[2] - 0.10],
        [mvC[0] + 0.04, mvC[1] - 0.08, mvC[2] - 0.18],
        [mvC[0] - 0.06, mvC[1] - 0.08, mvC[2] - 0.08],
        [mvC[0] + 0.18, mvC[1] - 0.02, mvC[2] + 0.08],
        [mvC[0] + 0.08, mvC[1] - 0.05, mvC[2] + 0.00]
      ]
    }
  ];

  let cordIdx = 0;
  for (const fan of papillaryFans) {
    for (let k = 0; k < fan.insertions.length; k++) {
      const target = fan.insertions[k];
      const bow = (k - (fan.insertions.length - 1) * 0.5) * 0.035;
      const mid = [
        (fan.origin[0] + target[0]) * 0.5 + bow,
        (fan.origin[1] + target[1]) * 0.5 + 0.04,
        (fan.origin[2] + target[2]) * 0.5 + 0.03
      ];
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(...fan.origin),
        new THREE.Vector3(...mid),
        new THREE.Vector3(...target)
      ]);
      const tube = new THREE.TubeGeometry(curve, 14, 0.013, 7, false);
      const res = appendThreeGeometry(doc, buffer, rootNode, tube, {
        nodeName: `Supp_chordae_tendineae_${++cordIdx}`,
        partId: 'chordae_tendineae',
        tissueKind: 'cord',
        animRole: 'chordae',
        ontologyId: 'UBERON:0002131',
        sourceProvenance: 'supplemental-anatomical',
        label: 'Chordae tendineae'
      });
      if (cordIdx === 1) stats.push({ partId: 'chordae_tendineae', ...res });
    }
  }

  // Sculpted 3-cusp semilunar pocket leaflets for Pulmonary & Aortic valves so cut-open roots show crisp cusps
  function buildSemilunarCusps(center, radius, tiltX, tiltZ, nodePrefix, partId, ontologyId, label) {
    for (let c = 0; c < 3; c++) {
      const ang = (c / 3) * Math.PI * 2 + 0.25;
      const bowl = new THREE.SphereGeometry(
        radius * 0.58,
        16,
        12,
        0,
        Math.PI * 2,
        Math.PI * 0.35,
        Math.PI * 0.55
      );
      bowl.scale(1.15, 0.85, 0.72);
      bowl.rotateY(ang);
      bowl.translate(
        center[0] + Math.cos(ang) * radius * 0.36,
        center[1],
        center[2] + Math.sin(ang) * radius * 0.36
      );
      bowl.rotateX(tiltX);
      bowl.rotateZ(tiltZ);
      appendThreeGeometry(doc, buffer, rootNode, bowl, {
        nodeName: `${nodePrefix}_cusp_${c + 1}`,
        partId,
        tissueKind: 'valve',
        animRole: 'sl_valve',
        ontologyId,
        sourceProvenance: 'supplemental-anatomical',
        label
      });
    }
  }

  buildSemilunarCusps(
    [pvC[0] + 0.02, pvC[1] - 0.02, pvC[2] + 0.08],
    0.26,
    0.15,
    -0.18,
    'Supp_pulmonary_semilunar',
    'pulmonary_valve',
    'UBERON:0002146',
    'Pulmonary semilunar cusp'
  );
  buildSemilunarCusps(
    [avC[0] + 0.04, avC[1] + 0.02, avC[2] + 0.04],
    0.25,
    -0.12,
    0.16,
    'Supp_aortic_semilunar',
    'aortic_valve',
    'UBERON:0002137',
    'Aortic semilunar cusp'
  );

  // 4. EPICARDIAL ADIPOSE FAT PADS (conforming to the HuBMAP coronary and interventricular sulci)
  const fatStrips = [
    {
      partId: 'right_ventricle',
      name: 'Supp_epicardial_fat_anterior_av_groove',
      radius: 0.058,
      pts: [
        [-0.78, -0.18, 0.88],
        [-0.52, -0.58, 1.05],
        [-0.22, -0.96, 1.12]
      ]
    },
    {
      partId: 'left_ventricle',
      name: 'Supp_epicardial_fat_anterior_interventricular_sulcus',
      radius: 0.052,
      pts: [
        [0.42, 0.32, 0.82],
        [0.68, -0.35, 1.18],
        [0.98, -1.08, 1.36]
      ]
    },
    {
      partId: 'left_ventricle',
      name: 'Supp_epicardial_fat_posterior_av_groove',
      radius: 0.055,
      pts: [
        [0.62, -0.16, -0.45],
        [0.24, -0.32, -0.68],
        [-0.25, -0.42, -0.52]
      ]
    }
  ];

  for (const strip of fatStrips) {
    const curve = new THREE.CatmullRomCurve3(strip.pts.map((p) => new THREE.Vector3(...p)));
    const geo = new THREE.TubeGeometry(curve, 20, strip.radius, 10, false);
    geo.scale(1.0, 0.62, 1.0);
    appendThreeGeometry(doc, buffer, rootNode, geo, {
      nodeName: strip.name,
      partId: strip.partId,
      tissueKind: 'fat',
      animRole: 'ventricle',
      ontologyId: 'UBERON:0001013',
      sourceProvenance: 'supplemental-anatomical',
      label: 'Epicardial adipose tissue'
    });
  }

  // 5. INTERNAL TRABECULAE CARNEAE & PECTINATE MUSCLES (rich internal chamber muscular relief)
  const trabeculaeSpecs = [
    {
      partId: 'right_ventricle',
      name: 'Supp_rv_trabeculae_moderator_band',
      radius: 0.036,
      pts: [
        [0.24, -0.76, 0.70],
        [0.08, -0.94, 1.04],
        [-0.08, -0.86, 1.28]
      ]
    },
    {
      partId: 'right_ventricle',
      name: 'Supp_rv_trabeculae_apical_ridge',
      radius: 0.03,
      pts: [
        [-0.12, -1.32, 0.88],
        [0.08, -1.06, 1.16],
        [0.24, -0.68, 1.10]
      ]
    },
    {
      partId: 'right_ventricle',
      name: 'Supp_rv_trabeculae_septal_1',
      radius: 0.026,
      pts: [
        [0.18, -1.24, 0.62],
        [0.02, -0.92, 0.84],
        [-0.18, -0.54, 0.72]
      ]
    },
    {
      partId: 'right_ventricle',
      name: 'Supp_rv_trabeculae_inflow_2',
      radius: 0.025,
      pts: [
        [-0.42, -1.18, 0.68],
        [-0.26, -0.82, 0.92],
        [-0.06, -0.44, 0.88]
      ]
    },
    {
      partId: 'left_ventricle',
      name: 'Supp_lv_trabeculae_anterolateral',
      radius: 0.034,
      pts: [
        [0.68, -0.42, 0.42],
        [0.96, -0.88, 0.68],
        [1.18, -1.28, 0.92]
      ]
    },
    {
      partId: 'left_ventricle',
      name: 'Supp_lv_trabeculae_posteromedial',
      radius: 0.032,
      pts: [
        [0.54, -0.58, 0.14],
        [0.82, -1.02, 0.36],
        [1.08, -1.34, 0.68]
      ]
    },
    {
      partId: 'left_ventricle',
      name: 'Supp_lv_trabeculae_apical_web_1',
      radius: 0.028,
      pts: [
        [0.44, -0.88, 0.36],
        [0.78, -1.22, 0.62],
        [1.16, -1.42, 0.84]
      ]
    },
    {
      partId: 'left_ventricle',
      name: 'Supp_lv_trabeculae_apical_web_2',
      radius: 0.026,
      pts: [
        [0.92, -0.56, 0.04],
        [1.14, -0.96, 0.32],
        [1.26, -1.32, 0.64]
      ]
    },
    {
      partId: 'right_atrium',
      name: 'Supp_ra_pectinate_ridge_1',
      radius: 0.022,
      pts: [
        [-1.38, 0.24, 0.22],
        [-1.18, 0.08, 0.46],
        [-0.92, -0.14, 0.42]
      ]
    },
    {
      partId: 'right_atrium',
      name: 'Supp_ra_pectinate_ridge_2',
      radius: 0.022,
      pts: [
        [-1.42, -0.06, 0.14],
        [-1.22, -0.22, 0.38],
        [-0.94, -0.38, 0.34]
      ]
    }
  ];

  for (const tr of trabeculaeSpecs) {
    const curve = new THREE.CatmullRomCurve3(tr.pts.map((p) => new THREE.Vector3(...p)));
    const geo = new THREE.TubeGeometry(curve, 16, tr.radius, 8, false);
    appendThreeGeometry(doc, buffer, rootNode, geo, {
      nodeName: tr.name,
      partId: tr.partId,
      tissueKind: 'trabecula',
      animRole: 'ventricle',
      ontologyId: 'UBERON:0002494',
      sourceProvenance: 'supplemental-anatomical',
      label: 'Trabeculae carneae'
    });
  }

  return stats;
}

async function main() {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  await ensureSourceFile(HEART_RAW_PATH, HEART_RAW_URL);
  await ensureSourceFile(VASC_RAW_PATH, VASC_RAW_URL);
  await MeshoptEncoder.ready;
  await MeshoptDecoder.ready;
  await MeshoptSimplifier.ready;

  const io = new NodeIO()
    .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
    .registerDependencies({
      'meshopt.encoder': MeshoptEncoder,
      'meshopt.decoder': MeshoptDecoder
    });
  const heartRawDoc = await io.read(HEART_RAW_PATH);
  const vascRawDoc = await io.read(VASC_RAW_PATH);

  const outDoc = new Document();
  const outBuffer = outDoc.createBuffer('HeartARBuffer');
  const scene = outDoc.createScene('HeartARScene');
  const rootNode = outDoc.createNode('HeartAnatomicalRoot');
  scene.addChild(rootNode);

  const partCentroids = new Map();
  const partBounds = new Map();
  let lvRawMeshData = null;

  function recordPartBounds(partId, posArray) {
    if (!partBounds.has(partId)) {
      partBounds.set(partId, {
        min: [Infinity, Infinity, Infinity],
        max: [-Infinity, -Infinity, -Infinity]
      });
    }
    const b = partBounds.get(partId);
    for (let i = 0; i < posArray.length; i += 3) {
      const x = posArray[i],
        y = posArray[i + 1],
        z = posArray[i + 2];
      if (x < b.min[0]) b.min[0] = x;
      if (y < b.min[1]) b.min[1] = y;
      if (z < b.min[2]) b.min[2] = z;
      if (x > b.max[0]) b.max[0] = x;
      if (y > b.max[1]) b.max[1] = y;
      if (z > b.max[2]) b.max[2] = z;
    }
    partCentroids.set(partId, [
      +((b.min[0] + b.max[0]) * 0.5).toFixed(4),
      +((b.min[1] + b.max[1]) * 0.5).toFixed(4),
      +((b.min[2] + b.max[2]) * 0.5).toFixed(4)
    ]);
  }

  function importMappedNodes(srcDoc) {
    for (const srcNode of srcDoc.getRoot().listNodes()) {
      const nodeName = srcNode.getName();
      const mapEntry = HUBMAP_NODE_MAP[nodeName];
      const srcMesh = srcNode.getMesh();
      if (!mapEntry || !srcMesh) continue;

      const srcPrim = srcMesh.listPrimitives()[0];
      if (!srcPrim) continue;

      const rawPos = srcPrim.getAttribute('POSITION').getArray();
      const rawNrm = srcPrim.getAttribute('NORMAL').getArray();
      const rawIdx = srcPrim.getIndices().getArray();

      const posArr = new Float32Array(rawPos.length);
      const nrmArr = new Float32Array(rawNrm.length);

      for (let i = 0; i < rawPos.length; i += 3) {
        const [sx, sy, sz] = toScenePos(rawPos[i], rawPos[i + 1], rawPos[i + 2]);
        posArr[i] = sx;
        posArr[i + 1] = sy;
        posArr[i + 2] = sz;
        nrmArr[i] = rawNrm[i];
        nrmArr[i + 1] = rawNrm[i + 1];
        nrmArr[i + 2] = rawNrm[i + 2];
      }

      const isChamber =
        mapEntry.partId === 'right_atrium' ||
        mapEntry.partId === 'right_ventricle' ||
        mapEntry.partId === 'left_atrium' ||
        mapEntry.partId === 'left_ventricle';

      const { uvs, endo } = computeUVsAndEndo(posArr, nrmArr, isChamber);

      const posAcc = outDoc.createAccessor().setType('VEC3').setArray(posArr).setBuffer(outBuffer);
      const nrmAcc = outDoc.createAccessor().setType('VEC3').setArray(nrmArr).setBuffer(outBuffer);
      const uvAcc = outDoc.createAccessor().setType('VEC2').setArray(uvs).setBuffer(outBuffer);
      const endoAcc = outDoc
        .createAccessor()
        .setType('SCALAR')
        .setArray(endo)
        .setBuffer(outBuffer);
      const idxAcc = outDoc
        .createAccessor()
        .setType('SCALAR')
        .setArray(new Uint32Array(rawIdx))
        .setBuffer(outBuffer);

      const extras = {
        partId: mapEntry.partId,
        tissueKind: mapEntry.tissueKind,
        animRole: mapEntry.animRole,
        ontologyId: mapEntry.ontologyId,
        sourceProvenance: 'hubmap-vhm-ccf',
        label: mapEntry.label
      };

      const prim = outDoc
        .createPrimitive()
        .setAttribute('POSITION', posAcc)
        .setAttribute('NORMAL', nrmAcc)
        .setAttribute('TEXCOORD_0', uvAcc)
        .setAttribute('_ENDOCARDIUM', endoAcc)
        .setIndices(idxAcc);

      const mesh = outDoc.createMesh(nodeName).addPrimitive(prim).setExtras(extras);
      const node = outDoc.createNode(nodeName).setMesh(mesh).setExtras(extras);
      rootNode.addChild(node);

      recordPartBounds(mapEntry.partId, posArr);

      if (nodeName === 'VH_M_heart_left_ventricle') {
        lvRawMeshData = { pos: posArr, nrm: nrmArr, idx: rawIdx };
      }
    }
  }

  importMappedNodes(heartRawDoc);
  importMappedNodes(vascRawDoc);

  buildSupplementalStructures(outDoc, outBuffer, rootNode, lvRawMeshData, partCentroids);

  // Recompute full bounds across all 26 parts including supplemental nodes
  for (const node of outDoc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    const extras = node.getExtras();
    if (!mesh || !extras?.partId) continue;
    const posArr = mesh.listPrimitives()[0].getAttribute('POSITION').getArray();
    recordPartBounds(extras.partId, posArr);
  }

  const globalBounds = {
    min: [Infinity, Infinity, Infinity],
    max: [-Infinity, -Infinity, -Infinity]
  };
  for (const b of partBounds.values()) {
    for (let k = 0; k < 3; k++) {
      if (b.min[k] < globalBounds.min[k]) globalBounds.min[k] = +b.min[k].toFixed(4);
      if (b.max[k] > globalBounds.max[k]) globalBounds.max[k] = +b.max[k].toFixed(4);
    }
  }

  await outDoc.transform(dedup(), prune(), weld());

  function applyMeshoptCompression(doc) {
    doc
      .createExtension(EXTMeshoptCompression)
      .setRequired(true)
      .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.FILTER });
  }

  // 1. Write High Tier (full geometric fidelity + Meshopt compression)
  const highDoc = cloneDocument(outDoc);
  await highDoc.transform(reorder({ encoder: MeshoptEncoder, target: 'size' }));
  applyMeshoptCompression(highDoc);
  await io.write(path.join(MODELS_DIR, 'heart-high.glb'), highDoc);

  // 2. Write Medium Tier (~55% triangles + Meshopt compression)
  const medDoc = cloneDocument(outDoc);
  await medDoc.transform(
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.55, error: 0.003 }),
    reorder({ encoder: MeshoptEncoder, target: 'size' })
  );
  applyMeshoptCompression(medDoc);
  await io.write(path.join(MODELS_DIR, 'heart-medium.glb'), medDoc);

  // 3. Write Low Tier (~28% triangles + Meshopt compression for mobile devices)
  const lowDoc = cloneDocument(outDoc);
  await lowDoc.transform(
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.28, error: 0.008 }),
    reorder({ encoder: MeshoptEncoder, target: 'size' })
  );
  applyMeshoptCompression(lowDoc);
  await io.write(path.join(MODELS_DIR, 'heart-low.glb'), lowDoc);

  // 4. Write anatomical manifest with all 26 part centroids, bounds, and flow pathway anchors
  const c = (id) => partCentroids.get(id) || [0, 0, 0];
  const manifest = {
    source: 'HuBMAP CCF 3D Reference Object Library (Visible Human Male v1.2, CC BY 4.0)',
    licenseFile: '/docs/MODEL_LICENSE.md',
    scale: SCENE_SCALE,
    rawCenter: RAW_CENTER,
    bounds: globalBounds,
    partCount: partBounds.size,
    parts: Object.fromEntries(
      Array.from(partBounds.entries()).map(([id, b]) => [
        id,
        {
          center: partCentroids.get(id),
          min: b.min.map((x) => +x.toFixed(4)),
          max: b.max.map((x) => +x.toFixed(4))
        }
      ])
    ),
    slicePresets: [
      {
        id: 'inside-heart',
        label: 'Inside of heart',
        axis: 'z',
        percent: 46,
        description: 'Anatomical coronal cutaway exposing all 4 chambers, valves, chordae, and great vessel roots.'
      },
      {
        id: 'four-chamber',
        label: '4-Chamber Coronal',
        axis: 'z',
        percent: 52,
        description: 'Classic echocardiographic 4-chamber cut exposing RA, RV, LA, LV, septa, and AV valves.'
      },
      {
        id: 'outflow-tract',
        label: 'LV/RV Outflow (LVOT)',
        axis: 'z',
        percent: 38,
        description: 'Anterior coronal plane through the right ventricular infundibulum, pulmonary valve, and aortic root.'
      },
      {
        id: 'sagittal-valves',
        label: 'Bicaval / Sagittal',
        axis: 'x',
        percent: 48,
        description: 'Sagittal cut across the interventricular septum, mitral/tricuspid rings, and great vessel roots.'
      },
      {
        id: 'short-axis',
        label: 'Ventricular Short-Axis',
        axis: 'y',
        percent: 62,
        description: 'Transverse mid-ventricular cut comparing thick concentric LV myocardium against the crescentic RV wall.'
      }
    ],
    flowPathways: {
      SVC_to_LPA: [
        [-1.26, 2.35, -0.34],
        c('superior_vena_cava'),
        c('right_atrium'),
        c('tricuspid_valve'),
        [0.02, -0.82, 0.92],
        c('right_ventricle'),
        c('pulmonary_valve'),
        c('pulmonary_trunk'),
        c('left_pulmonary_artery'),
        [1.18, 1.26, -0.62]
      ],
      IVC_to_RPA: [
        [-1.12, -2.35, -0.82],
        c('inferior_vena_cava'),
        c('right_atrium'),
        c('tricuspid_valve'),
        [-0.08, -0.95, 0.86],
        c('right_ventricle'),
        c('pulmonary_valve'),
        c('pulmonary_trunk'),
        c('right_pulmonary_artery'),
        [-1.18, 1.28, -0.52]
      ],
      LPV_to_AortaArch: [
        [1.08, 0.92, -0.88],
        c('left_pulmonary_veins'),
        c('left_atrium'),
        c('mitral_valve'),
        [0.88, -0.92, 0.34],
        c('left_ventricle'),
        c('aortic_valve'),
        [-0.42, 1.12, -0.10],
        [-0.36, 2.04, -0.78],
        [0.14, 2.75, -0.62]
      ],
      RPV_to_DescendingAorta: [
        [-1.38, 0.32, -1.18],
        c('right_pulmonary_veins'),
        c('left_atrium'),
        c('mitral_valve'),
        [0.78, -0.86, 0.24],
        c('left_ventricle'),
        c('aortic_valve'),
        [-0.36, 2.04, -0.78],
        [-0.10, 0.85, -1.68],
        [-0.12, -0.65, -1.78],
        [-0.14, -2.25, -1.72]
      ],
      Coronary_RCA: [
        [-0.25, 0.52, 0.12],
        [-0.75, 0.08, 0.68],
        [-0.98, -0.58, 0.88],
        [-0.52, -1.18, 0.95],
        [0.32, -1.38, 0.65]
      ],
      Coronary_LAD: [
        [0.05, 0.68, -0.18],
        [0.48, 0.25, 0.62],
        [0.78, -0.35, 0.98],
        [1.02, -0.98, 1.24],
        [1.24, -1.48, 1.38]
      ],
      Coronary_LCx: [
        [0.05, 0.68, -0.18],
        [0.52, 0.28, -0.45],
        [0.98, 0.05, -0.42],
        [1.18, -0.32, -0.18],
        [1.05, -0.72, 0.12]
      ]
    }
  };

  fs.writeFileSync(
    path.join(MODELS_DIR, 'heart-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  for (const f of ['heart-high.glb', 'heart-medium.glb', 'heart-low.glb', 'heart-manifest.json']) {
    const st = fs.statSync(path.join(MODELS_DIR, f));
    console.log(`Generated ${f}: ${(st.size / 1024).toFixed(1)} KB`);
  }
  console.log(`Mapped ${partBounds.size} / 26 anatomical catalog structures.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
