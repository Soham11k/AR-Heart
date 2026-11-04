import * as THREE from 'three';

/**
 * Generates an anatomically accurate biconcave discoid Red Blood Cell (erythrocyte)
 * geometry using the Evans & Fung (1972) physiological profile:
 *   y(r) = 0.5 * R * sqrt(1 - r^2) * (0.207 + 2.003 * r^2 - 1.123 * r^4)
 */
export function createBiconcaveRBCGeometry(
  radius = 0.058,
  radialSteps = 12,
  latheSegments = 20
) {
  const profilePoints = [];

  for (let i = 0; i <= radialSteps; i++) {
    const theta = (i / radialSteps) * (Math.PI * 0.5);
    const r = Math.sin(theta);
    const sqrtTerm = Math.cos(theta);
    const r2 = r * r;
    const r4 = r2 * r2;
    const halfThick = 0.5 * sqrtTerm * (0.22 + 2.02 * r2 - 1.12 * r4);
    profilePoints.push(new THREE.Vector2(r * radius, halfThick * radius));
  }

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
 * Default pathways aligned to the normalized HuBMAP Visible Human Male heart & vasculature.
 */
export const DEFAULT_FLOW_CONTROL_POINTS = {
  SVC_to_LPA: [
    [-1.26, 2.35, -0.34],
    [-1.2576, 1.5199, -0.3613],
    [-1.0163, -0.0328, 0.0713],
    [-0.6598, -0.6617, 0.4106],
    [0.02, -0.82, 0.92],
    [0.0348, -0.2937, 0.7655],
    [0.0217, 0.7949, 0.3084],
    [-0.0321, 1.2686, -0.2014],
    [0.5708, 1.264, -1.1014],
    [1.18, 1.26, -0.62]
  ],
  IVC_to_RPA: [
    [-1.12, -2.35, -0.82],
    [-1.1043, -1.6003, -0.8493],
    [-1.0163, -0.0328, 0.0713],
    [-0.6598, -0.6617, 0.4106],
    [-0.08, -0.95, 0.86],
    [0.0348, -0.2937, 0.7655],
    [0.0217, 0.7949, 0.3084],
    [-0.0321, 1.2686, -0.2014],
    [-0.7709, 1.2802, -0.706],
    [-1.18, 1.28, -0.52]
  ],
  LPV_to_AortaArch: [
    [1.08, 0.92, -0.88],
    [0.513, 0.781, -1.101],
    [-0.3639, 0.319, -0.7062],
    [0.1852, -0.1479, -0.6093],
    [0.88, -0.92, 0.34],
    [0.7866, -0.531, 0.284],
    [-0.2905, 0.5166, -0.1008],
    [-0.42, 1.12, -0.1],
    [-0.36, 2.04, -0.78],
    [0.14, 2.75, -0.62]
  ],
  RPV_to_DescendingAorta: [
    [-1.38, 0.32, -1.18],
    [-1.2573, 0.3001, -1.0787],
    [-0.3639, 0.319, -0.7062],
    [0.1852, -0.1479, -0.6093],
    [0.78, -0.86, 0.24],
    [0.7866, -0.531, 0.284],
    [-0.2905, 0.5166, -0.1008],
    [-0.36, 2.04, -0.78],
    [-0.1, 0.85, -1.68],
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
};

/**
 * Creates a hemodynamic biconcave red blood cell (RBC) particle system with:
 * - Dynamic pathway re-anchoring from loaded model manifest (`rebindPathways`)
 * - Adaptive quality scaling (`setQualityTier`: high / medium / low active instance count)
 * - Clipping plane integration so cross-sections clip RBCs cleanly
 */
export function createBloodFlowSystem(clippingPlane, qualityConfig = {}) {
  const group = new THREE.Group();
  group.name = 'BloodFlowSystem';

  const makeCurve = (pts) =>
    new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));

  const pathwaySpecs = [
    {
      name: 'SVC_to_LPA',
      flowType: 'venous',
      colorStart: new THREE.Color(0x1d4ed8),
      colorEnd: new THREE.Color(0x38bdf8),
      baseCount: 76,
      speed: 0.27,
      lumenSpread: 0.085,
      scaleMul: 1.0
    },
    {
      name: 'IVC_to_RPA',
      flowType: 'venous',
      colorStart: new THREE.Color(0x2563eb),
      colorEnd: new THREE.Color(0x7dd3fc),
      baseCount: 76,
      speed: 0.26,
      lumenSpread: 0.085,
      scaleMul: 1.0
    },
    {
      name: 'LPV_to_AortaArch',
      flowType: 'arterial',
      colorStart: new THREE.Color(0xfb7185),
      colorEnd: new THREE.Color(0xef4444),
      baseCount: 86,
      speed: 0.31,
      lumenSpread: 0.085,
      scaleMul: 1.0
    },
    {
      name: 'RPV_to_DescendingAorta',
      flowType: 'arterial',
      colorStart: new THREE.Color(0xf43f5e),
      colorEnd: new THREE.Color(0xdc2626),
      baseCount: 90,
      speed: 0.3,
      lumenSpread: 0.085,
      scaleMul: 1.0
    },
    {
      name: 'Coronary_RCA',
      flowType: 'coronary',
      colorStart: new THREE.Color(0xff4d4d),
      colorEnd: new THREE.Color(0xf97316),
      baseCount: 32,
      speed: 0.38,
      lumenSpread: 0.016,
      scaleMul: 0.55
    },
    {
      name: 'Coronary_LAD',
      flowType: 'coronary',
      colorStart: new THREE.Color(0xff4d4d),
      colorEnd: new THREE.Color(0xf59e0b),
      baseCount: 34,
      speed: 0.4,
      lumenSpread: 0.016,
      scaleMul: 0.55
    },
    {
      name: 'Coronary_LCx',
      flowType: 'coronary',
      colorStart: new THREE.Color(0xff4d4d),
      colorEnd: new THREE.Color(0xfbbf24),
      baseCount: 28,
      speed: 0.36,
      lumenSpread: 0.016,
      scaleMul: 0.55
    }
  ];

  const pathways = pathwaySpecs.map((spec) => ({
    ...spec,
    curve: makeCurve(DEFAULT_FLOW_CONTROL_POINTS[spec.name])
  }));

  const linesGroup = new THREE.Group();
  linesGroup.name = 'FlowStreamlines';
  group.add(linesGroup);

  function rebuildStreamlines() {
    for (const child of [...linesGroup.children]) {
      child.geometry.dispose();
      child.material.dispose();
    }
    linesGroup.clear();

    for (const pw of pathways) {
      if (pw.flowType === 'coronary') continue;
      const linePts = pw.curve.getPoints(72);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
      const lineMat = new THREE.LineBasicMaterial({
        color: pw.colorEnd,
        transparent: true,
        opacity: 0.16,
        clippingPlanes: clippingPlane ? [clippingPlane] : []
      });
      linesGroup.add(new THREE.Line(lineGeo, lineMat));
    }
  }

  rebuildStreamlines();

  const maxTotalCount = pathways.reduce((acc, p) => acc + p.baseCount, 0);
  const rbcGeo = createBiconcaveRBCGeometry(0.058, 12, 20);
  const instancedMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.04,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
    emissive: new THREE.Color(0x220810),
    emissiveIntensity: 0.22,
    clippingPlanes: clippingPlane ? [clippingPlane] : []
  });

  const instancedMesh = new THREE.InstancedMesh(rbcGeo, instancedMat, maxTotalCount);
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  instancedMesh.castShadow = false;
  instancedMesh.receiveShadow = false;

  const particles = [];
  const tempColor = new THREE.Color();

  // Interleave particles across pathways so reducing `instancedMesh.count` on lower tiers
  // preserves proportional density across all 7 venous, arterial, and coronary pathways!
  const maxPerPath = Math.max(...pathways.map((p) => p.baseCount));
  let idx = 0;
  for (let step = 0; step < maxPerPath; step++) {
    for (const pw of pathways) {
      if (step >= pw.baseCount) continue;
      const t = step / pw.baseCount;
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

  let activeParticleCount = maxTotalCount;

  function setQualityTier(tier = 'high') {
    const ratio = tier === 'low' ? 0.32 : tier === 'medium' ? 0.62 : 1.0;
    activeParticleCount = Math.max(48, Math.floor(maxTotalCount * ratio));
    instancedMesh.count = activeParticleCount;
    linesGroup.visible = tier !== 'low';
  }

  if (qualityConfig?.tier) {
    setQualityTier(qualityConfig.tier);
  }

  function rebindPathways(flowPathwaysMap) {
    if (!flowPathwaysMap) return;
    for (const pw of pathways) {
      const pts = flowPathwaysMap[pw.name];
      if (Array.isArray(pts) && pts.length >= 2) {
        pw.curve = makeCurve(pts);
      }
    }
    rebuildStreamlines();
  }

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

    const systolicSurge = Math.exp(-Math.pow((cardiacPhase - 0.27) / 0.1, 2));
    const diastolicWave = Math.exp(-Math.pow((cardiacPhase - 0.72) / 0.16, 2));
    const atrialKick = Math.exp(-Math.pow((cardiacPhase - 0.08) / 0.055, 2));
    const bpmScale = bpm / 72;

    for (let i = 0; i < activeParticleCount; i++) {
      const pt = particles[i];
      const pw = pt.pathway;

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

      alignQuat.setFromUnitVectors(upVec, tangent);
      tumbleEuler.set(
        Math.sin(pt.spinAngle) * 0.85,
        pt.spinAngle * 0.7,
        Math.cos(pt.spinAngle + pt.wobblePhase) * 0.65
      );
      tumbleQuat.setFromEuler(tumbleEuler);
      dummy.quaternion.copy(alignQuat).multiply(tumbleQuat);

      const s = pt.scale * (0.94 + 0.16 * systolicSurge);
      dummy.scale.set(s, s * 0.92, s * (1.0 + 0.14 * systolicSurge));
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(pt.index, dummy.matrix);

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
    update,
    rebindPathways,
    setQualityTier,
    getActiveCount: () => activeParticleCount
  };
}
