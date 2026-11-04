import * as THREE from 'three';

/**
 * Complete catalog of 26 anatomical structures of the human heart.
 */
export const HEART_PARTS = [
  // Chambers & Septa (7)
  {
    id: 'right_atrium',
    name: 'Right Atrium',
    latin: 'Atrium dextrum',
    category: 'Chambers & Septa',
    oxygenation: 'Deoxygenated (Venous)',
    color: 0x3b82f6,
    pathway: 'SVC / IVC / Coronary Sinus → Tricuspid Valve',
    role: 'Receives systemic venous return & houses SA pacemaker node',
    description:
      'Upper right chamber receiving deoxygenated blood from the superior vena cava, inferior vena cava, and coronary sinus. Its thin muscular wall contracts during late diastole (atrial kick) to top off the right ventricle.'
  },
  {
    id: 'right_ventricle',
    name: 'Right Ventricle',
    latin: 'Ventriculus dexter',
    category: 'Chambers & Septa',
    oxygenation: 'Deoxygenated (Venous)',
    color: 0x2563eb,
    pathway: 'Tricuspid Valve → Pulmonary Valve → Pulmonary Trunk',
    role: 'Low-pressure pump driving blood to the lungs (~25/4 mmHg)',
    description:
      'Crescent-shaped anterior chamber that pumps venous blood across the pulmonary valve into the pulmonary trunk for gas exchange in the lungs.'
  },
  {
    id: 'left_atrium',
    name: 'Left Atrium',
    latin: 'Atrium sinistrum',
    category: 'Chambers & Septa',
    oxygenation: 'Oxygenated (Arterial)',
    color: 0xf43f5e,
    pathway: 'Left & Right Pulmonary Veins → Mitral Valve',
    role: 'Oxygenated reservoir feeding the left ventricle',
    description:
      'Posteriorly positioned upper chamber receiving freshly oxygenated blood from four pulmonary veins and delivering it across the mitral valve into the left ventricle.'
  },
  {
    id: 'left_ventricle',
    name: 'Left Ventricle',
    latin: 'Ventriculus sinister',
    category: 'Chambers & Septa',
    oxygenation: 'Oxygenated (Arterial)',
    color: 0xdc2626,
    pathway: 'Mitral Valve → Aortic Valve → Ascending Aorta',
    role: 'High-pressure systemic pump (~120/80 mmHg)',
    description:
      'Thickest-walled conical chamber forming the bulk of the left inferior border. Generates the high systolic pressure required to perfuse the brain, organs, and coronary tree.'
  },
  {
    id: 'interventricular_septum',
    name: 'Interventricular Septum',
    latin: 'Septum interventriculare',
    category: 'Chambers & Septa',
    oxygenation: 'Structural Septum',
    color: 0xbe123c,
    pathway: 'Divides Right & Left Ventricles (Bundle of His pathway)',
    role: 'Prevents mixing of venous & arterial blood; conducts impulses',
    description:
      'Stout muscular and membranous partition separating the right and left ventricles. Houses the atrioventricular bundle (Bundle of His) and left/right bundle branches.'
  },
  {
    id: 'interatrial_septum',
    name: 'Interatrial Septum',
    latin: 'Septum interatriale',
    category: 'Chambers & Septa',
    oxygenation: 'Structural Septum',
    color: 0x9f1239,
    pathway: 'Divides Right & Left Atria (contains Fossa Ovalis)',
    role: 'Seals left and right atrial chambers after birth',
    description:
      'Thin wall between the left and right atria featuring the fossa ovalis—the remnant of the fetal foramen ovale that shunted blood before the lungs expanded.'
  },
  {
    id: 'cardiac_apex',
    name: 'Cardiac Apex',
    latin: 'Apex cordis',
    category: 'Chambers & Septa',
    oxygenation: 'Oxygenated Myocardium',
    color: 0xb91c1c,
    pathway: 'Inferior-anterior tip formed by the Left Ventricle',
    role: 'Produces the point of maximal impulse (PMI) at 5th ICS',
    description:
      'Conical inferior tip of the heart directed anteroinferiorly to the left. Helical myocardial fibers twist here during systole to wring blood upward into the aortic root.'
  },

  // Valves & Apparatus (6)
  {
    id: 'tricuspid_valve',
    name: 'Tricuspid Valve',
    latin: 'Valva atrioventricularis dextra',
    category: 'Valves & Apparatus',
    oxygenation: 'Deoxygenated Pathway',
    color: 0xfef08a,
    pathway: 'Right Atrium → Right Ventricle',
    role: 'Three-leaflet AV valve preventing right atrial backflow',
    description:
      'Right atrioventricular valve with anterior, posterior, and septal leaflets tethered by chordae tendineae. Opens in diastole for ventricular filling and snaps shut at the start of systole (part of S1).'
  },
  {
    id: 'mitral_valve',
    name: 'Mitral (Bicuspid) Valve',
    latin: 'Valva atrioventricularis sinistra',
    category: 'Valves & Apparatus',
    oxygenation: 'Oxygenated Pathway',
    color: 0xfde047,
    pathway: 'Left Atrium → Left Ventricle',
    role: 'Two-leaflet high-pressure AV valve sealing the left atrium',
    description:
      'Dual-leaflet valve between the left atrium and left ventricle. Withstands systemic systolic pressure with support from strong chordae tendineae and anterolateral/posteromedial papillary muscles.'
  },
  {
    id: 'pulmonary_valve',
    name: 'Pulmonary Semilunar Valve',
    latin: 'Valva trunci pulmonalis',
    category: 'Valves & Apparatus',
    oxygenation: 'Deoxygenated Pathway',
    color: 0x7dd3fc,
    pathway: 'Right Ventricle → Pulmonary Trunk',
    role: 'Three semilunar cusps preventing pulmonary regurgitation',
    description:
      'Semilunar outflow valve at the summit of the right ventricular infundibulum. Opens during right ventricular ejection and closes in diastole (pulmonic component of S2).'
  },
  {
    id: 'aortic_valve',
    name: 'Aortic Semilunar Valve',
    latin: 'Valva aortae',
    category: 'Valves & Apparatus',
    oxygenation: 'Oxygenated Pathway',
    color: 0xfbbf24,
    pathway: 'Left Ventricle → Ascending Aorta',
    role: 'Three semilunar cusps guarding the systemic outflow tract',
    description:
      'Tri-leaflet semilunar valve between the left ventricular outflow tract and ascending aorta. Its right and left aortic sinuses give rise to the right and left coronary arteries.'
  },
  {
    id: 'chordae_tendineae',
    name: 'Chordae Tendineae',
    latin: 'Chordae tendineae cordis',
    category: 'Valves & Apparatus',
    oxygenation: 'Fibrous Subvalvular Apparatus',
    color: 0xfef9c3,
    pathway: 'Papillary Muscles → Tricuspid & Mitral Leaflets',
    role: 'Inelastic collagen cords preventing leaflet prolapse',
    description:
      'Fan-like collagenous tendons ("heartstrings") linking ventricular papillary muscles to the free margins of the tricuspid and mitral valve leaflets so they cannot evert during systole.'
  },
  {
    id: 'papillary_muscles',
    name: 'Papillary Muscles',
    latin: 'Musculi papillares',
    category: 'Valves & Apparatus',
    oxygenation: 'Ventricular Myocardium',
    color: 0xfb7185,
    pathway: 'Ventricular Endocardium → Chordae Tendineae',
    role: 'Contract with ventricles to tension chordae tendineae',
    description:
      'Conical muscular projections rising from the right and left ventricular walls. They contract milliseconds before the ventricular walls to pull the chordae taut during ejection.'
  },

  // Great Vessels (9)
  {
    id: 'aorta_arch',
    name: 'Ascending Aorta & Arch',
    latin: 'Aorta ascendens et Arcus aortae',
    category: 'Great Vessels',
    oxygenation: 'Oxygenated (Arterial)',
    color: 0xef4444,
    pathway: 'Aortic Valve → Brachiocephalic / Carotid / Subclavian / Descending',
    role: 'Main systemic conduit with Windkessel elastic recoil',
    description:
      'Great elastic artery emerging from the left ventricle and arching superiorly over the pulmonary trunk. Gives off the brachiocephalic trunk, left common carotid, and left subclavian arteries.'
  },
  {
    id: 'descending_aorta',
    name: 'Descending Thoracic Aorta',
    latin: 'Aorta thoracica descendens',
    category: 'Great Vessels',
    oxygenation: 'Oxygenated (Arterial)',
    color: 0xb91c1c,
    pathway: 'Aortic Arch → Posterior Mediastinum & Systemic Organs',
    role: 'Delivers oxygenated blood to the trunk and lower body',
    description:
      'Continuation of the aortic arch running inferiorly behind the heart through the posterior mediastinum to supply thoracic and abdominal viscera.'
  },
  {
    id: 'pulmonary_trunk',
    name: 'Pulmonary Trunk',
    latin: 'Truncus pulmonalis',
    category: 'Great Vessels',
    oxygenation: 'Deoxygenated (Venous)',
    color: 0x38bdf8,
    pathway: 'Pulmonary Valve → Left & Right Pulmonary Arteries',
    role: 'Carries venous blood from RV toward both lungs',
    description:
      'Wide arterial trunk exiting the right ventricular outflow tract anteriorly, ascending obliquely before bifurcating beneath the aortic arch into left and right pulmonary arteries.'
  },
  {
    id: 'left_pulmonary_artery',
    name: 'Left Pulmonary Artery',
    latin: 'Arteria pulmonalis sinistra',
    category: 'Great Vessels',
    oxygenation: 'Deoxygenated (Venous)',
    color: 0x0ea5e9,
    pathway: 'Pulmonary Trunk → Left Lung Hilum',
    role: 'Delivers deoxygenated blood to the left lung',
    description:
      'Left branch of the pulmonary trunk coursing laterally anterior to the descending aorta to enter the hilum of the left lung for alveolar gas exchange.'
  },
  {
    id: 'right_pulmonary_artery',
    name: 'Right Pulmonary Artery',
    latin: 'Arteria pulmonalis dextra',
    category: 'Great Vessels',
    oxygenation: 'Deoxygenated (Venous)',
    color: 0x0284c7,
    pathway: 'Pulmonary Trunk → Right Lung Hilum',
    role: 'Delivers deoxygenated blood to the right lung',
    description:
      'Longer right branch of the pulmonary trunk passing horizontally beneath the aortic arch and behind the superior vena cava to reach the right lung.'
  },
  {
    id: 'superior_vena_cava',
    name: 'Superior Vena Cava (SVC)',
    latin: 'Vena cava superior',
    category: 'Great Vessels',
    oxygenation: 'Deoxygenated (Venous)',
    color: 0x1d4ed8,
    pathway: 'Head, Neck & Upper Limbs → Superior Right Atrium',
    role: 'Drains venous blood from the upper body into the RA',
    description:
      'Large valveless venous trunk formed by the left and right brachiocephalic veins that empties directly into the superior aspect of the right atrium.'
  },
  {
    id: 'inferior_vena_cava',
    name: 'Inferior Vena Cava (IVC)',
    latin: 'Vena cava inferior',
    category: 'Great Vessels',
    oxygenation: 'Deoxygenated (Venous)',
    color: 0x1e40af,
    pathway: 'Lower Body & Abdominal Viscera → Inferior Right Atrium',
    role: 'Largest vein returning lower-body venous blood to the RA',
    description:
      'Ascends through the diaphragm at T8 to enter the posteroinferior aspect of the right atrium, returning venous blood from the abdomen, pelvis, and lower extremities.'
  },
  {
    id: 'left_pulmonary_veins',
    name: 'Left Pulmonary Veins',
    latin: 'Venae pulmonales sinistrae',
    category: 'Great Vessels',
    oxygenation: 'Oxygenated (Arterial)',
    color: 0xfb7185,
    pathway: 'Left Lung Alveoli → Left Atrium',
    role: 'Return freshly oxygenated blood from the left lung',
    description:
      'Superior and inferior left pulmonary veins emerging from the left lung hilum and emptying oxygenated blood directly into the posterolateral wall of the left atrium.'
  },
  {
    id: 'right_pulmonary_veins',
    name: 'Right Pulmonary Veins',
    latin: 'Venae pulmonales dextrae',
    category: 'Great Vessels',
    oxygenation: 'Oxygenated (Arterial)',
    color: 0xf43f5e,
    pathway: 'Right Lung Alveoli → Left Atrium',
    role: 'Return freshly oxygenated blood from the right lung',
    description:
      'Superior and inferior right pulmonary veins passing posterior to the right atrium and superior vena cava to enter the right posterior wall of the left atrium.'
  },

  // Coronary System (4)
  {
    id: 'coronary_sinus',
    name: 'Coronary Sinus',
    latin: 'Sinus coronarius',
    category: 'Coronary System',
    oxygenation: 'Deoxygenated Myocardial Venous',
    color: 0x6366f1,
    pathway: 'Posterior Atrioventricular Groove → Right Atrium',
    role: 'Collects ~75% of cardiac venous drainage into the RA',
    description:
      'Wide venous channel running in the posterior coronary sulcus between the left atrium and left ventricle, returning deoxygenated blood from the myocardium into the right atrium.'
  },
  {
    id: 'right_coronary_artery',
    name: 'Right Coronary Artery (RCA)',
    latin: 'Arteria coronaria dextra',
    category: 'Coronary System',
    oxygenation: 'Oxygenated Coronary Arterial',
    color: 0xf97316,
    pathway: 'Right Aortic Sinus → Right AV Sulcus → Posterior Interventricular',
    role: 'Perfuses RA, RV, SA/AV nodes & inferior septum',
    description:
      'Branches from the right aortic sinus and travels along the right atrioventricular groove, supplying the right atrium, right ventricle, sinoatrial node, and AV node.'
  },
  {
    id: 'left_anterior_descending',
    name: 'Left Anterior Descending (LAD)',
    latin: 'Ramus interventricularis anterior',
    category: 'Coronary System',
    oxygenation: 'Oxygenated Coronary Arterial',
    color: 0xf59e0b,
    pathway: 'Left Main Coronary → Anterior Interventricular Sulcus → Apex',
    role: 'Supplies anterior LV wall & anterior two-thirds of septum',
    description:
      'Major branch of the left coronary artery descending down the anterior interventricular groove toward the apex. Supplies ~50% of left ventricular myocardial mass.'
  },
  {
    id: 'left_circumflex_artery',
    name: 'Left Circumflex Artery (LCx)',
    latin: 'Ramus circumflexus',
    category: 'Coronary System',
    oxygenation: 'Oxygenated Coronary Arterial',
    color: 0xfbbf24,
    pathway: 'Left Main Coronary → Left AV Groove → Lateral/Posterior LV',
    role: 'Supplies left atrium and posterolateral left ventricle',
    description:
      'Curves leftward in the coronary sulcus around the lateral border of the heart, supplying oxygenated blood to the left atrium and lateral/posterior walls of the left ventricle.'
  }
];

