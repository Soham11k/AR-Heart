import * as THREE from 'three';
import { fbm3 } from './textures.js';

/**
 * Complete catalog of the 9 histological & structural layers of the heart
 * matching the "HEART LAYERS (Exploded 3D Layer View)" anatomical reference.
 */
export const HEART_LAYERS_CATALOG = [
  {
    id: 'layer_fibrous_pericardium',
    number: 1,
    name: 'Fibrous Pericardium',
    subtitle: 'Tough outer sac that protects the heart',
    latin: 'Pericardium fibrosum',
    category: 'Pericardial Wall',
    subGroup: 'Pericardium (Layers 1–4)',
    oxygenation: 'Dense Connective Sac',
    color: 0xe2ddd2,
    ontologyId: 'UBERON:0002358',
    sourceProvenance: 'Histological Atlas Layer 1',
    pathway: 'Sternopericardial Ligaments & Central Tendon of Diaphragm → Great Vessel Roots',
    role: 'Inelastic collagenous outer sac preventing acute chamber overdistension',
    description:
      'Outermost tough, unyielding sac composed of dense irregular collagenous and elastic fibers. Fuses inferiorly with the central tendon of the diaphragm and superiorly with the tunica adventitia of the aorta, pulmonary trunk, and venae cavae.',
    clinicalNotes:
      'Because the fibrous pericardium is non-compliant, rapid accumulation of fluid or blood (hemopericardium > 150–200 mL) compresses the cardiac chambers and causes life-threatening cardiac tamponade.',
    cycleRelation:
      'Provides mechanical tethering in the middle mediastinum and limits acute diastolic over-expansion of the right ventricle.'
  },
  {
    id: 'layer_parietal_pericardium',
    number: 2,
    name: 'Parietal Pericardium',
    subtitle: 'Inner lining of the pericardial sac',
    latin: 'Lamina parietalis pericardii serosi',
    category: 'Pericardial Wall',
    subGroup: 'Pericardium (Layers 1–4)',
    oxygenation: 'Serous Parietal Membrane',
    color: 0xb2a3d4,
    ontologyId: 'UBERON:0002408',
    sourceProvenance: 'Histological Atlas Layer 2',
    pathway: 'Lines inner surface of Fibrous Pericardium → Reflects at Great Vessels into Epicardium',
    role: 'Secrete and resorb serous pericardial fluid across a smooth mesothelial surface',
    description:
      'Outer lamina of the serous pericardium fused tightly to the internal surface of the fibrous pericardium. Lined by a single layer of simple squamous mesothelium facing the pericardial cavity.',
    clinicalNotes:
      'Richly innervated by somatic pain fibers of the phrenic nerve (C3–C5), causing pericarditis pain to radiate classically to the left shoulder and trapezius ridge.',
    cycleRelation:
      'Glides effortlessly against the visceral pericardium across the microscopic fluid film during every systolic contraction and torsion.'
  },
  {
    id: 'layer_pericardial_cavity',
    number: 3,
    name: 'Pericardial Cavity',
    subtitle: 'Space with lubricating fluid to reduce friction',
    latin: 'Cavitas pericardiaca',
    category: 'Pericardial Wall',
    subGroup: 'Pericardium (Layers 1–4)',
    oxygenation: 'Serous Fluid Space (15–50 mL)',
    color: 0x8ec4e8,
    ontologyId: 'UBERON:0002409',
    sourceProvenance: 'Histological Atlas Layer 3',
    pathway: 'Potential space between Parietal & Visceral Serous Pericardium (Transverse & Oblique Sinuses)',
    role: 'Contains 15–50 mL of plasma ultrafiltrate for frictionless cardiac motion',
    description:
      'Slit-like potential space between the parietal and visceral layers of the serous pericardium containing a thin film (15–50 mL) of phospholipid-rich serous fluid. Forms the transverse sinus behind the aorta/pulmonary trunk and the oblique sinus behind the left atrium.',
    clinicalNotes:
      'Inflammation (fibrinous or serosanguinous pericarditis) produces an audible triphasic pericardial friction rub; large effusions are drained via subxiphoid pericardiocentesis.',
    cycleRelation:
      'Couples intrathoracic respiratory pressure changes directly to cardiac preload while eliminating mechanical shear during apical twist.'
  },
  {
    id: 'layer_visceral_pericardium',
    number: 4,
    name: 'Visceral Pericardium (Epicardium)',
    subtitle: 'Protects and covers the heart surface',
    latin: 'Lamina visceralis pericardii serosi (Epicardium)',
    category: 'Heart Wall',
    subGroup: 'Heart Wall (Layers 4–6)',
    oxygenation: 'Serous & Subepicardial Layer',
    color: 0xd98ca4,
    ontologyId: 'UBERON:0002348',
    sourceProvenance: 'Histological Atlas Layer 4',
    pathway: 'External surface of Myocardium & Subepicardial Coronary Sulci',
    role: 'Protects outer heart wall and embeds coronary arteries, veins, nerves, and adipose pads',
    description:
      'Internal layer of the serous pericardium adherent directly to the heart wall (also termed the epicardium). Comprises mesothelium overlying a fibroelastic subepicardial layer containing coronary vessels, autonomic plexuses, and adipose tissue.',
    clinicalNotes:
      'Transmural myocardial ischemia or infarction extends from the subendocardium all the way to the epicardium, producing characteristic ST-segment elevation and post-MI Dressler pericarditis.',
    cycleRelation:
      'Deforms elastically with the underlying myocardium while cushioning the major epicardial coronary trunks in subepicardial fat.'
  },
  {
    id: 'layer_myocardium',
    number: 5,
    name: 'Myocardium',
    subtitle: 'Thick muscular layer that pumps blood',
    latin: 'Myocardium',
    category: 'Heart Wall',
    subGroup: 'Heart Wall (Layers 4–6)',
    oxygenation: 'Striated Cardiac Muscle',
    color: 0xc83e3b,
    ontologyId: 'UBERON:0002349',
    sourceProvenance: 'Histological Atlas Layer 5',
    pathway: 'Helical Subepicardial, Circumferential Mid-wall, and Longitudinal Subendocardial Bundles',
    role: 'Contractile muscular syncytium generating systolic pressure and apical torsion',
    description:
      'Thick middle contractile layer composed of branched, involuntary striated cardiomyocytes joined end-to-end by intercalated discs (fasciae adherentes, desmosomes, and connexin-43 gap junctions). Organized into a double-helical myocardial band anchored to the fibrous skeleton.',
    clinicalNotes:
      'Highest oxygen extraction in the body (~70–75% at rest); acute coronary occlusion causes irreversible coagulative myocyte necrosis within 20–40 minutes starting in the subendocardium.',
    cycleRelation:
      'Contracts via calcium-induced calcium release (CICR) during systole, wringing blood upward from the apex before actively relaxing via SERCA2a in diastole.'
  },
  {
    id: 'layer_endocardium',
    number: 6,
    name: 'Endocardium',
    subtitle: 'Smooth inner lining of the chambers',
    latin: 'Endocardium',
    category: 'Heart Wall',
    subGroup: 'Heart Wall (Layers 4–6)',
    oxygenation: 'Endothelial Chamber Lining',
    color: 0xd97d8e,
    ontologyId: 'UBERON:0002165',
    sourceProvenance: 'Histological Atlas Layer 6',
    pathway: 'Lines Atria, Ventricles, Trabeculae Carneae, and Cardiac Valve Leaflets',
    role: 'Non-thrombogenic inner lining housing the subendocardial Purkinje conduction network',
    description:
      'Smooth innermost layer lining the four heart chambers and covering the valves, chordae tendineae, and papillary muscles. Consists of simple squamous endothelium, a fibroelastic connective layer, and a subendocardial layer containing the Purkinje fibers.',
    clinicalNotes:
      'Endocardial endothelial damage or turbulent jet flow predisposes to infective endocarditis vegetations and mural thrombi.',
    cycleRelation:
      'Provides a low-shear antithrombotic surface for high-velocity blood flow and conducts rapid subendocardial depolarization across the ventricles.'
  },
  {
    id: 'layer_heart_valves',
    number: 7,
    name: 'Heart Valves',
    subtitle: 'Ensure one-way flow of blood',
    latin: 'Valvae cordis et chordae tendineae',
    category: 'Internal Apparatus',
    subGroup: 'Valves, Chambers & Vessels (Layers 7–9)',
    oxygenation: 'Fibrous Valvular Apparatus',
    color: 0xf4ebd8,
    ontologyId: 'UBERON:0000946',
    sourceProvenance: 'Histological Atlas Layer 7',
    pathway: 'Tricuspid & Mitral (AV) + Pulmonary & Aortic (Semilunar) + Chordae Tendineae',
    role: 'Passive pressure-driven check valves enforcing unidirectional chamber-to-vessel flow',
    description:
      'Four fibrous valve assemblies anchored to the dense collagenous cardiac skeleton, comprising the atrioventricular valves (tricuspid and mitral) tethered by collagenous chordae tendineae and the semilunar valves (pulmonary and aortic) with three pocket-like cusps.',
    clinicalNotes:
      'Valvular stenosis imposes pressure afterload hypertrophy, whereas valvular insufficiency (regurgitation) imposes volume preload dilation.',
    cycleRelation:
      'AV valves open in diastole and close at S1; semilunar valves open in systolic ejection and close at S2.'
  },
  {
    id: 'layer_heart_chambers',
    number: 8,
    name: 'Heart Chambers',
    subtitle: 'Right & Left atria and ventricles',
    latin: 'Camerae cordis (Atria et Ventriculi)',
    category: 'Internal Apparatus',
    subGroup: 'Valves, Chambers & Vessels (Layers 7–9)',
    oxygenation: 'Right Venous & Left Arterial Pumps',
    color: 0xc95252,
    ontologyId: 'UBERON:0004151',
    sourceProvenance: 'Histological Atlas Layer 8',
    pathway: 'Right Atrium & Right Ventricle (Pulmonary) + Left Atrium & Left Ventricle (Systemic)',
    role: 'Four muscular chambers partitioned by interatrial and interventricular septa',
    description:
      'Two superior thin-walled receiving chambers (right and left atria) and two inferior thick-walled pumping chambers (right and left ventricles) completely separated into a low-pressure right pulmonary pump and a high-pressure left systemic pump.',
    clinicalNotes:
      'Chamber-specific remodeling (LA dilation in mitral disease, RV strain in pulmonary hypertension, LV hypertrophy in systemic hypertension) is diagnosed by echocardiography and ECG.',
    cycleRelation:
      'Atria contract first in late diastole to top off ventricular volume, followed 120–200 ms later by synchronous biventricular systolic ejection.'
  },
  {
    id: 'layer_coronary_vessels',
    number: 9,
    name: 'Coronary Blood Vessels',
    subtitle: 'Supply oxygen and nutrients to heart muscle',
    latin: 'Vasa sanguinea coronaria',
    category: 'Internal Apparatus',
    subGroup: 'Valves, Chambers & Vessels (Layers 7–9)',
    oxygenation: 'Coronary Arterial & Venous Tree',
    color: 0xd93838,
    ontologyId: 'UBERON:0001621',
    sourceProvenance: 'Histological Atlas Layer 9',
    pathway: 'Right & Left Coronary Arteries (RCA, LAD, LCx) → Myocardial Capillaries → Cardiac Veins',
    role: 'Delivers ~250 mL/min of oxygenated blood to the continuously contracting myocardium',
    description:
      'Epicardial and intramyocardial vascular network arising from the right and left aortic sinuses of Valsalva. The RCA, LAD, and LCx travel in the epicardial sulci before sending penetrating branches into the myocardium, drained by the great, middle, and anterior cardiac veins.',
    clinicalNotes:
      'Atherosclerotic plaque rupture and thrombosis in the epicardial coronary arteries is the root cause of acute coronary syndromes and myocardial infarction.',
    cycleRelation:
      'Left ventricular coronary arterial perfusion peaks during ventricular diastole when intramural muscle compression relaxes.'
  }
];

