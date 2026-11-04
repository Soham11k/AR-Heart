import * as THREE from 'three';

/**
 * Generates an anatomically accurate biconcave discoid Red Blood Cell (erythrocyte)
 * geometry using the Evans & Fung (1972) physiological profile:
 *   y(r) = 0.5 * R * sqrt(1 - r^2) * (0.207 + 2.003 * r^2 - 1.123 * r^4)
 */
function createBiconcaveRBCGeometry(radius = 0.062, radialSteps = 14, latheSegments = 22) {
  const profilePoints = [];

  // Top surface: from center axis (r = 0) to outer toroidal rim (r = 1)
  for (let i = 0; i <= radialSteps; i++) {
    const theta = (i / radialSteps) * (Math.PI * 0.5);
    const r = Math.sin(theta);
    const sqrtTerm = Math.cos(theta); // sqrt(1 - r^2)
    const r2 = r * r;
    const r4 = r2 * r2;
    const halfThick = 0.5 * sqrtTerm * (0.22 + 2.02 * r2 - 1.12 * r4);
    profilePoints.push(new THREE.Vector2(r * radius, halfThick * radius));
  }

  // Bottom surface: from outer rim (r = 1) back to center axis (r = 0)
  for (let i = radialSteps - 1; i >= 0; i--) {
    const theta = (i / radialSteps) * (Math.PI * 0.5);
    const r = Math.sin(theta);
    const sqrtTerm = Math.cos(theta);
    const r2 = r * r;
    const r4 = r2 * r2;
    const halfThick = -0.5 * sqrtTerm * (0.22 + 2.02 * r2 - 1.12 * r4);
    profilePoints.push(new THREE.Vector2(r * radius, halfThick * radius));
  }

  const geo = new THREE.LatheGeometry(profilePoints, latheSegments);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a hemodynamic biconcave red blood cell (RBC) particle system tracing:
 * 1) Deoxygenated Venous -> Pulmonary Circulation (Deoxyhemoglobin Deep Blue -> Cyan)
 *    SVC / IVC -> Right Atrium -> Tricuspid Valve -> Right Ventricle -> Pulmonary Valve -> Pulmonary Trunk -> L/R Pulmonary Arteries
 * 2) Oxygenated Pulmonary Return -> Systemic & Coronary Circulation (Oxyhemoglobin Crimson -> Scarlet)
 *    L/R Pulmonary Veins -> Left Atrium -> Mitral Valve -> Left Ventricle -> Aortic Valve -> Aorta & Coronary Arteries (RCA, LAD, LCx)
 */
