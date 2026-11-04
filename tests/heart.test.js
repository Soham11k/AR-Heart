import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import fs from 'node:fs';
import path from 'node:path';
import {
  HEART_PARTS,
  HEART_PARTS_BY_ID,
  createHeartModel,
  resolvePartMetadataFromNode,
  updateHeartCycle
} from '../src/heart.js';
import {
  QUALITY_TIERS,
  createAdaptiveFrameMonitor,
  detectInitialQualityTier,
  getQualityConfig
} from '../src/quality.js';
import { createSliceSystem } from '../src/sliceSystem.js';
import { createHeartSoundEngine } from '../src/audio.js';
import {
  HEART_LAYERS_CATALOG,
  createHeartLayersAssembly,
  updateHeartLayersAssembly
} from '../src/heartLayers.js';
import { INSIDE_HEART_CALLOUTS } from '../src/callouts.js';

describe('Anatomical Catalog & HuBMAP Asset Manifest', () => {
  it('defines all 26 structures with ontology IDs, synonyms, and slice presets', () => {
    expect(HEART_PARTS.length).toBe(26);
    for (const part of HEART_PARTS) {
      expect(part.id).toBeTruthy();
      expect(part.name).toBeTruthy();
      expect(part.latin).toBeTruthy();
      expect(part.ontologyId).toBeTruthy();
      expect(part.recommendedSlicePreset).toBeTruthy();
      expect(Array.isArray(part.synonyms)).toBe(true);
      expect(Array.isArray(part.relatedIds)).toBe(true);
    }
  });

  it('includes bundled high, medium, and low GLB assets and a 26-part manifest', () => {
    const modelsDir = path.resolve(import.meta.dirname, '..', 'public', 'models');
    expect(fs.existsSync(path.join(modelsDir, 'heart-high.glb'))).toBe(true);
    expect(fs.existsSync(path.join(modelsDir, 'heart-medium.glb'))).toBe(true);
    expect(fs.existsSync(path.join(modelsDir, 'heart-low.glb'))).toBe(true);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(modelsDir, 'heart-manifest.json'), 'utf8')
    );
    expect(manifest.partCount).toBe(26);
    for (const part of HEART_PARTS) {
      expect(manifest.parts[part.id]).toBeDefined();
      expect(manifest.parts[part.id].center.length).toBe(3);
    }
  });

  it('maps HuBMAP node names and custom extras to HEART_PARTS accurately', () => {
    const mockNode = {
      name: 'VH_M_heart_left_ventricle',
      userData: {}
    };
    const resolved = resolvePartMetadataFromNode(mockNode);
    expect(resolved).not.toBeNull();
    expect(resolved.partId).toBe('left_ventricle');
    expect(resolved.animRole).toBe('ventricle');
    expect(resolved.tissueKind).toBe('myocardium');
  });
});

describe('Adaptive Quality Tier Selection & Frame Governor', () => {
  it('selects low tier for mobile viewports and low-memory devices', () => {
    expect(detectInitialQualityTier({ width: 390, deviceMemory: 4 })).toBe('low');
    expect(detectInitialQualityTier({ width: 1024, deviceMemory: 6 })).toBe('medium');
    expect(
      detectInitialQualityTier({ width: 1920, deviceMemory: 16, hardwareConcurrency: 10 })
    ).toBe('high');
  });

  it('steps down quality tier automatically after sustained slow frames', () => {
    let changedTo = null;
    const monitor = createAdaptiveFrameMonitor({
      initialTier: 'high',
      onTierChange: (t) => {
        changedTo = t;
      }
    });
    // Warmup 3.2s at 60fps
    for (let i = 0; i < 200; i++) monitor.recordFrame(0.016);
    expect(monitor.getTier()).toBe('high');
    // Sustained 45ms frames (~22fps)
    for (let i = 0; i < 60; i++) monitor.recordFrame(0.045);
    expect(monitor.getTier()).toBe('medium');
    expect(changedTo).toBe('medium');
    expect(getQualityConfig('low').bloom).toBe(false);
    expect(QUALITY_TIERS.high.bloom).toBe(true);
  });
});

describe('Cardiac Cycle Kinematics, S1/S2 Sound Triggers & Slice Bounds', () => {
  it('animates cardiac cycle phases and focus isolation modes', () => {
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 12);
    const model = createHeartModel(plane, getQualityConfig('low'));
    expect(model.partMeshes.size).toBe(26);

    const res = updateHeartCycle(model, 0.22, 72, true, 0, 'left_ventricle', null, {
      focusMode: 'isolate'
    });
    expect(res.phaseLabel).toBe('VENTRICULAR SYSTOLE');
    expect(model.partMeshes.get('left_ventricle').group.visible).toBe(true);
    expect(model.partMeshes.get('right_atrium').group.visible).toBe(false);
  });

  it('triggers S1 at ventricular systole onset and S2 at diastole onset', () => {
    const sound = createHeartSoundEngine();
    sound.setEnabled(false); // Test envelope logic without browser AudioContext

    sound.update(0.016, 0.05, 72, true);
    const s1 = sound.update(0.016, 0.16, 72, true);
    expect(s1.activeSound).toBe('S1 (LUB)');

    // Advance 0.2s of systolic ejection before S2 onset at phase 0.45
    sound.update(0.2, 0.35, 72, true);
    const s2 = sound.update(0.016, 0.45, 72, true);
    expect(s2.activeSound).toBe('S2 (DUB)');
  });

  it('drives clipping plane across model bounds and detects exposed structures', () => {
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 12);
    const model = createHeartModel(plane, getQualityConfig('low'));
    const sliceSys = createSliceSystem({ clippingPlane: plane });
    sliceSys.bindHeartModel(model);

    const st = sliceSys.applyPreset('four-chamber');
    expect(st.enabled).toBe(true);
    expect(st.axis).toBe('z');
    expect(st.percent).toBe(52);

    const exposed = sliceSys.getExposedStructures();
    expect(exposed.length).toBeGreaterThan(4);
    expect(exposed.some((m) => m.id === 'left_ventricle' || m.id === 'right_ventricle')).toBe(
      true
    );

    const resetSt = sliceSys.reset();
    expect(resetSt.enabled).toBe(false);
    expect(plane.constant).toBeGreaterThan(8);
  });

  it('provides all 13 Inside-of-Heart leader callouts and 9 Exploded 3D Heart Layers', () => {
    expect(INSIDE_HEART_CALLOUTS.length).toBe(13);
    for (const c of INSIDE_HEART_CALLOUTS) {
      expect(HEART_PARTS_BY_ID[c.partId]).toBeDefined();
      expect(c.anchor.length).toBe(3);
    }

    expect(HEART_LAYERS_CATALOG.length).toBe(9);
    const layersAsm = createHeartLayersAssembly();
    expect(layersAsm.layerRecords.size).toBe(9);
    layersAsm.root.visible = true;
    updateHeartLayersAssembly(layersAsm, 0.5, 0.8, 1.0, 'layer_myocardium', null, 'dim');
    expect(layersAsm.layerRecords.get('layer_fibrous_pericardium').group.position.y).toBeGreaterThan(
      layersAsm.layerRecords.get('layer_endocardium').group.position.y
    );
  });
});