export const HEART_LAYERS_BY_ID = Object.fromEntries(HEART_LAYERS_CATALOG.map((l) => [l.id, l]));

/**
 * Helper to create a curved, thick 3D histological tissue sheet with a convex upper dome,
 * concave underside, and organic margin matching the "HEART LAYERS" exploded illustration.
 */
function createCurvedLayerSlab({
  width = 2.4,
  depth = 1.65,
  thickness = 0.14,
  archX = 0.36,
  archZ = 0.22,
  segX = 44,
  segZ = 32,
  rippleAmp = 0.02,
  rippleFreq = 3.5,
  fourDomed = false,
  seed = 0
} = {}) {
  const geo = new THREE.BoxGeometry(width, thickness, depth, segX, 4, segZ);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const nx = v.x / (width * 0.5); // [-1..1]
    const ny = v.y / (thickness * 0.5); // [-1..1]
    const nz = v.z / (depth * 0.5); // [-1..1]

    // Elliptical heart-crest planform rounding so corners curve organically like the reference drawing
    const r2 = nx * nx * 0.45 + nz * nz * 0.45;
    const cornerTaper = Math.max(0.72, 1.0 - 0.18 * r2);
    v.x *= cornerTaper;
    v.z *= cornerTaper * (1.0 - 0.08 * nx);

    // Saddle/dome curvature matching the peeled heart wall layers
    let dome = archX * (1.0 - nx * nx * 0.88) + archZ * (1.0 - nz * nz * 0.75);
    // Slight central sulcus dip along the interventricular axis
    dome -= 0.07 * Math.exp(-Math.pow((nx + 0.05) * 2.8, 2));

    if (fourDomed) {
      // 4 chamber vault impressions for the Endocardium layer (Layer 6)
      const c1 = Math.exp(-(Math.pow((nx + 0.52) * 2.6, 2) + Math.pow((nz - 0.28) * 2.6, 2)));
      const c2 = Math.exp(-(Math.pow((nx - 0.08) * 2.6, 2) + Math.pow((nz - 0.32) * 2.6, 2)));
      const c3 = Math.exp(-(Math.pow((nx - 0.54) * 2.6, 2) + Math.pow((nz + 0.18) * 2.6, 2)));
      const c4 = Math.exp(-(Math.pow((nx + 0.14) * 2.6, 2) + Math.pow((nz + 0.32) * 2.6, 2)));
      dome += 0.11 * (c1 + c2 + c3 + c4);
    }

    const noise = (fbm3(nx * rippleFreq + seed, nz * rippleFreq, ny * 2.0 + seed, 3) - 0.5) * rippleAmp;
    // Soften outer rim thickness slightly
    const edgeFactor = Math.max(0.45, 1.0 - 0.35 * Math.pow(Math.max(Math.abs(nx), Math.abs(nz)), 3));
    v.y = v.y * edgeFactor + dome + noise;

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

function makeVesselTube(pts, radius, tubularSegments = 28, radialSegments = 10) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  return new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
}

