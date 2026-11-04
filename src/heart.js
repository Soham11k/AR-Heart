import { HEART_PARTS, HEART_PARTS_BY_ID } from './heartCatalog.js';
import { createProceduralHeartModel } from './heartProcedural.js';
import { loadAnatomicalHeartModel, resolvePartMetadataFromNode } from './heartLoader.js';

export {
  HEART_PARTS,
  HEART_PARTS_BY_ID,
  createProceduralHeartModel,
  loadAnatomicalHeartModel,
  resolvePartMetadataFromNode
};

/**
 * Synchronous factory preserved for compatibility and immediate procedural fallback.
 */
export function createHeartModel(clippingPlane, qualityConfig = {}) {
  return createProceduralHeartModel(clippingPlane, qualityConfig);
}

/**
 * Updates physiological heartbeat deformation, valve opening/closing, explode state,
 * and selection focus/isolation styling.
 *
 * @param {object} heartModel
 * @param {number} elapsedSeconds
 * @param {number} bpm
 * @param {boolean} beatEnabled
 * @param {number} explodeFactor
 * @param {string|null} selectedPartId
 * @param {string|null} hoveredPartId
 * @param {object} [options]
 * @param {'dim'|'isolate'|'context'} [options.focusMode='dim']
 * @param {boolean} [options.reducedMotion=false]
 */
export function updateHeartCycle(
  heartModel,
  elapsedSeconds,
  bpm,
  beatEnabled,
  explodeFactor,
  selectedPartId,
  hoveredPartId,
  options = {}
) {
  const focusMode = options.focusMode || 'dim';
  const reducedMotion = Boolean(options.reducedMotion);

  const clampedBpm = Math.max(40, Math.min(180, bpm));
  const period = 60 / clampedBpm;
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

  const motionMul = beatEnabled ? (reducedMotion ? 0.35 : 1.0) : 0;

  const atrialContract = motionMul * Math.exp(-Math.pow((phase - 0.08) / 0.055, 2));
  const ventricularContract = motionMul * Math.exp(-Math.pow((phase - 0.27) / 0.09, 2));
  const arterialPulse = motionMul * Math.exp(-Math.pow((phase - 0.34) / 0.11, 2));

  const damp = 1 - explodeFactor * 0.85;
  if (heartModel.cardiacUniforms) {
    const uniforms = heartModel.cardiacUniforms;
    uniforms.uAtrial.value = atrialContract * damp;
    uniforms.uVentricular.value = ventricularContract * damp;
    uniforms.uTorsion.value =
      ventricularContract * 0.085 * damp - atrialContract * 0.025 * damp;
    uniforms.uShorten.value = ventricularContract * damp;
    uniforms.uSystolePulse.value = ventricularContract;
  }

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
    const pivot = rec.center;
    g.position.set(
      rec.basePos.x + ex.x * explodeFactor * 0.85,
      rec.basePos.y + ex.y * explodeFactor * 0.85,
      rec.basePos.z + ex.z * explodeFactor * 0.85
    );

    // 2. Role-specific physiological motion (around part centroid if offset is at origin)
    let sx = 1,
      sy = 1,
      sz = 1;
    if (rec.animRole === 'artery') {
      const expand = 1 + 0.045 * arterialPulse;
      sx = expand;
      sy = 1 + 0.015 * arterialPulse;
      sz = expand;
    } else if (rec.animRole === 'vein') {
      const expand = 1 + 0.03 * atrialContract;
      sx = expand;
      sz = expand;
    } else if (rec.animRole === 'av_valve') {
      const openAmt = 1 - 0.14 * ventricularContract;
      sx = openAmt;
      sz = openAmt;
    } else if (rec.animRole === 'sl_valve') {
      const openAmt = 0.92 + 0.14 * ventricularContract;
      sx = openAmt;
      sz = openAmt;
    }

    g.scale.set(sx, sy, sz);
    if (pivot && (sx !== 1 || sy !== 1 || sz !== 1) && rec.basePos.lengthSq() < 0.001) {
      g.position.x += pivot.x * (1 - sx);
      g.position.y += pivot.y * (1 - sy);
      g.position.z += pivot.z * (1 - sz);
    }

    // Drive morph targets if present on meshes
    for (const mesh of rec.meshes) {
      if (mesh.morphTargetInfluences && mesh.morphTargetInfluences.length > 0) {
        mesh.morphTargetInfluences[0] =
          rec.animRole === 'atrium' ? atrialContract : ventricularContract;
      }
    }

    // 3. Visual highlighting & focus modes ('dim', 'isolate', 'context')
    const isSelected = selectedPartId === id;
    const isHovered = hoveredPartId === id;
    const mats = rec.materials || [rec.material];

    if (selectedPartId && focusMode === 'isolate' && !isSelected) {
      g.visible = false;
      continue;
    }
    g.visible = true;

    for (const mat of mats) {
      if (isSelected) {
        const pulseGlow = reducedMotion ? 0.5 : 0.52 + 0.22 * Math.sin(elapsedSeconds * 6);
        mat.emissive.copy(rec.baseColor).multiplyScalar(pulseGlow);
        mat.opacity = 1.0;
        mat.transparent = false;
        mat.depthWrite = true;
      } else if (isHovered) {
        mat.emissive.copy(rec.baseColor).multiplyScalar(0.35);
        mat.opacity = 1.0;
        mat.transparent = false;
        mat.depthWrite = true;
      } else if (selectedPartId && focusMode === 'dim') {
        mat.emissive.setRGB(0, 0, 0);
        mat.transparent = true;
        mat.opacity = 0.34;
        mat.depthWrite = false;
      } else {
        mat.emissive.setRGB(0, 0, 0);
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.depthWrite = true;
      }
    }
  }

  return {
    phaseLabel,
    ecgValue,
    phase,
    ventricularContract,
    atrialContract,
    arterialPulse
  };
}