/**
 * Helper to create a curved tube geometry from 3D control points.
 */
function makeTube(points, radius, tubularSegments = 48, radialSegments = 20, closed = false) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    closed,
    'catmullrom',
    0.5
  );
  return new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed);
}

/**
 * Helper to create a lathed organic chamber shell with thickness (inner + outer walls so slicing shows real lumen).
 */
function makeHollowChamber(scaleX, scaleY, scaleZ, wallRatio = 0.78) {
  const geo = new THREE.SphereGeometry(1, 44, 34);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // Slight organic tapering toward bottom
    const taper = 1 - 0.18 * Math.max(0, -v.y);
    v.x *= scaleX * taper;
    v.y *= scaleY;
    v.z *= scaleZ * taper;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return { outer: geo, wallRatio };
}

/**
 * Builds the complete 26-part stylized anatomical heart group, ready for raycasting,
 * cross-sectional clipping, explode view, and physiological cardiac-cycle animation.
 */
export function createHeartModel(clippingPlane) {
  const root = new THREE.Group();
  root.name = 'HeartRoot';

  const partMeshes = new Map(); // id -> { group, meshes, meta, basePos, explodeDir, role }
  const pickableMeshes = [];

  function registerPart(meta, geometriesOrMeshes, offset = [0, 0, 0], animRole = 'vessel', materialOpts = {}) {
    const group = new THREE.Group();
    group.name = meta.id;
    group.position.set(offset[0], offset[1], offset[2]);

    const mat = new THREE.MeshPhysicalMaterial({
      color: meta.color,
      roughness: materialOpts.roughness ?? 0.34,
      metalness: materialOpts.metalness ?? 0.06,
      clearcoat: materialOpts.clearcoat ?? 0.45,
      clearcoatRoughness: 0.25,
      side: THREE.DoubleSide,
      clippingPlanes: clippingPlane ? [clippingPlane] : [],
      clipShadows: true,
      transparent: materialOpts.transparent ?? false,
      opacity: materialOpts.opacity ?? 1.0
    });

    const meshes = [];
    for (const item of geometriesOrMeshes) {
      let mesh;
      if (item.isMesh) {
        mesh = item;
        mesh.material = mat;
      } else {
        mesh = new THREE.Mesh(item, mat);
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.partId = meta.id;
      mesh.userData.partMeta = meta;
      group.add(mesh);
      meshes.push(mesh);
      pickableMeshes.push(mesh);
    }

    // Compute world center & outward explode direction
    group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(group);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const explodeDir = center.clone();
    if (explodeDir.lengthSq() < 0.01) {
      explodeDir.set(0, 0.3, 1);
    }
    explodeDir.normalize();

    const record = {
      id: meta.id,
      meta,
      group,
      meshes,
      material: mat,
      baseColor: new THREE.Color(meta.color),
      basePos: group.position.clone(),
      center,
      explodeDir,
      animRole
    };

    partMeshes.set(meta.id, record);
    root.add(group);
    return record;
  }

  const byId = Object.fromEntries(HEART_PARTS.map((p) => [p.id, p]));

  // ============================================================================
  // 1. CHAMBERS & SEPTA (7 parts)
  // ============================================================================

  // Right Atrium (upper right-anterior)
  {
    const { outer } = makeHollowChamber(0.92, 0.85, 0.86);
    outer.rotateZ(-0.18);
    // Add right auricle appendage
    const auricle = new THREE.SphereGeometry(0.42, 24, 18);
    auricle.scale(1.2, 0.72, 0.9);
    auricle.translate(-0.42, 0.35, 0.55);
    registerPart(byId.right_atrium, [outer, auricle], [-1.22, 0.92, 0.22], 'atrium');
  }

  // Right Ventricle (anterior-right crescent chamber)
  {
    const { outer } = makeHollowChamber(1.06, 1.52, 0.98);
    outer.rotateZ(-0.24);
    const infundibulum = makeTube(
      [
        [-0.55, 0.25, 0.62],
        [-0.35, 0.88, 0.72],
        [-0.18, 1.32, 0.66]
      ],
      0.44,
      24,
      18
    );
    registerPart(byId.right_ventricle, [outer, infundibulum], [-0.74, -0.68, 0.34], 'ventricle');
  }

  // Left Atrium (upper left-posterior)
  {
    const { outer } = makeHollowChamber(0.94, 0.82, 0.86);
    const auricle = new THREE.SphereGeometry(0.38, 24, 18);
    auricle.scale(1.15, 0.68, 0.85);
    auricle.translate(0.55, 0.22, 0.52);
    registerPart(byId.left_atrium, [outer, auricle], [1.14, 0.98, -0.26], 'atrium');
  }

  // Left Ventricle (thick conical chamber on left-inferior)
  {
    const { outer } = makeHollowChamber(1.16, 1.72, 1.08);
    outer.rotateZ(0.22);
    registerPart(byId.left_ventricle, [outer], [0.76, -0.74, 0.06], 'ventricle');
  }

  // Interventricular Septum (central muscular wall between RV and LV)
  {
    const septumGeo = new THREE.CylinderGeometry(0.22, 0.14, 2.25, 24, 12);
    septumGeo.scale(0.55, 1.0, 1.65);
    septumGeo.rotateZ(0.14);
    registerPart(byId.interventricular_septum, [septumGeo], [0.02, -0.78, 0.18], 'septum');
  }

  // Interatrial Septum (upper partition with fossa ovalis depression)
  {
    const iasGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.14, 28);
    iasGeo.rotateZ(Math.PI / 2);
    iasGeo.rotateY(0.22);
    const fossaRing = new THREE.TorusGeometry(0.22, 0.045, 14, 28);
    fossaRing.rotateY(Math.PI / 2);
    registerPart(byId.interatrial_septum, [iasGeo, fossaRing], [-0.04, 0.95, -0.02], 'septum');
  }

  // Cardiac Apex (conical muscular inferior-left tip)
  {
    const apexGeo = new THREE.ConeGeometry(0.76, 1.05, 32);
    apexGeo.rotateZ(Math.PI + 0.32);
    apexGeo.scale(1.0, 1.0, 0.88);
    registerPart(byId.cardiac_apex, [apexGeo], [0.98, -2.08, 0.24], 'apex');
  }

  // ============================================================================
  // 2. VALVES & SUBVALVULAR APPARATUS (6 parts)
  // ============================================================================

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

  // Tricuspid Valve (between RA and RV)
  registerPart(
    byId.tricuspid_valve,
    makeValveGeometry(3, 0.38),
    [-0.92, 0.18, 0.32],
    'av_valve',
    { roughness: 0.22 }
  );

  // Mitral (Bicuspid) Valve (between LA and LV)
  registerPart(
    byId.mitral_valve,
    makeValveGeometry(2, 0.38),
    [0.88, 0.2, -0.04],
    'av_valve',
    { roughness: 0.22 }
  );

  // Pulmonary Semilunar Valve (RV outflow to Pulmonary Trunk)
  {
    const geoms = makeValveGeometry(3, 0.31);
    geoms.forEach((g) => g.rotateZ(-0.22));
    registerPart(byId.pulmonary_valve, geoms, [-0.18, 1.32, 0.64], 'sl_valve', {
      roughness: 0.22
    });
  }

  // Aortic Semilunar Valve (LV outflow to Ascending Aorta)
  {
    const geoms = makeValveGeometry(3, 0.33);
    geoms.forEach((g) => g.rotateZ(0.18));
    registerPart(byId.aortic_valve, geoms, [0.26, 0.72, 0.12], 'sl_valve', {
      roughness: 0.22
    });
  }

  // Chordae Tendineae (collagen cords in both RV and LV)
  {
    const cords = [];
    const anchors = [
      // Right ventricle cords
      [
        [-0.95, -0.58, 0.42],
        [-0.92, 0.15, 0.36]
      ],
      [
        [-0.72, -0.64, 0.22],
        [-0.82, 0.15, 0.24]
      ],
      [
        [-1.08, -0.52, 0.18],
        [-1.02, 0.15, 0.28]
      ],
      // Left ventricle cords
      [
        [0.92, -0.66, 0.18],
        [0.88, 0.18, 0.06]
      ],
      [
        [0.68, -0.72, -0.14],
        [0.78, 0.18, -0.12]
      ],
      [
        [1.06, -0.62, -0.08],
        [0.98, 0.18, -0.02]
      ]
    ];
    for (const [p0, p1] of anchors) {
      const mid = [(p0[0] + p1[0]) * 0.5, (p0[1] + p1[1]) * 0.5, (p0[2] + p1[2]) * 0.5 + 0.04];
      cords.push(makeTube([p0, mid, p1], 0.026, 16, 8));
    }
    registerPart(byId.chordae_tendineae, cords, [0, 0, 0], 'chordae', { roughness: 0.25 });
  }

  // Papillary Muscles (conical pillars anchoring chordae in RV & LV)
  {
    const p1 = new THREE.ConeGeometry(0.16, 0.52, 16);
    p1.translate(-0.92, -0.72, 0.36);
    const p2 = new THREE.ConeGeometry(0.15, 0.48, 16);
    p2.translate(-0.72, -0.78, 0.18);
    const p3 = new THREE.ConeGeometry(0.18, 0.58, 16);
    p3.translate(0.92, -0.82, 0.14);
    const p4 = new THREE.ConeGeometry(0.17, 0.54, 16);
    p4.translate(0.68, -0.86, -0.14);
    registerPart(byId.papillary_muscles, [p1, p2, p3, p4], [0, 0, 0], 'ventricle');
  }

  // ============================================================================
  // 3. GREAT VESSELS (9 parts)
  // ============================================================================

  // Ascending Aorta & Aortic Arch (with 3 supra-aortic branches)
  {
    const archTube = makeTube(
      [
        [0.26, 0.72, 0.12],
        [0.14, 1.55, 0.18],
        [0.02, 2.32, 0.04],
        [0.24, 2.68, -0.32],
        [0.52, 2.38, -0.68]
      ],
      0.38,
      48,
      24
    );
    const brachiocephalic = makeTube(
      [
        [0.04, 2.48, -0.02],
        [-0.18, 3.12, -0.05]
      ],
      0.13,
      16,
      12
    );
    const leftCarotid = makeTube(
      [
        [0.18, 2.62, -0.22],
        [0.16, 3.22, -0.24]
      ],
      0.1,
      16,
      12
    );
    const leftSubclavian = makeTube(
      [
        [0.36, 2.58, -0.44],
        [0.44, 3.15, -0.48]
      ],
      0.1,
      16,
      12
    );
    registerPart(
      byId.aorta_arch,
      [archTube, brachiocephalic, leftCarotid, leftSubclavian],
      [0, 0, 0],
      'artery'
    );
  }

  // Descending Thoracic Aorta (posterior vertical trunk)
  {
    const descTube = makeTube(
      [
        [0.52, 2.38, -0.68],
        [0.48, 1.15, -0.88],
        [0.38, -0.35, -0.92],
        [0.32, -1.95, -0.86]
      ],
      0.34,
      40,
      20
    );
    registerPart(byId.descending_aorta, [descTube], [0, 0, 0], 'artery');
  }

  // Pulmonary Trunk (anterior outflow from RV)
  {
    const ptTube = makeTube(
      [
        [-0.18, 1.32, 0.64],
        [-0.04, 1.78, 0.52],
        [0.12, 2.04, 0.24]
      ],
      0.34,
      32,
      22
    );
    registerPart(byId.pulmonary_trunk, [ptTube], [0, 0, 0], 'artery');
  }

  // Left Pulmonary Artery
  {
    const lpaTube = makeTube(
      [
        [0.12, 2.04, 0.24],
        [0.78, 2.12, 0.08],
        [1.68, 2.04, -0.14]
      ],
      0.24,
      28,
      18
    );
    registerPart(byId.left_pulmonary_artery, [lpaTube], [0, 0, 0], 'artery');
  }

  // Right Pulmonary Artery
  {
    const rpaTube = makeTube(
      [
        [0.12, 2.04, 0.24],
        [-0.64, 2.06, 0.02],
        [-1.68, 1.98, -0.18]
      ],
      0.24,
      28,
      18
    );
    registerPart(byId.right_pulmonary_artery, [rpaTube], [0, 0, 0], 'artery');
  }

  // Superior Vena Cava (SVC)
  {
    const svcTube = makeTube(
      [
        [-1.18, 1.25, 0.12],
        [-1.16, 2.15, 0.08],
        [-1.12, 2.98, 0.04]
      ],
      0.31,
      28,
      20
    );
    registerPart(byId.superior_vena_cava, [svcTube], [0, 0, 0], 'vein');
  }

  // Inferior Vena Cava (IVC)
  {
    const ivcTube = makeTube(
      [
        [-1.18, 0.42, -0.14],
        [-1.16, -0.75, -0.28],
        [-1.12, -2.02, -0.34]
      ],
      0.33,
      28,
      20
    );
    registerPart(byId.inferior_vena_cava, [ivcTube], [0, 0, 0], 'vein');
  }

  // Left Pulmonary Veins (superior & inferior pairs entering LA)
  {
    const lpvSup = makeTube(
      [
        [2.05, 1.38, -0.26],
        [1.45, 1.22, -0.26]
      ],
      0.16,
      20,
      14
    );
    const lpvInf = makeTube(
      [
        [2.02, 0.88, -0.34],
        [1.42, 0.86, -0.3]
      ],
      0.16,
      20,
      14
    );
    registerPart(byId.left_pulmonary_veins, [lpvSup, lpvInf], [0, 0, 0], 'vein');
  }

  // Right Pulmonary Veins (passing posteriorly to enter LA)
  {
    const rpvSup = makeTube(
      [
        [-1.95, 1.32, -0.52],
        [-0.45, 1.18, -0.58],
        [0.82, 1.14, -0.44]
      ],
      0.15,
      28,
      14
    );
    const rpvInf = makeTube(
      [
        [-1.92, 0.84, -0.58],
        [-0.42, 0.82, -0.62],
        [0.82, 0.84, -0.46]
      ],
      0.15,
      28,
      14
    );
    registerPart(byId.right_pulmonary_veins, [rpvSup, rpvInf], [0, 0, 0], 'vein');
  }

  // ============================================================================
  // 4. CORONARY VASCULATURE (4 parts)
  // ============================================================================

  // Coronary Sinus (posterior AV groove)
  {
    const csTube = makeTube(
      [
        [1.18, 0.34, -0.78],
        [0.42, 0.22, -0.92],
        [-0.38, 0.25, -0.82],
        [-0.95, 0.42, -0.45]
      ],
      0.11,
      32,
      14
    );
    registerPart(byId.coronary_sinus, [csTube], [0, 0, 0], 'coronary');
  }

  // Right Coronary Artery (RCA)
  {
    const rcaMain = makeTube(
      [
        [0.12, 0.78, 0.36],
        [-0.65, 0.52, 0.88],
        [-1.38, 0.12, 0.65],
        [-1.42, -0.45, 0.08],
        [-0.82, -0.95, -0.68],
        [-0.08, -1.35, -0.72]
      ],
      0.068,
      48,
      12
    );
    const marginalBranch = makeTube(
      [
        [-1.38, -0.18, 0.52],
        [-1.18, -0.95, 0.78],
        [-0.72, -1.48, 0.72]
      ],
      0.046,
      24,
      10
    );
    registerPart(byId.right_coronary_artery, [rcaMain, marginalBranch], [0, 0, 0], 'coronary');
  }

  // Left Anterior Descending Artery (LAD)
  {
    const ladMain = makeTube(
      [
        [0.36, 0.78, 0.32],
        [0.18, 0.42, 0.86],
        [0.08, -0.18, 1.06],
        [0.24, -0.88, 1.04],
        [0.56, -1.52, 0.82],
        [0.88, -1.96, 0.48]
      ],
      0.072,
      48,
      12
    );
    const diagBranch = makeTube(
      [
        [0.14, -0.05, 1.04],
        [0.78, -0.52, 1.08],
        [1.26, -1.08, 0.82]
      ],
      0.048,
      24,
      10
    );
    registerPart(byId.left_anterior_descending, [ladMain, diagBranch], [0, 0, 0], 'coronary');
  }

  // Left Circumflex Artery (LCx)
  {
    const lcxMain = makeTube(
      [
        [0.36, 0.78, 0.32],
        [0.92, 0.56, 0.58],
        [1.48, 0.35, 0.14],
        [1.52, 0.08, -0.48],
        [1.12, -0.45, -0.88]
      ],
      0.066,
      40,
      12
    );
    const obtuseMarginal = makeTube(
      [
        [1.48, 0.22, -0.05],
        [1.62, -0.58, 0.12],
        [1.38, -1.28, 0.08]
      ],
      0.046,
      24,
      10
    );
    registerPart(byId.left_circumflex_artery, [lcxMain, obtuseMarginal], [0, 0, 0], 'coronary');
  }

  return {
    root,
    partMeshes,
    pickableMeshes,
    partsCatalog: HEART_PARTS
  };
}