/**
 * Builds the complete 9-layer Exploded 3D Heart Assembly matching Reference Image 2:
 * - Layers 1–6: Stacked curved histological wall layers above the heart
 * - Layer 7: Sculpted 4-valve fibrous crown & chordae tendineae arches
 * - Layer 8: Sculpted 4-chamber open heart body showing RA, RV, LA, LV cavities & septa
 * - Layer 9: Branching red arterial & blue venous coronary tree on the heart surface
 */
export function createHeartLayersAssembly(textures) {
  const root = new THREE.Group();
  root.name = 'HeartLayersAssembly';
  root.visible = false;

  const layerRecords = new Map();
  const pickableMeshes = [];

  function registerLayer(meta, meshesOrGroups, explodedY, compactY, anchorLocal = [0, 0, 0]) {
    const group = new THREE.Group();
    group.name = meta.id;
    group.position.set(0, explodedY, 0);

    const meshes = [];
    const materials = new Set();

    for (const item of meshesOrGroups) {
      group.add(item);
      item.traverse((ch) => {
        if (ch.isMesh) {
          ch.castShadow = true;
          ch.receiveShadow = true;
          ch.userData.partId = meta.id;
          ch.userData.partMeta = meta;
          ch.userData.isLayerNode = true;
          meshes.push(ch);
          pickableMeshes.push(ch);
          if (ch.material) materials.add(ch.material);
        }
      });
    }

    const rec = {
      id: meta.id,
      meta,
      group,
      meshes,
      materials: Array.from(materials),
      baseColor: new THREE.Color(meta.color),
      explodedY,
      compactY,
      anchorLocal: new THREE.Vector3(...anchorLocal)
    };

    layerRecords.set(meta.id, rec);
    root.add(group);
    return rec;
  }

  // Shared red & blue coronary vessel materials
  const artMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xc92a2a),
    roughness: 0.32,
    clearcoat: 0.65,
    clearcoatRoughness: 0.16
  });
  const veinMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x28569a),
    roughness: 0.34,
    clearcoat: 0.65,
    clearcoatRoughness: 0.16
  });

  // ============================================================================
  // ① FIBROUS PERICARDIUM (Tough outer sac)
  // ============================================================================
  {
    const geo = createCurvedLayerSlab({
      width: 2.35,
      depth: 1.58,
      thickness: 0.12,
      archX: 0.38,
      archZ: 0.22,
      rippleAmp: 0.018,
      seed: 1.1
    });
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xe3ded3),
      normalMap: textures?.vesselNormal || null,
      normalScale: new THREE.Vector2(0.45, 0.45),
      roughness: 0.58,
      metalness: 0.01,
      clearcoat: 0.18,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = -0.06;
    registerLayer(
      HEART_LAYERS_BY_ID.layer_fibrous_pericardium,
      [mesh],
      2.62,
      0.56,
      [-0.85, 0.22, 0.25]
    );
  }

  // ============================================================================
  // ② PARIETAL PERICARDIUM (Inner lining of the pericardial sac)
  // ============================================================================
  {
    const geo = createCurvedLayerSlab({
      width: 2.32,
      depth: 1.56,
      thickness: 0.11,
      archX: 0.36,
      archZ: 0.21,
      rippleAmp: 0.015,
      seed: 2.4
    });
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xb5a6d6),
      normalMap: textures?.vesselNormal || null,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: 0.38,
      clearcoat: 0.52,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = -0.05;
    registerLayer(
      HEART_LAYERS_BY_ID.layer_parietal_pericardium,
      [mesh],
      2.12,
      0.44,
      [-0.85, 0.20, 0.25]
    );
  }

  // ============================================================================
  // ③ PERICARDIAL CAVITY (Space with lubricating fluid to reduce friction)
  // ============================================================================
  {
    const geo = createCurvedLayerSlab({
      width: 2.28,
      depth: 1.52,
      thickness: 0.10,
      archX: 0.34,
      archZ: 0.20,
      rippleAmp: 0.022,
      seed: 3.7
    });
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x8fc5ea),
      normalMap: textures?.endocardiumNormal || null,
      normalScale: new THREE.Vector2(0.25, 0.25),
      roughness: 0.16,
      clearcoat: 0.92,
      clearcoatRoughness: 0.08,
      transmission: 0.18,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = -0.04;
    registerLayer(
      HEART_LAYERS_BY_ID.layer_pericardial_cavity,
      [mesh],
      1.64,
      0.32,
      [-0.84, 0.18, 0.25]
    );
  }

  // ============================================================================
  // ④ VISCERAL PERICARDIUM (EPICARDIUM) (Protects & covers heart surface + vessels)
  // ============================================================================
  {
    const grp = new THREE.Group();
    const geo = createCurvedLayerSlab({
      width: 2.30,
      depth: 1.54,
      thickness: 0.11,
      archX: 0.35,
      archZ: 0.20,
      rippleAmp: 0.018,
      seed: 4.9
    });
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xd98da6),
      normalMap: textures?.myocardiumNormal || null,
      normalScale: new THREE.Vector2(0.32, 0.32),
      roughness: 0.34,
      clearcoat: 0.65,
      side: THREE.DoubleSide
    });
    grp.add(new THREE.Mesh(geo, mat));

    // Surface epicardial blood vessels embedded on Layer 4 (matching Reference Image 2)
    const epArt1 = makeVesselTube(
      [
        [0.12, 0.38, -0.35],
        [0.42, 0.34, 0.08],
        [0.76, 0.24, 0.45]
      ],
      0.022
    );
    const epArt2 = makeVesselTube(
      [
        [0.42, 0.34, 0.08],
        [0.24, 0.32, 0.48]
      ],
      0.016
    );
    const epVein1 = makeVesselTube(
      [
        [0.25, 0.37, -0.30],
        [0.56, 0.31, 0.14],
        [0.88, 0.20, 0.48]
      ],
      0.020
    );
    grp.add(new THREE.Mesh(epArt1, artMat.clone()));
    grp.add(new THREE.Mesh(epArt2, artMat.clone()));
    grp.add(new THREE.Mesh(epVein1, veinMat.clone()));
    grp.rotation.z = -0.04;

    registerLayer(
      HEART_LAYERS_BY_ID.layer_visceral_pericardium,
      [grp],
      1.14,
      0.20,
      [-0.84, 0.18, 0.25]
    );
  }

  // ============================================================================
  // ⑤ MYOCARDIUM (Thick muscular layer that pumps blood)
  // ============================================================================
  {
    const grp = new THREE.Group();
    const geo = createCurvedLayerSlab({
      width: 2.34,
      depth: 1.58,
      thickness: 0.36,
      archX: 0.38,
      archZ: 0.22,
      rippleAmp: 0.032,
      rippleFreq: 5.5,
      seed: 6.2
    });
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xc93f3b),
      map: textures?.myocardiumAlbedo || null,
      normalMap: textures?.myocardiumNormal || null,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.48,
      clearcoat: 0.55,
      sheen: 0.35,
      sheenColor: new THREE.Color(0xff7a68),
      side: THREE.DoubleSide
    });
    grp.add(new THREE.Mesh(geo, mat));

    // Intramyocardial penetrating vessels across the right aspect of the Myocardium slab
    const myoArt = makeVesselTube(
      [
        [0.18, 0.48, -0.32],
        [0.48, 0.44, 0.12],
        [0.82, 0.30, 0.52]
      ],
      0.026
    );
    const myoVein = makeVesselTube(
      [
        [0.32, 0.46, -0.24],
        [0.62, 0.40, 0.18],
        [0.94, 0.25, 0.48]
      ],
      0.024
    );
    grp.add(new THREE.Mesh(myoArt, artMat.clone()));
    grp.add(new THREE.Mesh(myoVein, veinMat.clone()));
    grp.rotation.z = -0.03;

    registerLayer(
      HEART_LAYERS_BY_ID.layer_myocardium,
      [grp],
      0.52,
      0.05,
      [-0.86, 0.18, 0.30]
    );
  }

  // ============================================================================
  // ⑥ ENDOCARDIUM (Smooth inner lining of the chambers)
  // ============================================================================
  {
    const geo = createCurvedLayerSlab({
      width: 2.24,
      depth: 1.50,
      thickness: 0.11,
      archX: 0.28,
      archZ: 0.18,
      rippleAmp: 0.016,
      fourDomed: true,
      seed: 8.1
    });
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xda7e8f),
      normalMap: textures?.endocardiumNormal || null,
      normalScale: new THREE.Vector2(0.45, 0.45),
      roughness: 0.28,
      clearcoat: 0.76,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = -0.02;
    registerLayer(
      HEART_LAYERS_BY_ID.layer_endocardium,
      [mesh],
      -0.12,
      -0.12,
      [-0.82, 0.14, 0.25]
    );
  }

  // ============================================================================
  // ⑦ HEART VALVES (4 valve rings/cusps + arched white chordae tendineae crown)
  // ============================================================================
  {
    const valveGroup = new THREE.Group();
    const fibrousMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xf4ecda),
      normalMap: textures?.vesselNormal || null,
      normalScale: new THREE.Vector2(0.28, 0.28),
      roughness: 0.28,
      clearcoat: 0.68,
      side: THREE.DoubleSide
    });
    const lumenMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x9e343c),
      normalMap: textures?.endocardiumNormal || null,
      normalScale: new THREE.Vector2(0.65, 0.65),
      roughness: 0.38,
      clearcoat: 0.55,
      side: THREE.DoubleSide
    });

    const ringSpecs = [
      { x: -0.60, y: 0.16, z: -0.16, rx: 0.36, rz: 0.28 }, // Right Atrium / Tricuspid ring
      { x: -0.10, y: 0.12, z: 0.26, rx: 0.34, rz: 0.26 },  // Right Ventricle / Pulmonary ring
      { x: 0.48, y: 0.14, z: 0.22, rx: 0.34, rz: 0.26 },   // Left Ventricle / Aortic ring
      { x: 0.56, y: 0.20, z: -0.22, rx: 0.36, rz: 0.28 }   // Left Atrium / Mitral ring
    ];

    for (const r of ringSpecs) {
      // Fibrous valve ring & inner orifice cup
      const torus = new THREE.TorusGeometry(r.rx, 0.042, 14, 32);
      torus.rotateX(Math.PI / 2);
      torus.scale(1.0, 1.0, r.rz / r.rx);
      torus.translate(r.x, r.y, r.z);
      valveGroup.add(new THREE.Mesh(torus, fibrousMat));

      const bowl = new THREE.CylinderGeometry(r.rx * 0.92, r.rx * 0.76, 0.16, 28, 1, true);
      bowl.scale(1.0, 1.0, r.rz / r.rx);
      bowl.translate(r.x, r.y + 0.04, r.z);
      valveGroup.add(new THREE.Mesh(bowl, lumenMat));

      // 5 arched collagenous chordae tendineae pillars descending from each valve ring
      for (let c = 0; c < 5; c++) {
        const ang = (c / 5) * Math.PI * 2 + 0.2;
        const px = r.x + Math.cos(ang) * r.rx * 0.88;
        const pz = r.z + Math.sin(ang) * r.rz * 0.88;
        const cord = makeVesselTube(
          [
            [px, r.y, pz],
            [px * 0.96, r.y - 0.18, pz * 0.96 + 0.03],
            [px * 0.92, r.y - 0.38, pz * 0.92]
          ],
          0.022,
          14,
          8
        );
        valveGroup.add(new THREE.Mesh(cord, fibrousMat));
      }
    }

    registerLayer(
      HEART_LAYERS_BY_ID.layer_heart_valves,
      [valveGroup],
      -0.68,
      -0.38,
      [-0.78, -0.02, 0.25]
    );
  }

  // ============================================================================
  // ⑧ HEART CHAMBERS (Right & Left atria and ventricles — sculpted 4-cavity heart)
  // ============================================================================
  {
    const chamberGroup = new THREE.Group();

    const outerHeartMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xd05c58),
      map: textures?.myocardiumAlbedo || null,
      normalMap: textures?.myocardiumNormal || null,
      normalScale: new THREE.Vector2(0.65, 0.65),
      roughness: 0.48,
      clearcoat: 0.48,
      sheen: 0.32,
      sheenColor: new THREE.Color(0xff8a7a),
      side: THREE.DoubleSide
    });

    const cavityMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x7d1f28),
      normalMap: textures?.endocardiumNormal || null,
      normalScale: new THREE.Vector2(0.95, 0.95),
      roughness: 0.34,
      clearcoat: 0.62,
      side: THREE.DoubleSide
    });

    const septumRimMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xeec2be),
      roughness: 0.36,
      clearcoat: 0.45,
      side: THREE.DoubleSide
    });

    // Sculpted conical lower heart body tapering down to the apex at (0.12, -1.65, 0.08)
    const bodyGeo = new THREE.CylinderGeometry(1.12, 0.18, 1.72, 48, 28, false);
    const bPos = bodyGeo.attributes.position;
    const bv = new THREE.Vector3();
    for (let i = 0; i < bPos.count; i++) {
      bv.fromBufferAttribute(bPos, i);
      const t = (bv.y + 0.86) / 1.72; // 0 at apex, 1 at top cut rim
      const bulge = Math.sin(t * Math.PI * 0.78) * 0.28 + t * 0.18;
      const scaleR = 0.22 + 0.88 * Math.pow(t, 0.62) + bulge * 0.25;
      bv.x = bv.x * scaleR * 1.08 + (1.0 - t) * 0.14;
      bv.z = bv.z * scaleR * 0.76;
      // Carve 4 deep chamber bowls into the top cap (t > 0.92)
      if (t > 0.92) {
        const c1 = Math.exp(-(Math.pow((bv.x + 0.58) * 2.5, 2) + Math.pow((bv.z + 0.16) * 2.8, 2)));
        const c2 = Math.exp(-(Math.pow((bv.x + 0.10) * 2.5, 2) + Math.pow((bv.z - 0.24) * 2.8, 2)));
        const c3 = Math.exp(-(Math.pow((bv.x - 0.46) * 2.5, 2) + Math.pow((bv.z - 0.20) * 2.8, 2)));
        const c4 = Math.exp(-(Math.pow((bv.x - 0.54) * 2.5, 2) + Math.pow((bv.z + 0.20) * 2.8, 2)));
        const depthCarve = Math.max(c1, c2, c3, c4);
        bv.y -= depthCarve * 0.48;
      }
      const n = (fbm3(bv.x * 2.8, bv.y * 2.8, bv.z * 2.8, 3) - 0.5) * 0.035;
      bv.x += n;
      bv.z += n;
      bPos.setXYZ(i, bv.x, bv.y, bv.z);
    }
    bodyGeo.computeVertexNormals();
    chamberGroup.add(new THREE.Mesh(bodyGeo, outerHeartMat));

    // Four distinct open chamber cups with pale endocardial/septal rims at the top of Layer 8
    const chamberCups = [
      { x: -0.58, y: 0.76, z: -0.15, rx: 0.36, rz: 0.27 }, // Right Atrium
      { x: -0.10, y: 0.72, z: 0.25, rx: 0.34, rz: 0.26 },  // Right Ventricle
      { x: 0.46, y: 0.74, z: 0.21, rx: 0.34, rz: 0.26 },   // Left Ventricle
      { x: 0.54, y: 0.78, z: -0.20, rx: 0.35, rz: 0.27 }   // Left Atrium
    ];
    for (const c of chamberCups) {
      const cupGeo = new THREE.CylinderGeometry(c.rx * 0.94, c.rx * 0.55, 0.44, 28, 6, true);
      cupGeo.scale(1.0, 1.0, c.rz / c.rx);
      cupGeo.translate(c.x, c.y - 0.14, c.z);
      chamberGroup.add(new THREE.Mesh(cupGeo, cavityMat));

      const rimGeo = new THREE.TorusGeometry(c.rx * 0.96, 0.036, 12, 32);
      rimGeo.rotateX(Math.PI / 2);
      rimGeo.scale(1.0, 1.0, c.rz / c.rx);
      rimGeo.translate(c.x, c.y + 0.08, c.z);
      chamberGroup.add(new THREE.Mesh(rimGeo, septumRimMat));
    }

    registerLayer(
      HEART_LAYERS_BY_ID.layer_heart_chambers,
      [chamberGroup],
      -1.88,
      -1.22,
      [-0.86, 0.35, 0.35]
    );
  }

  // ============================================================================
  // ⑨ CORONARY BLOOD VESSELS (Branching arterial & venous trees on the heart wall)
  // ============================================================================
  {
    const vascGroup = new THREE.Group();

    const arterialBranches = [
      // Anterior interventricular (LAD) & diagonal branches
      {
        r: 0.034,
        pts: [
          [0.32, 0.52, 0.58],
          [0.18, 0.05, 0.68],
          [0.06, -0.42, 0.58],
          [0.08, -0.78, 0.38]
        ]
      },
      {
        r: 0.024,
        pts: [
          [0.18, 0.05, 0.68],
          [0.52, -0.18, 0.62],
          [0.74, -0.45, 0.42]
        ]
      },
      {
        r: 0.022,
        pts: [
          [0.08, -0.32, 0.61],
          [0.36, -0.58, 0.48]
        ]
      },
      // Right coronary & acute marginal branches on the left/anterior aspect
      {
        r: 0.032,
        pts: [
          [-0.64, 0.56, 0.46],
          [-0.78, 0.14, 0.52],
          [-0.62, -0.34, 0.48],
          [-0.34, -0.68, 0.38]
        ]
      },
      {
        r: 0.022,
        pts: [
          [-0.74, 0.18, 0.52],
          [-0.44, -0.06, 0.62],
          [-0.26, -0.38, 0.56]
        ]
      },
      {
        r: 0.020,
        pts: [
          [-0.62, -0.30, 0.48],
          [-0.82, -0.56, 0.32]
        ]
      }
    ];

    const venousBranches = [
      // Great cardiac vein & tributaries
      {
        r: 0.032,
        pts: [
          [0.44, 0.50, 0.54],
          [0.28, 0.02, 0.66],
          [0.02, -0.38, 0.59],
          [-0.18, -0.74, 0.40]
        ]
      },
      {
        r: 0.022,
        pts: [
          [0.28, 0.02, 0.66],
          [0.64, -0.24, 0.56],
          [0.82, -0.52, 0.34]
        ]
      },
      {
        r: 0.022,
        pts: [
          [0.02, -0.38, 0.59],
          [-0.36, -0.46, 0.54],
          [-0.56, -0.68, 0.36]
        ]
      },
      {
        r: 0.020,
        pts: [
          [0.06, -0.56, 0.48],
          [0.28, -0.76, 0.34]
        ]
      }
    ];

    for (const b of arterialBranches) {
      vascGroup.add(new THREE.Mesh(makeVesselTube(b.pts, b.r, 24, 10), artMat.clone()));
    }
    for (const b of venousBranches) {
      vascGroup.add(new THREE.Mesh(makeVesselTube(b.pts, b.r, 24, 10), veinMat.clone()));
    }

    registerLayer(
      HEART_LAYERS_BY_ID.layer_coronary_vessels,
      [vascGroup],
      -1.88,
      -1.22,
      [-0.62, -0.38, 0.52]
    );
  }

  return {
    root,
    layerRecords,
    pickableMeshes,
    catalog: HEART_LAYERS_CATALOG
  };
}