export function createBloodFlowSystem() {
  const group = new THREE.Group();
  group.name = 'BloodFlowSystem';

  const makeCurve = (pts) =>
    new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));

  // Physiological circulation pathways
  const pathways = [
    // 1. Superior Vena Cava -> RA -> Tricuspid -> RV -> Pulmonary Trunk -> Left Pulmonary Artery
    {
      name: 'SVC_to_LPA',
      flowType: 'venous',
      curve: makeCurve([
        [-1.12, 2.95, 0.04],
        [-1.16, 1.95, 0.08],
        [-1.22, 0.95, 0.24],
        [-0.92, 0.18, 0.32],
        [-0.76, -0.78, 0.36],
        [-0.45, 0.35, 0.65],
        [-0.18, 1.32, 0.64],
        [0.12, 2.04, 0.24],
        [0.85, 2.1, 0.06],
        [1.68, 2.04, -0.14]
      ]),
      colorStart: new THREE.Color(0x1d4ed8),
      colorEnd: new THREE.Color(0x38bdf8),
      count: 78,
      speed: 0.27,
      lumenSpread: 0.095,
      scaleMul: 1.0
    },
    // 2. Inferior Vena Cava -> RA -> Tricuspid -> RV -> Pulmonary Trunk -> Right Pulmonary Artery
    {
      name: 'IVC_to_RPA',
      flowType: 'venous',
      curve: makeCurve([
        [-1.12, -2.0, -0.34],
        [-1.16, -0.65, -0.25],
        [-1.2, 0.78, 0.18],
        [-0.92, 0.18, 0.32],
        [-0.72, -0.72, 0.32],
        [-0.38, 0.42, 0.68],
        [-0.18, 1.32, 0.64],
        [0.12, 2.04, 0.24],
        [-0.68, 2.06, 0.02],
        [-1.68, 1.98, -0.18]
      ]),
      colorStart: new THREE.Color(0x2563eb),
      colorEnd: new THREE.Color(0x7dd3fc),
      count: 78,
      speed: 0.26,
      lumenSpread: 0.095,
      scaleMul: 1.0
    },
    // 3. Left Pulmonary Veins -> LA -> Mitral -> LV -> Aortic Valve -> Aortic Arch
    {
      name: 'LPV_to_AortaArch',
      flowType: 'arterial',
      curve: makeCurve([
        [2.05, 1.35, -0.26],
        [1.42, 1.12, -0.26],
        [1.12, 0.92, -0.2],
        [0.88, 0.2, -0.04],
        [0.82, -0.95, 0.08],
        [0.52, -0.25, 0.12],
        [0.26, 0.72, 0.12],
        [0.12, 1.65, 0.16],
        [0.04, 2.38, 0.02],
        [0.26, 2.66, -0.32],
        [0.52, 2.38, -0.68]
      ]),
      colorStart: new THREE.Color(0xfb7185),
      colorEnd: new THREE.Color(0xef4444),
      count: 88,
      speed: 0.31,
      lumenSpread: 0.095,
      scaleMul: 1.0
    },
    // 4. Right Pulmonary Veins -> LA -> Mitral -> LV -> Aorta -> Descending Thoracic Aorta
    {
      name: 'RPV_to_DescendingAorta',
      flowType: 'arterial',
      curve: makeCurve([
        [-1.92, 1.28, -0.52],
        [-0.35, 1.15, -0.56],
        [1.06, 0.95, -0.28],
        [0.88, 0.2, -0.04],
        [0.74, -0.88, 0.04],
        [0.46, -0.18, 0.1],
        [0.26, 0.72, 0.12],
        [0.08, 2.25, 0.06],
        [0.48, 2.45, -0.62],
        [0.48, 1.15, -0.88],
        [0.36, -0.65, -0.9],
        [0.32, -1.95, -0.86]
      ]),
      colorStart: new THREE.Color(0xf43f5e),
      colorEnd: new THREE.Color(0xdc2626),
      count: 92,
      speed: 0.3,
      lumenSpread: 0.095,
      scaleMul: 1.0
    },
    // 5. Coronary Perfusion: Right Coronary Artery (RCA)
    {
      name: 'Coronary_RCA',
      flowType: 'coronary',
      curve: makeCurve([
        [0.12, 0.78, 0.36],
        [-0.65, 0.52, 0.88],
        [-1.38, 0.12, 0.65],
        [-1.42, -0.45, 0.08],
        [-0.82, -0.95, -0.68],
        [-0.08, -1.35, -0.72]
      ]),
      colorStart: new THREE.Color(0xff4d4d),
      colorEnd: new THREE.Color(0xf97316),
      count: 32,
      speed: 0.38,
      lumenSpread: 0.018,
      scaleMul: 0.55
    },
    // 6. Coronary Perfusion: Left Anterior Descending (LAD)
    {
      name: 'Coronary_LAD',
      flowType: 'coronary',
      curve: makeCurve([
        [0.36, 0.78, 0.32],
        [0.18, 0.42, 0.86],
        [0.08, -0.18, 1.06],
        [0.24, -0.88, 1.04],
        [0.56, -1.52, 0.82],
        [0.88, -1.96, 0.48]
      ]),
      colorStart: new THREE.Color(0xff4d4d),
      colorEnd: new THREE.Color(0xf59e0b),
      count: 34,
      speed: 0.4,
      lumenSpread: 0.018,
      scaleMul: 0.55
    },
    // 7. Coronary Perfusion: Left Circumflex (LCx)
    {
      name: 'Coronary_LCx',
      flowType: 'coronary',
      curve: makeCurve([
        [0.36, 0.78, 0.32],
        [0.92, 0.56, 0.58],
        [1.48, 0.35, 0.14],
        [1.52, 0.08, -0.48],
        [1.12, -0.45, -0.88]
      ]),
      colorStart: new THREE.Color(0xff4d4d),
      colorEnd: new THREE.Color(0xfbbf24),
      count: 28,
      speed: 0.36,
      lumenSpread: 0.018,
      scaleMul: 0.55
    }
  ];

  // Subtle translucent hemodynamic streamline filaments
  for (const pw of pathways) {
    if (pw.flowType === 'coronary') continue;
    const linePts = pw.curve.getPoints(72);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
    const lineMat = new THREE.LineBasicMaterial({
      color: pw.colorEnd,
      transparent: true,
      opacity: 0.16
    });
    group.add(new THREE.Line(lineGeo, lineMat));
  }

  // Instanced biconcave erythrocytes (RBCs)
  const totalCount = pathways.reduce((acc, p) => acc + p.count, 0);
  const rbcGeo = createBiconcaveRBCGeometry(0.064, 14, 22);
  const instancedMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.04,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
    emissive: new THREE.Color(0x220810),
    emissiveIntensity: 0.45
  });

  const instancedMesh = new THREE.InstancedMesh(rbcGeo, instancedMat, totalCount);
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  instancedMesh.castShadow = false;
  instancedMesh.receiveShadow = false;

  const particles = [];
  const tempColor = new THREE.Color();
  let idx = 0;

  for (let pIndex = 0; pIndex < pathways.length; pIndex++) {
    const pw = pathways[pIndex];
    for (let i = 0; i < pw.count; i++) {
      const t = i / pw.count;
      const spread = pw.lumenSpread;
      const jitter = new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread
      );
      particles.push({
        index: idx,
        pathway: pw,
        t,
        jitter,
        scale: (0.82 + Math.random() * 0.38) * pw.scaleMul,
        spinAngle: Math.random() * Math.PI * 2,
        spinSpeed: (2.2 + Math.random() * 3.4) * (Math.random() < 0.5 ? 1 : -1),
        wobblePhase: Math.random() * Math.PI * 2
      });

      tempColor.lerpColors(pw.colorStart, pw.colorEnd, t);
      instancedMesh.setColorAt(idx, tempColor);
      idx++;
    }
  }

  if (instancedMesh.instanceColor) {
    instancedMesh.instanceColor.needsUpdate = true;
  }
  group.add(instancedMesh);

  const dummy = new THREE.Object3D();
  const pos = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const upVec = new THREE.Vector3(0, 1, 0);
  const alignQuat = new THREE.Quaternion();
  const tumbleQuat = new THREE.Quaternion();
  const tumbleEuler = new THREE.Euler();

  function update(dt, bpm = 72, cardiacPhase = 0, enabled = true) {
    group.visible = enabled;
    if (!enabled) return;

    // Systolic ejection boost (peaks at phase ~0.27) + diastolic rapid filling wave (peaks at ~0.72)
    const systolicSurge = Math.exp(-Math.pow((cardiacPhase - 0.27) / 0.1, 2));
    const diastolicWave = Math.exp(-Math.pow((cardiacPhase - 0.72) / 0.16, 2));
    const atrialKick = Math.exp(-Math.pow((cardiacPhase - 0.08) / 0.055, 2));
    const bpmScale = bpm / 72;

    for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];
      const pw = pt.pathway;

      // Coronary perfusion peaks in early diastole when aortic root recoils and myocardium relaxes;
      // Ventricular/arterial ejection peaks in systole
      let pulsatileMul = 1.0 + 0.95 * systolicSurge + 0.25 * atrialKick;
      if (pw.flowType === 'coronary') {
        pulsatileMul = 0.75 + 1.15 * diastolicWave + 0.55 * systolicSurge;
      }

      pt.t = (pt.t + dt * pw.speed * bpmScale * pulsatileMul) % 1;
      pt.spinAngle += dt * pt.spinSpeed * pulsatileMul;

      pw.curve.getPointAt(pt.t, pos);
      pw.curve.getTangentAt(pt.t, tangent);
      pos.add(pt.jitter);

      dummy.position.copy(pos);

      // Align biconcave disc normal along local flow tangent, then apply shear tumbling
      alignQuat.setFromUnitVectors(upVec, tangent);
      tumbleEuler.set(
        Math.sin(pt.spinAngle) * 0.85,
        pt.spinAngle * 0.7,
        Math.cos(pt.spinAngle + pt.wobblePhase) * 0.65
      );
      tumbleQuat.setFromEuler(tumbleEuler);
      dummy.quaternion.copy(alignQuat).multiply(tumbleQuat);

      // Subtle shear elongation during peak systolic acceleration
      const s = pt.scale * (0.94 + 0.16 * systolicSurge);
      dummy.scale.set(s, s * 0.92, s * (1.0 + 0.14 * systolicSurge));
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(pt.index, dummy.matrix);

      // Oxygenation & pulsatile luminance modulation
      tempColor.lerpColors(pw.colorStart, pw.colorEnd, pt.t);
      if (systolicSurge > 0.1) {
        tempColor.multiplyScalar(1.0 + 0.22 * systolicSurge);
      }
      instancedMesh.setColorAt(pt.index, tempColor);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  return {
    group,
    update
  };
}
