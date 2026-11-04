import * as THREE from 'three';
import { attachSubsurfaceShader } from './textures.js';

export function createCardiacUniforms(bounds) {
  const min = bounds?.min ? new THREE.Vector3(...bounds.min) : new THREE.Vector3(-1.8, -2.46, -2.12);
  const max = bounds?.max ? new THREE.Vector3(...bounds.max) : new THREE.Vector3(1.95, 3.09, 1.75);
  const center = min.clone().add(max).multiplyScalar(0.5);

  return {
    uAtrial: { value: 0 },
    uVentricular: { value: 0 },
    uTorsion: { value: 0 },
    uShorten: { value: 0 },
    uSystolePulse: { value: 0 },
    uHeartMin: { value: min },
    uHeartMax: { value: max },
    uHeartCenter: { value: center }
  };
}

export function updateCardiacUniformsFromBounds(cardiacUniforms, bounds) {
  if (!cardiacUniforms || !bounds) return;
  cardiacUniforms.uHeartMin.value.set(...bounds.min);
  cardiacUniforms.uHeartMax.value.set(...bounds.max);
  cardiacUniforms.uHeartCenter.value
    .copy(cardiacUniforms.uHeartMin.value)
    .add(cardiacUniforms.uHeartMax.value)
    .multiplyScalar(0.5);
}

export function kindForRole(animRole) {
  if (
    animRole === 'atrium' ||
    animRole === 'ventricle' ||
    animRole === 'apex' ||
    animRole === 'septum'
  ) {
    return 'myocardium';
  }
  if (animRole === 'av_valve' || animRole === 'sl_valve') return 'valve';
  if (animRole === 'chordae') return 'cord';
  if (animRole === 'vein') return 'vein';
  return 'artery';
}

/**
 * Creates a layered surgical PBR material with normal/wetness textures,
 * subsurface scattering, and shared torsional heartbeat uniforms.
 */
export function makeTissueMaterial(
  kind,
  meta,
  animRole,
  textures,
  clipPlanes,
  cardiacUniforms,
  qualityConfig = {}
) {
  const enableSss = qualityConfig.enableSss !== false;
  const base = {
    clippingPlanes: clipPlanes,
    clipShadows: true
  };

  let mat;
  let sssHex = 0xff2418;
  let sssIntensity = 0.5;
  let muscle = 1;

  if (kind === 'myocardium') {
    const color = new THREE.Color(0xc85458).lerp(new THREE.Color(meta.color), 0.14);
    mat = new THREE.MeshPhysicalMaterial({
      ...base,
      color,
      map: textures.myocardiumAlbedo,
      normalMap: textures.myocardiumNormal,
      normalScale: new THREE.Vector2(0.38, 0.38),
      roughnessMap: textures.myocardiumRoughness,
      roughness: 0.72,
      metalness: 0.01,
      clearcoat: 0.45,
      clearcoatRoughness: 0.24,
      sheen: 0.35,
      sheenColor: new THREE.Color(0xff887a),
      sheenRoughness: 0.55,
      ior: 1.4,
      envMapIntensity: 0.95,
      side: THREE.DoubleSide
    });
    sssHex = 0xff3b2f;
    sssIntensity = 0.44;
  } else if (kind === 'trabecula') {
    mat = new THREE.MeshPhysicalMaterial({
      ...base,
      color: new THREE.Color(0xb8464c),
      normalMap: textures.endocardiumNormal,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.34,
      metalness: 0.01,
      clearcoat: 0.62,
      clearcoatRoughness: 0.16,
      sheen: 0.3,
      sheenColor: new THREE.Color(0xff7a7e),
      sheenRoughness: 0.45,
      envMapIntensity: 0.95,
      side: THREE.DoubleSide
    });
    sssHex = 0xff343c;
    sssIntensity = 0.38;
  } else if (kind === 'endocardium') {
    mat = new THREE.MeshPhysicalMaterial({
      ...base,
      color: new THREE.Color(0xd87c7c),
      normalMap: textures.endocardiumNormal,
      normalScale: new THREE.Vector2(0.75, 0.75),
      roughness: 0.28,
      metalness: 0.01,
      clearcoat: 0.68,
      clearcoatRoughness: 0.14,
      sheen: 0.28,
      sheenColor: new THREE.Color(0xff9c9c),
      sheenRoughness: 0.4,
      envMapIntensity: 0.95,
      side: THREE.BackSide
    });
    sssHex = 0xff4c52;
    sssIntensity = 0.32;
  } else if (kind === 'fat') {
    mat = new THREE.MeshPhysicalMaterial({
      ...base,
      color: new THREE.Color(0xf6d7a8),
      map: textures.adiposeAlbedo,
      normalMap: textures.adiposeNormal,
      normalScale: new THREE.Vector2(0.65, 0.65),
      roughness: 0.48,
      metalness: 0.0,
      clearcoat: 0.28,
      clearcoatRoughness: 0.38,
      sheen: 0.22,
      sheenColor: new THREE.Color(0xffd7a4),
      sheenRoughness: 0.7,
      envMapIntensity: 0.7,
      side: THREE.DoubleSide
    });
    sssHex = 0xffb06a;
    sssIntensity = 0.2;
  } else if (kind === 'valve' || kind === 'cord') {
    mat = new THREE.MeshPhysicalMaterial({
      ...base,
      color:
        kind === 'cord'
          ? new THREE.Color(0xfbf6ec)
          : new THREE.Color(0xf5ead6).lerp(new THREE.Color(meta.color), 0.12),
      normalMap: textures.vesselNormal,
      normalScale: new THREE.Vector2(0.28, 0.28),
      roughness: kind === 'cord' ? 0.32 : 0.24,
      metalness: 0.01,
      clearcoat: 0.65,
      clearcoatRoughness: 0.18,
      envMapIntensity: 0.9,
      side: THREE.DoubleSide
    });
    sssHex = 0xffe4c4;
    sssIntensity = 0.18;
    muscle = 1;
  } else {
    const venous = kind === 'vein';
    const atlasBase = venous ? new THREE.Color(0x6e88ad) : new THREE.Color(0xd26466);
    const color = atlasBase.lerp(new THREE.Color(meta.color), 0.32);
    mat = new THREE.MeshPhysicalMaterial({
      ...base,
      color,
      normalMap: textures.vesselNormal,
      normalScale: new THREE.Vector2(0.35, 0.45),
      roughness: 0.36,
      metalness: 0.02,
      clearcoat: 0.58,
      clearcoatRoughness: 0.18,
      sheen: 0.2,
      sheenColor: color.clone(),
      sheenRoughness: 0.5,
      envMapIntensity: 0.95,
      side: THREE.DoubleSide
    });
    sssHex = venous ? 0x3b6ba5 : 0xff3840;
    sssIntensity = venous ? 0.16 : 0.24;
    muscle = animRole === 'coronary' ? 1 : 0.35;
  }

  attachSubsurfaceShader(mat, sssHex, sssIntensity, cardiacUniforms, muscle, enableSss);
  mat.userData.tissueKind = kind;
  mat.userData.partId = meta.id;
  return mat;
}