/**
 * Updates vertical layer separation, cardiac pulse motion, and selection highlight
 * for the 9-layer Exploded 3D Heart Assembly.
 */
export function updateHeartLayersAssembly(
  layersAssembly,
  elapsedSeconds,
  ventricularContract,
  spreadFactor,
  selectedPartId,
  hoveredPartId,
  focusMode = 'dim'
) {
  if (!layersAssembly || !layersAssembly.root.visible) return;

  const t = Math.max(0, Math.min(1, spreadFactor));

  for (const [id, rec] of layersAssembly.layerRecords.entries()) {
    const g = rec.group;
    const baseY = rec.compactY + (rec.explodedY - rec.compactY) * t;
    const pulseY =
      id === 'layer_myocardium' || id === 'layer_heart_chambers'
        ? ventricularContract * 0.035
        : ventricularContract * 0.015;
    g.position.y = baseY + pulseY;

    const pulseScale =
      id === 'layer_myocardium' || id === 'layer_heart_chambers'
        ? 1.0 - ventricularContract * 0.038
        : 1.0 - ventricularContract * 0.015;
    g.scale.set(pulseScale, 1.0, pulseScale);

    const isSelected = selectedPartId === id;
    const isHovered = hoveredPartId === id;

    if (selectedPartId && HEART_LAYERS_BY_ID[selectedPartId] && focusMode === 'isolate' && !isSelected) {
      g.visible = false;
      continue;
    }
    g.visible = true;

    for (const mat of rec.materials) {
      if (isSelected) {
        mat.emissive.copy(rec.baseColor).multiplyScalar(0.38 + 0.14 * Math.sin(elapsedSeconds * 5));
        mat.opacity = 1.0;
        mat.transparent = false;
      } else if (isHovered) {
        mat.emissive.copy(rec.baseColor).multiplyScalar(0.24);
        mat.opacity = 1.0;
        mat.transparent = false;
      } else if (selectedPartId && HEART_LAYERS_BY_ID[selectedPartId] && focusMode === 'dim') {
        mat.emissive.setRGB(0, 0, 0);
        mat.transparent = true;
        mat.opacity = 0.36;
      } else {
        mat.emissive.setRGB(0, 0, 0);
        mat.transparent = false;
        mat.opacity = 1.0;
      }
    }
  }
}