/**
 * Updates the physiological heartbeat deformation, valve opening/closing, and explode state.
 * Returns the current cardiac cycle phase label and normalized ECG voltage.
 */
export function updateHeartCycle(heartModel, elapsedSeconds, bpm, beatEnabled, explodeFactor, selectedPartId, hoveredPartId) {
  const period = 60 / Math.max(40, Math.min(180, bpm));
  const phase = beatEnabled ? (elapsedSeconds % period) / period : 0.75;

  // Physiological phases within [0..1]:
  // 0.00 - 0.14: Atrial Systole (P wave)
  // 0.14 - 0.44: Ventricular Systole (QRS + ejection)
  // 0.44 - 0.62: Early Diastole / Isovolumetric relaxation (T wave)
  // 0.62 - 1.00: Mid-Late Diastole (Rapid ventricular filling)
  let phaseLabel = 'DIASTOLIC FILLING';
  if (phase < 0.14) {
    phaseLabel = 'ATRIAL SYSTOLE';
  } else if (phase < 0.44) {
    phaseLabel = 'VENTRICULAR SYSTOLE';
  } else if (phase < 0.62) {
    phaseLabel = 'DIASTOLIC RELAXATION';
  }

  // Smooth contraction curves
  const atrialContract = beatEnabled
    ? Math.exp(-Math.pow((phase - 0.08) / 0.055, 2))
    : 0;
  const ventricularContract = beatEnabled
    ? Math.exp(-Math.pow((phase - 0.27) / 0.09, 2))
    : 0;
  const arterialPulse = beatEnabled
    ? Math.exp(-Math.pow((phase - 0.34) / 0.11, 2))
    : 0;

  // Synthetic P-QRS-T ECG waveform value in [-0.4, 1.0]
  const pWave = 0.22 * Math.exp(-Math.pow((phase - 0.07) / 0.025, 2));
  const qDip = -0.18 * Math.exp(-Math.pow((phase - 0.16) / 0.01, 2));
  const rPeak = 1.0 * Math.exp(-Math.pow((phase - 0.185) / 0.012, 2));
  const sDip = -0.28 * Math.exp(-Math.pow((phase - 0.21) / 0.012, 2));
  const tWave = 0.34 * Math.exp(-Math.pow((phase - 0.42) / 0.04, 2));
  const ecgValue = beatEnabled ? pWave + qDip + rPeak + sDip + tWave : 0;

  for (const [id, rec] of heartModel.partMeshes.entries()) {
    const g = rec.group;

    // 1. Explode offset
    const ex = rec.explodeDir;
    g.position.set(
      rec.basePos.x + ex.x * explodeFactor * 0.85,
      rec.basePos.y + ex.y * explodeFactor * 0.85,
      rec.basePos.z + ex.z * explodeFactor * 0.85
    );

    // 2. Role-specific physiological motion
    if (rec.animRole === 'atrium') {
      const s = 1 - 0.095 * atrialContract + 0.03 * ventricularContract;
      g.scale.set(s, s, s);
    } else if (rec.animRole === 'ventricle' || rec.animRole === 'apex') {
      const squeezeXZ = 1 - 0.11 * ventricularContract + 0.025 * atrialContract;
      const squeezeY = 1 - 0.065 * ventricularContract;
      g.scale.set(squeezeXZ, squeezeY, squeezeXZ);
    } else if (rec.animRole === 'artery') {
      const expand = 1 + 0.065 * arterialPulse;
      g.scale.set(expand, 1 + 0.02 * arterialPulse, expand);
    } else if (rec.animRole === 'av_valve') {
      // AV valves open in diastole/atrial systole, snap closed in ventricular systole
      const openAmt = 1 - 0.22 * ventricularContract;
      g.scale.set(openAmt, 1, openAmt);
    } else if (rec.animRole === 'sl_valve') {
      // Semilunar valves open during ventricular ejection
      const openAmt = 0.86 + 0.22 * ventricularContract;
      g.scale.set(openAmt, 1, openAmt);
    } else {
      const s = 1 - 0.04 * ventricularContract;
      g.scale.set(s, s, s);
    }

    // 3. Visual highlighting for selected / hovered part
    const isSelected = selectedPartId === id;
    const isHovered = hoveredPartId === id;
    const mat = rec.material;

    if (isSelected) {
      const pulseGlow = 0.55 + 0.25 * Math.sin(elapsedSeconds * 6);
      mat.emissive.copy(rec.baseColor).multiplyScalar(pulseGlow);
      mat.opacity = 1.0;
      mat.transparent = false;
    } else if (isHovered) {
      mat.emissive.copy(rec.baseColor).multiplyScalar(0.35);
      mat.opacity = 1.0;
      mat.transparent = false;
    } else if (selectedPartId) {
      // Dim unselected structures slightly so internal selected parts (valves, septa, chordae) stand out clearly
      mat.emissive.setRGB(0, 0, 0);
      mat.transparent = true;
      mat.opacity = 0.42;
    } else {
      mat.emissive.setRGB(0, 0, 0);
      mat.transparent = false;
      mat.opacity = 1.0;
    }
  }

  return { phaseLabel, ecgValue, phase };
}
