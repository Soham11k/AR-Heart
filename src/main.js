import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {
  HEART_PARTS,
  HEART_PARTS_BY_ID,
  createHeartModel,
  loadAnatomicalHeartModel,
  updateHeartCycle
} from './heart.js';
import {
  HEART_LAYERS_CATALOG,
  HEART_LAYERS_BY_ID,
  createHeartLayersAssembly,
  updateHeartLayersAssembly
} from './heartLayers.js';
import { createCalloutOverlay } from './callouts.js';
import { createBloodFlowSystem } from './flow.js';
import { createGestureController } from './gestures.js';
import { createSurgicalEnvironment } from './textures.js';
import { createHeartSoundEngine } from './audio.js';
import { createSliceSystem } from './sliceSystem.js';
import {
  createAdaptiveFrameMonitor,
  detectInitialQualityTier,
  getQualityConfig
} from './quality.js';

// ============================================================================
// 1. ADAPTIVE QUALITY TIER & RENDERER SETUP
// ============================================================================
const urlParams = new URLSearchParams(window.location.search);
const initialTier = detectInitialQualityTier({
  override: urlParams.get('quality') || localStorage.getItem('heart_quality_tier')
});
let qualityConfig = getQualityConfig(initialTier);

const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
let prefersReducedMotion = reducedMotionMedia.matches;
reducedMotionMedia.addEventListener?.('change', (e) => {
  prefersReducedMotion = e.matches;
});

const canvas = document.getElementById('heart-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: qualityConfig.tier !== 'low',
  alpha: false,
  stencil: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, qualityConfig.maxPixelRatio));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = qualityConfig.shadows;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a2622);
scene.environment = createSurgicalEnvironment(renderer);
scene.environmentIntensity = 1.1;

const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
const DEFAULT_CAM_POS = new THREE.Vector3(0.08, 0.22, 8.1);
const DEFAULT_TARGET = new THREE.Vector3(0, 0.08, 0);
camera.position.copy(DEFAULT_CAM_POS);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(DEFAULT_TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = true;
controls.screenSpacePanning = true;
controls.minDistance = 2.8;
controls.maxDistance = 16.0;
controls.maxPolarAngle = Math.PI * 0.88;
controls.minPolarAngle = Math.PI * 0.12;

// Studio / Atlas Lighting
const ambientLight = new THREE.AmbientLight(0xfff6f2, 0.48);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xfff6f0, 2.5);
keyLight.position.set(5.2, 7.2, 6.8);
keyLight.castShadow = qualityConfig.shadows;
keyLight.shadow.mapSize.set(qualityConfig.shadowMapSize, qualityConfig.shadowMapSize);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xeae4dc, 0.72);
fillLight.position.set(-5.8, 2.4, 4.5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xff9aa4, 0.68);
rimLight.position.set(0.5, -5.2, -5.5);
scene.add(rimLight);

const floorGrid = new THREE.PolarGridHelper(3.4, 12, 6, 64, 0x463f38, 0x38322c);
floorGrid.position.y = -2.85;
floorGrid.material.transparent = true;
floorGrid.material.opacity = 0.26;
scene.add(floorGrid);

// ============================================================================
// 2. CROSS-SECTION SLICE SYSTEM, HEART MODEL, 9-LAYER STACK & RBC FLOW
// ============================================================================
const clippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 12.0);
const sliceSystem = createSliceSystem({ clippingPlane });
sliceSystem.setSlice({ showPlane: false });
scene.add(sliceSystem.root);

let heartModel = createHeartModel(clippingPlane, qualityConfig);
scene.add(heartModel.root);
sliceSystem.bindHeartModel(heartModel);

const layersAssembly = createHeartLayersAssembly(heartModel.textures);
scene.add(layersAssembly.root);

const bloodFlow = createBloodFlowSystem(clippingPlane, qualityConfig);
scene.add(bloodFlow.group);

const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  type: THREE.HalfFloatType,
  format: THREE.RGBAFormat,
  stencilBuffer: true,
  depthBuffer: true
});
const composer = new EffectComposer(renderer, renderTarget);
composer.setPixelRatio(renderer.getPixelRatio());
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  qualityConfig.bloomStrength,
  0.36,
  0.94
);
bloomPass.enabled = qualityConfig.bloom;
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

const heartSounds = createHeartSoundEngine();

// ============================================================================
// 3. APPLICATION STATE & UI REFERENCES
// ============================================================================
let atlasMode = 'inside'; // 'inside' | 'layers' | 'exterior'
let selectedPartId = null;
let hoveredPartId = null;
let activeCategory = 'All';
let searchQuery = '';
let activeInspectorTab = 'overview';
let focusMode = 'dim';
let bpm = 72;
let beatEnabled = true;
let soundEnabled = true;
let flowEnabled = true;
let explodeTarget = 0;
let explodeCurrent = 0;
let layerSpread = 0.85; // 85% spread in Heart Layers (1-9) view

const desiredCamTarget = DEFAULT_TARGET.clone();

const bootOverlayEl = document.getElementById('boot-overlay');
const bootProgressBarEl = document.getElementById('boot-progress-bar');
const bootStatusTextEl = document.getElementById('boot-status-text');
const onboardingBannerEl = document.getElementById('onboarding-banner');
const btnDismissOnboarding = document.getElementById('btn-dismiss-onboarding');

const atlasModeGroupEl = document.getElementById('atlas-mode-group');
const btnToggleLabels = document.getElementById('btn-toggle-labels');

const partsListEl = document.getElementById('parts-list');
const partCountBadge = document.getElementById('part-count-badge');
const partSearchEl = document.getElementById('part-search');
const btnClearSearch = document.getElementById('btn-clear-search');
const categoryTabsEl = document.getElementById('category-tabs');

const infoCategoryEl = document.getElementById('info-category');
const infoOxygenEl = document.getElementById('info-oxygen');
const infoTitleEl = document.getElementById('info-title');
const infoLatinEl = document.getElementById('info-latin');
const infoOntologyEl = document.getElementById('info-ontology');
const infoDescEl = document.getElementById('info-description');
const infoPathwayEl = document.getElementById('info-pathway');
const infoRoleEl = document.getElementById('info-role');
const inspectorTabsEl = document.getElementById('inspector-tabs');
const focusModeGroupEl = document.getElementById('focus-mode-group');
const btnSliceSelected = document.getElementById('btn-slice-selected');
const relatedPartsSectionEl = document.getElementById('related-parts-section');
const relatedPartsRowEl = document.getElementById('related-parts-row');

const sliceSliderLabelEl = document.getElementById('slice-slider-label');
const sliceSlider = document.getElementById('slice-slider');
const sliceValueEl = document.getElementById('slice-value');
const sliceAxisGroup = document.getElementById('slice-axis-group');
const slicePresetsGridEl = document.getElementById('slice-presets-grid');
const sliceAnatomicalLabelEl = document.getElementById('slice-anatomical-label');
const sliceExposedCountEl = document.getElementById('slice-exposed-count');
const btnToggleCaps = document.getElementById('btn-toggle-caps');
const btnTogglePlane = document.getElementById('btn-toggle-plane');
const btnResetSlice = document.getElementById('btn-reset-slice');
const exposedPartsWrapEl = document.getElementById('exposed-parts-wrap');
const exposedPartsRowEl = document.getElementById('exposed-parts-row');

const bpmSlider = document.getElementById('bpm-slider');
const bpmValueEl = document.getElementById('bpm-value');
const bpmReadoutEl = document.getElementById('bpm-readout');
const cardiacPhaseEl = document.getElementById('cardiac-phase');

const btnToggleCatalog = document.getElementById('btn-toggle-catalog');
const btnToggleInspector = document.getElementById('btn-toggle-inspector');
const btnToggleFlow = document.getElementById('btn-toggle-flow');
const btnToggleBeat = document.getElementById('btn-toggle-beat');
const btnToggleSound = document.getElementById('btn-toggle-sound');
const btnExplode = document.getElementById('btn-explode');
const btnEnableAr = document.getElementById('btn-enable-ar');
const qualitySelectEl = document.getElementById('quality-select');
const btnResetView = document.getElementById('btn-reset-view');
const mobileNavEl = document.getElementById('mobile-nav');

const hoverTooltipEl = document.getElementById('hover-tooltip');
const selectedPinEl = document.getElementById('selected-pin');
const selectedPinLabelEl = document.getElementById('selected-pin-label');

if (qualitySelectEl) {
  qualitySelectEl.value = qualityConfig.tier;
}

// ============================================================================
// 4. 2D/3D ANATOMICAL LEADER-LINE CALLOUT OVERLAY
// ============================================================================
const calloutOverlay = createCalloutOverlay({
  containerEl: document.getElementById('canvas-container'),
  onSelectPart: (partId) => {
    selectPart(selectedPartId === partId ? null : partId, true);
  }
});

// ============================================================================
// 5. ATLAS DIAGRAM VIEW MODES ('inside' | 'layers' | 'exterior')
// ============================================================================
function setAtlasMode(newMode) {
  atlasMode = newMode;
  atlasModeGroupEl?.querySelectorAll('.mode-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === newMode);
  });

  if (newMode === 'layers') {
    heartModel.root.visible = false;
    sliceSystem.root.visible = false;
    bloodFlow.group.visible = false;
    layersAssembly.root.visible = true;

    if (sliceSliderLabelEl) sliceSliderLabelEl.textContent = 'Layer spread';
    sliceSlider.value = String(Math.round(layerSpread * 100));
    sliceValueEl.textContent = `${Math.round(layerSpread * 100)}%`;
    sliceAxisGroup.style.display = 'none';

    camera.position.set(0.18, 0.55, 8.5);
    desiredCamTarget.set(-0.15, 0.25, 0);

    calloutOverlay.setMode('layers');
    if (selectedPartId && !HEART_LAYERS_BY_ID[selectedPartId]) {
      selectPart(null);
    } else {
      updateInspector(selectedPartId ? lookupCatalogItem(selectedPartId) : null);
    }
  } else if (newMode === 'inside') {
    heartModel.root.visible = true;
    sliceSystem.root.visible = true;
    bloodFlow.group.visible = true;
    layersAssembly.root.visible = false;

    if (sliceSliderLabelEl) sliceSliderLabelEl.textContent = 'Cut depth';
    sliceAxisGroup.style.display = 'flex';
    sliceSystem.applyPreset('inside-heart');
    sliceSystem.setSlice({ showPlane: false, showCaps: true });
    syncSliceUI();

    camera.position.set(0.08, 0.18, 7.6);
    desiredCamTarget.copy(DEFAULT_TARGET);

    calloutOverlay.setMode('inside');
    if (selectedPartId && HEART_LAYERS_BY_ID[selectedPartId]) {
      selectPart(null);
    } else {
      updateInspector(selectedPartId ? lookupCatalogItem(selectedPartId) : null);
    }
  } else {
    // 'exterior'
    heartModel.root.visible = true;
    sliceSystem.root.visible = true;
    bloodFlow.group.visible = true;
    layersAssembly.root.visible = false;

    if (sliceSliderLabelEl) sliceSliderLabelEl.textContent = 'Cut depth';
    sliceAxisGroup.style.display = 'flex';
    sliceSystem.reset();
    syncSliceUI();

    camera.position.copy(DEFAULT_CAM_POS);
    desiredCamTarget.copy(DEFAULT_TARGET);

    calloutOverlay.setMode('exterior');
    if (selectedPartId && HEART_LAYERS_BY_ID[selectedPartId]) {
      selectPart(null);
    } else {
      updateInspector(selectedPartId ? lookupCatalogItem(selectedPartId) : null);
    }
  }
}

atlasModeGroupEl?.addEventListener('click', (e) => {
  const btn = e.target.closest('.mode-tab');
  if (!btn) return;
  setAtlasMode(btn.dataset.mode);
});

btnToggleLabels?.addEventListener('click', () => {
  const next = !calloutOverlay.isEnabled();
  calloutOverlay.setEnabled(next);
  btnToggleLabels.classList.toggle('active', next);
  btnToggleLabels.setAttribute('aria-pressed', String(next));
});

// ============================================================================
// 6. ASYNC HUBMAP GLB LOAD & HOT-SWAP
// ============================================================================
let modelLoadSeq = 0;

async function loadHeartForTier(cfg, showOverlay = false) {
  const seq = ++modelLoadSeq;
  if (showOverlay && bootOverlayEl) {
    bootOverlayEl.classList.remove('hidden');
    bootStatusTextEl.textContent = 'Loading anatomical model…';
  }

  const loaded = await loadAnatomicalHeartModel({
    clippingPlane,
    qualityConfig: cfg,
    onProgress: (p) => {
      if (seq !== modelLoadSeq) return;
      if (bootProgressBarEl) {
        bootProgressBarEl.style.width = `${Math.round(15 + p * 85)}%`;
      }
    }
  });

  if (seq !== modelLoadSeq) return;

  scene.remove(heartModel.root);
  heartModel = loaded;
  scene.add(heartModel.root);

  sliceSystem.bindHeartModel(heartModel);
  if (heartModel.manifest?.flowPathways) {
    bloodFlow.rebindPathways(heartModel.manifest.flowPathways);
  }
  bloodFlow.setQualityTier(cfg.tier);

  setAtlasMode(atlasMode);

  if (bootOverlayEl) {
    bootOverlayEl.classList.add('hidden');
  }
  if (!localStorage.getItem('heart_onboarded_v4') && onboardingBannerEl) {
    onboardingBannerEl.classList.remove('hidden');
  }
}

loadHeartForTier(qualityConfig, true);

if (btnDismissOnboarding) {
  btnDismissOnboarding.addEventListener('click', () => {
    onboardingBannerEl.classList.add('hidden');
    localStorage.setItem('heart_onboarded_v4', '1');
  });
}

// ============================================================================
// 7. UNIFIED CATALOG (26 STRUCTURES + 9 HISTOLOGICAL/STRUCTURAL LAYERS)
// ============================================================================
const ALL_CATALOG_ITEMS = [
  ...HEART_LAYERS_CATALOG.map((l) => ({
    ...l,
    catalogSection: 'Heart Layers',
    displayName: `${l.number}. ${l.name}`
  })),
  ...HEART_PARTS.map((p) => ({
    ...p,
    catalogSection: p.category,
    displayName: p.name
  }))
];

function lookupCatalogItem(id) {
  return HEART_PARTS_BY_ID[id] || HEART_LAYERS_BY_ID[id] || null;
}

function matchesPartSearch(part, q) {
  if (!q) return true;
  if (part.name.toLowerCase().includes(q)) return true;
  if (part.latin.toLowerCase().includes(q)) return true;
  if (part.category.toLowerCase().includes(q)) return true;
  if (part.subGroup && part.subGroup.toLowerCase().includes(q)) return true;
  if (part.subtitle && part.subtitle.toLowerCase().includes(q)) return true;
  if (part.description.toLowerCase().includes(q)) return true;
  if (part.clinicalNotes && part.clinicalNotes.toLowerCase().includes(q)) return true;
  if (Array.isArray(part.synonyms) && part.synonyms.some((s) => s.toLowerCase().includes(q))) {
    return true;
  }
  return false;
}

function renderPartsList() {
  partsListEl.innerHTML = '';
  const q = searchQuery.trim().toLowerCase();
  if (btnClearSearch) {
    btnClearSearch.style.display = q ? 'block' : 'none';
  }

  const filtered = ALL_CATALOG_ITEMS.filter((part) => {
    const matchesCat =
      activeCategory === 'All' || part.catalogSection === activeCategory;
    return matchesCat && matchesPartSearch(part, q);
  });

  partCountBadge.textContent = `${filtered.length} of ${ALL_CATALOG_ITEMS.length}`;

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-catalog-state';
    empty.innerHTML = `
      <div>No structures match "${searchQuery}".</div>
      <button class="btn" type="button" id="btn-reset-catalog-filter">Reset filter</button>
    `;
    partsListEl.appendChild(empty);
    empty.querySelector('#btn-reset-catalog-filter')?.addEventListener('click', () => {
      searchQuery = '';
      activeCategory = 'All';
      partSearchEl.value = '';
      categoryTabsEl
        .querySelectorAll('.cat-tab')
        .forEach((b) => b.classList.toggle('active', b.dataset.cat === 'All'));
      renderPartsList();
    });
    return;
  }

  const groups = new Map();
  for (const part of filtered) {
    const gName = part.subGroup || part.category;
    if (!groups.has(gName)) groups.set(gName, []);
    groups.get(gName).push(part);
  }

  for (const [subGroupName, groupParts] of groups.entries()) {
    const header = document.createElement('div');
    header.className = 'subgroup-header';
    header.textContent = subGroupName;
    partsListEl.appendChild(header);

    for (const part of groupParts) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.role = 'option';
      btn.setAttribute('aria-selected', String(selectedPartId === part.id));
      btn.className = `part-item${selectedPartId === part.id ? ' selected' : ''}`;
      btn.dataset.partId = part.id;

      const subText = part.subtitle ? `${part.subtitle} · ${part.latin}` : part.latin;
      btn.innerHTML = `
        <div class="part-item-text">
          <div class="part-item-name">${part.displayName || part.name}</div>
          <div class="part-item-cat">${subText}</div>
        </div>
      `;

      btn.addEventListener('click', () => {
        if (HEART_LAYERS_BY_ID[part.id] && atlasMode !== 'layers') {
          setAtlasMode('layers');
        } else if (HEART_PARTS_BY_ID[part.id] && atlasMode === 'layers') {
          setAtlasMode('inside');
        }
        selectPart(selectedPartId === part.id ? null : part.id, false);
        if (window.innerWidth <= 768 && selectedPartId) {
          setMobileSheet('inspector');
        }
      });
      btn.addEventListener('mouseenter', () => {
        hoveredPartId = part.id;
      });
      btn.addEventListener('mouseleave', () => {
        if (hoveredPartId === part.id) hoveredPartId = null;
      });

      partsListEl.appendChild(btn);
    }
  }
}

function getInspectorBodyText(part) {
  if (!part) {
    if (atlasMode === 'layers') {
      if (activeInspectorTab === 'clinical') {
        return 'The pericardial sac and three-layered heart wall (epicardium, myocardium, endocardium) enclose the cardiac chambers and valves. Pericarditis, tamponade, myocarditis, and endocarditis target specific histological layers.';
      }
      if (activeInspectorTab === 'cycle') {
        return 'The serous pericardial cavity provides a frictionless fluid interface while the helical myocardium contracts and twists against the fibrous valve skeleton.';
      }
      return 'Exploded 3D Layer View of the 9 histological and structural layers of the heart: ① Fibrous Pericardium, ② Parietal Pericardium, ③ Pericardial Cavity, ④ Visceral Pericardium (Epicardium), ⑤ Myocardium, ⑥ Endocardium, ⑦ Heart Valves, ⑧ Heart Chambers, and ⑨ Coronary Blood Vessels.';
    }
    if (activeInspectorTab === 'clinical') {
      return 'Reference anatomy from the National Library of Medicine Visible Human Male dataset (HuBMAP CCF v1.2, CC BY 4.0). Open a section plane below to inspect wall thickness, valve rings, and septal relationships.';
    }
    if (activeInspectorTab === 'cycle') {
      return 'Wiggers cardiac cycle: atrial contraction (P wave), isovolumetric contraction and S1 (mitral and tricuspid closure), systolic ejection with apical torsion, and diastolic relaxation with S2 (aortic and pulmonic closure).';
    }
    return 'Coronal interior view exposing the right and left atria, right and left ventricles, muscular interventricular septum, tricuspid and mitral (bicuspid) valves with chordae tendineae and papillary muscles, and the aortic and pulmonary semilunar valves.';
  }

  if (activeInspectorTab === 'clinical') {
    return `${part.clinicalNotes || part.description} (${part.sourceProvenance || 'HuBMAP VHM v1.2'}, ${part.ontologyId || 'UBERON'})`;
  }
  if (activeInspectorTab === 'cycle') {
    return part.cycleRelation || part.description;
  }
  return part.description;
}

function updateInspector(part) {
  if (!part) {
    if (atlasMode === 'layers') {
      infoCategoryEl.textContent = 'Exploded 3D Layer View';
      infoOxygenEl.textContent = '9 histological layers';
      infoTitleEl.textContent = 'Heart Layers';
      infoLatinEl.textContent = 'Strata parietis cordis et pericardii';
      if (infoOntologyEl) infoOntologyEl.textContent = 'UBERON:0000948';
      infoDescEl.textContent = getInspectorBodyText(null);
      infoPathwayEl.textContent = 'Fibrous & Serous Pericardium → Epicardium → Myocardium → Endocardium → Valves & Chambers';
      infoRoleEl.textContent = 'Protects, lubricates, perfuses, and pumps blood';
    } else {
      infoCategoryEl.textContent = atlasMode === 'inside' ? 'Interior Cutaway' : 'Overview';
      infoOxygenEl.textContent = 'Dual circulation';
      infoTitleEl.textContent = atlasMode === 'inside' ? 'Inside of Heart' : 'Human Heart';
      infoLatinEl.textContent =
        atlasMode === 'inside' ? 'Cor humanum (Sectio coronalis)' : 'Cor humanum';
      if (infoOntologyEl) infoOntologyEl.textContent = 'UBERON:0000948';
      infoDescEl.textContent = getInspectorBodyText(null);
      infoPathwayEl.textContent = 'RA → Tricuspid → RV → Pulmonary Valve → Lungs → LA → Mitral → LV → Aorta';
      infoRoleEl.textContent = '4 chambers · 4 valves · 9 wall layers';
    }
    if (relatedPartsSectionEl) relatedPartsSectionEl.style.display = 'none';
    return;
  }

  infoCategoryEl.textContent = part.subGroup || part.category;
  infoOxygenEl.textContent = part.subtitle || part.oxygenation;

  infoTitleEl.textContent = part.number ? `${part.number}. ${part.name}` : part.name;
  infoLatinEl.textContent = part.latin;
  if (infoOntologyEl) infoOntologyEl.textContent = part.ontologyId || 'UBERON';
  infoDescEl.textContent = getInspectorBodyText(part);
  infoPathwayEl.textContent = part.pathway;
  infoRoleEl.textContent = part.role;

  if (relatedPartsSectionEl && relatedPartsRowEl) {
    const relIds = part.relatedIds || [];
    relatedPartsRowEl.innerHTML = '';
    if (relIds.length > 0) {
      relatedPartsSectionEl.style.display = 'flex';
      for (const rid of relIds) {
        const relPart = lookupCatalogItem(rid);
        if (!relPart) continue;
        const linkBtn = document.createElement('button');
        linkBtn.type = 'button';
        linkBtn.className = 'text-link-btn';
        linkBtn.textContent = relPart.name;
        linkBtn.addEventListener('click', () => selectPart(relPart.id, true));
        relatedPartsRowEl.appendChild(linkBtn);
      }
    } else {
      relatedPartsSectionEl.style.display = 'none';
    }
  }
}

function selectPart(partId, scrollIntoCatalog = false) {
  selectedPartId = partId;
  const part = partId ? lookupCatalogItem(partId) : null;
  updateInspector(part);

  const items = partsListEl.querySelectorAll('.part-item');
  items.forEach((el) => {
    const match = el.dataset.partId === partId;
    el.classList.toggle('selected', match);
    el.setAttribute('aria-selected', String(match));
    if (match && scrollIntoCatalog) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });

  if (partId && layersAssembly.layerRecords.has(partId)) {
    const rec = layersAssembly.layerRecords.get(partId);
    desiredCamTarget.set(0, rec.group.position.y, 0);
  } else if (partId && heartModel.partMeshes.has(partId)) {
    const rec = heartModel.partMeshes.get(partId);
    rec.group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(rec.group);
    box.getCenter(desiredCamTarget);
  } else {
    desiredCamTarget.copy(atlasMode === 'layers' ? new THREE.Vector3(-0.15, 0.25, 0) : DEFAULT_TARGET);
  }
}

partSearchEl.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderPartsList();
});

btnClearSearch?.addEventListener('click', () => {
  searchQuery = '';
  partSearchEl.value = '';
  renderPartsList();
  partSearchEl.focus();
});

categoryTabsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.cat-tab');
  if (!btn) return;
  activeCategory = btn.dataset.cat;
  categoryTabsEl.querySelectorAll('.cat-tab').forEach((b) => {
    const active = b === btn;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  });
  if (activeCategory === 'Heart Layers' && atlasMode !== 'layers') {
    setAtlasMode('layers');
  }
  renderPartsList();
});

inspectorTabsEl?.addEventListener('click', (e) => {
  const btn = e.target.closest('.insp-tab');
  if (!btn) return;
  activeInspectorTab = btn.dataset.tab;
  inspectorTabsEl.querySelectorAll('.insp-tab').forEach((b) => {
    const active = b === btn;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  });
  updateInspector(selectedPartId ? lookupCatalogItem(selectedPartId) : null);
});

focusModeGroupEl?.addEventListener('click', (e) => {
  const btn = e.target.closest('.focus-mode-btn');
  if (!btn) return;
  focusMode = btn.dataset.focus;
  focusModeGroupEl
    .querySelectorAll('.focus-mode-btn')
    .forEach((b) => b.classList.toggle('active', b === btn));
});

btnSliceSelected?.addEventListener('click', () => {
  if (atlasMode === 'layers') {
    setAtlasMode('inside');
    return;
  }
  const part = selectedPartId ? HEART_PARTS_BY_ID[selectedPartId] : null;
  const presetId = part?.recommendedSlicePreset || 'inside-heart';
  sliceSystem.applyPreset(presetId);
  syncSliceUI();
});

renderPartsList();

// ============================================================================
// 8. SECTION PLANES WIRING
// ============================================================================
function syncSliceUI() {
  if (atlasMode === 'layers') return;
  const st = sliceSystem.getState();
  sliceSlider.value = String(st.percent);
  sliceSlider.setAttribute('aria-valuenow', String(st.percent));
  sliceValueEl.textContent = st.enabled ? `${st.percent}%` : 'Off';

  sliceAxisGroup.querySelectorAll('.axis-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.axis === st.axis);
  });

  slicePresetsGridEl?.querySelectorAll('.preset-btn').forEach((b) => {
    b.classList.toggle('active', st.enabled && b.dataset.preset === st.presetId);
  });

  if (sliceAnatomicalLabelEl) {
    sliceAnatomicalLabelEl.textContent = st.readout;
  }

  if (btnToggleCaps) {
    btnToggleCaps.classList.toggle('active', st.showCaps);
    btnToggleCaps.setAttribute('aria-pressed', String(st.showCaps));
  }

  if (btnTogglePlane) {
    btnTogglePlane.classList.toggle('active', st.showPlane);
    btnTogglePlane.setAttribute('aria-pressed', String(st.showPlane));
  }

  const exposed = sliceSystem.getExposedStructures();
  if (sliceExposedCountEl) {
    sliceExposedCountEl.textContent = st.enabled ? `${exposed.length} in plane` : '0 in plane';
  }

  if (exposedPartsWrapEl && exposedPartsRowEl) {
    exposedPartsRowEl.innerHTML = '';
    if (st.enabled && exposed.length > 0) {
      exposedPartsWrapEl.style.display = 'flex';
      for (const meta of exposed.slice(0, 12)) {
        const linkBtn = document.createElement('button');
        linkBtn.type = 'button';
        linkBtn.className = 'text-link-btn';
        linkBtn.textContent = meta.name;
        linkBtn.addEventListener('click', () => selectPart(meta.id, true));
        exposedPartsRowEl.appendChild(linkBtn);
      }
    } else {
      exposedPartsWrapEl.style.display = 'none';
    }
  }
}

sliceSlider.addEventListener('input', (e) => {
  const percent = Number(e.target.value);
  if (atlasMode === 'layers') {
    layerSpread = percent / 100;
    sliceValueEl.textContent = `${percent}%`;
    return;
  }
  sliceSystem.setSlice({ percent, presetId: null });
  syncSliceUI();
});

sliceAxisGroup.addEventListener('click', (e) => {
  const btn = e.target.closest('.axis-btn');
  if (!btn) return;
  if (atlasMode === 'layers') setAtlasMode('inside');
  sliceSystem.setSlice({ axis: btn.dataset.axis, presetId: null });
  syncSliceUI();
});

slicePresetsGridEl?.addEventListener('click', (e) => {
  const btn = e.target.closest('.preset-btn');
  if (!btn) return;
  const presetId = btn.dataset.preset;
  if (atlasMode === 'layers') {
    setAtlasMode('inside');
  }
  const cur = sliceSystem.getState();
  if (cur.enabled && cur.presetId === presetId) {
    sliceSystem.reset();
    atlasMode = 'exterior';
    atlasModeGroupEl?.querySelectorAll('.mode-tab').forEach((b) => {
      b.classList.toggle('active', b.dataset.mode === 'exterior');
    });
    calloutOverlay.setMode('exterior');
  } else {
    sliceSystem.applyPreset(presetId);
    if (presetId === 'inside-heart') {
      atlasMode = 'inside';
      atlasModeGroupEl?.querySelectorAll('.mode-tab').forEach((b) => {
        b.classList.toggle('active', b.dataset.mode === 'inside');
      });
      calloutOverlay.setMode('inside');
    }
  }
  syncSliceUI();
});

btnToggleCaps?.addEventListener('click', () => {
  const cur = sliceSystem.getState();
  sliceSystem.setSlice({ showCaps: !cur.showCaps });
  syncSliceUI();
});

btnTogglePlane?.addEventListener('click', () => {
  const cur = sliceSystem.getState();
  sliceSystem.setSlice({ showPlane: !cur.showPlane });
  syncSliceUI();
});

btnResetSlice?.addEventListener('click', () => {
  setAtlasMode('exterior');
});

// ============================================================================
// 9. TOPBAR, RAIL COLLAPSE, MOBILE SHEETS & QUALITY CONTROLS
// ============================================================================
function toggleLeftRail(forceState) {
  const cur = document.body.getAttribute('data-left-collapsed') === 'true';
  const nextCollapsed = typeof forceState === 'boolean' ? !forceState : !cur;
  document.body.setAttribute('data-left-collapsed', String(nextCollapsed));
  btnToggleCatalog?.classList.toggle('active', !nextCollapsed);
  btnToggleCatalog?.setAttribute('aria-expanded', String(!nextCollapsed));
}

function toggleRightRail(forceState) {
  const cur = document.body.getAttribute('data-right-collapsed') === 'true';
  const nextCollapsed = typeof forceState === 'boolean' ? !forceState : !cur;
  document.body.setAttribute('data-right-collapsed', String(nextCollapsed));
  btnToggleInspector?.classList.toggle('active', !nextCollapsed);
  btnToggleInspector?.setAttribute('aria-expanded', String(!nextCollapsed));
}

btnToggleCatalog?.addEventListener('click', () => {
  if (window.innerWidth < 1200 && document.body.getAttribute('data-left-collapsed') === 'true') {
    toggleRightRail(false);
  }
  toggleLeftRail();
});

btnToggleInspector?.addEventListener('click', () => {
  if (window.innerWidth < 1200 && document.body.getAttribute('data-right-collapsed') === 'true') {
    toggleLeftRail(false);
  }
  toggleRightRail();
});

function setMobileSheet(sheetName) {
  document.body.setAttribute('data-mobile-sheet', sheetName);
  mobileNavEl?.querySelectorAll('.mobile-nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.sheet === sheetName);
  });
}

mobileNavEl?.addEventListener('click', (e) => {
  const btn = e.target.closest('.mobile-nav-btn');
  if (!btn) return;
  const target = btn.dataset.sheet;
  const cur = document.body.getAttribute('data-mobile-sheet');
  setMobileSheet(cur === target && target !== 'none' ? 'none' : target);
});

bpmSlider.addEventListener('input', (e) => {
  bpm = Number(e.target.value);
  bpmSlider.setAttribute('aria-valuenow', String(bpm));
  bpmValueEl.textContent = `${bpm} bpm`;
  bpmReadoutEl.textContent = `${bpm} bpm`;
});

btnToggleFlow.addEventListener('click', () => {
  flowEnabled = !flowEnabled;
  btnToggleFlow.classList.toggle('active', flowEnabled);
  btnToggleFlow.setAttribute('aria-pressed', String(flowEnabled));
});

btnToggleBeat.addEventListener('click', () => {
  beatEnabled = !beatEnabled;
  btnToggleBeat.classList.toggle('active', beatEnabled);
  btnToggleBeat.setAttribute('aria-pressed', String(beatEnabled));
  heartSounds.unlock();
});

btnToggleSound.addEventListener('click', () => {
  soundEnabled = heartSounds.setEnabled(!heartSounds.isEnabled());
  btnToggleSound.classList.toggle('active', soundEnabled);
  btnToggleSound.setAttribute('aria-pressed', String(soundEnabled));
  heartSounds.unlock();
});

window.addEventListener('pointerdown', () => heartSounds.unlock(), { passive: true });

btnExplode.addEventListener('click', () => {
  explodeTarget = explodeTarget > 0 ? 0 : 1;
  btnExplode.classList.toggle('active', explodeTarget > 0);
  btnExplode.setAttribute('aria-pressed', String(explodeTarget > 0));
});

function applyQualityTierRuntime(tier, reloadGeometry = false) {
  qualityConfig = getQualityConfig(tier);
  if (qualitySelectEl) qualitySelectEl.value = tier;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, qualityConfig.maxPixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = qualityConfig.shadows;
  keyLight.castShadow = qualityConfig.shadows;
  bloomPass.enabled = qualityConfig.bloom;
  bloomPass.strength = qualityConfig.bloomStrength;
  bloodFlow.setQualityTier(tier);
  if (reloadGeometry) {
    loadHeartForTier(qualityConfig, false);
  }
}

const frameMonitor = createAdaptiveFrameMonitor({
  initialTier: qualityConfig.tier,
  onTierChange: (newTier, reason) => {
    applyQualityTierRuntime(newTier, reason === 'manual');
  }
});

qualitySelectEl?.addEventListener('change', (e) => {
  const newTier = e.target.value;
  localStorage.setItem('heart_quality_tier', newTier);
  frameMonitor.setTier(newTier, true);
});

function resetViewAndSelection() {
  selectPart(null);
  explodeTarget = 0;
  layerSpread = 0.85;
  btnExplode.classList.remove('active');
  btnExplode.setAttribute('aria-pressed', 'false');
  setAtlasMode(atlasMode);
  controls.update();
}

btnResetView.addEventListener('click', resetViewAndSelection);

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
    if (e.key === 'Escape') e.target.blur();
    return;
  }
  if (e.key === 'Escape') {
    if (window.innerWidth <= 768) setMobileSheet('none');
    else selectPart(null);
  } else if (e.key === 'r' || e.key === 'R') {
    resetViewAndSelection();
  } else if (e.key === 'c' || e.key === 'C') {
    toggleLeftRail();
  } else if (e.key === 'i' || e.key === 'I') {
    toggleRightRail();
  } else if (e.key === 'l' || e.key === 'L') {
    btnToggleLabels?.click();
  }
});

// ============================================================================
// 10. 3D RAYCASTING (MOUSE / TOUCH & HAND RETICLE)
// ============================================================================
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();

function raycastAtScreenXY(clientX, clientY) {
  pointerNDC.x = (clientX / window.innerWidth) * 2 - 1;
  pointerNDC.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointerNDC, camera);

  if (atlasMode === 'layers') {
    const hits = raycaster.intersectObjects(layersAssembly.pickableMeshes, false);
    for (const hit of hits) {
      if (!hit.object.visible || !hit.object.parent?.visible) continue;
      return hit.object.userData.partId || null;
    }
    return null;
  }

  const sliceActive = sliceSystem.getState().enabled;
  const hits = raycaster.intersectObjects(heartModel.pickableMeshes, false);
  for (const hit of hits) {
    if (!hit.object.visible || !hit.object.parent?.visible) continue;
    if (sliceActive && clippingPlane.distanceToPoint(hit.point) < -0.01) {
      continue;
    }
    return hit.object.userData.partId || null;
  }
  return null;
}

let pointerDownPos = { x: 0, y: 0 };

canvas.addEventListener('pointerdown', (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  const partId = raycastAtScreenXY(e.clientX, e.clientY);
  hoveredPartId = partId;
  if (partId) {
    const part = lookupCatalogItem(partId);
    hoverTooltipEl.textContent = part
      ? part.number
        ? `${part.number}. ${part.name}`
        : part.name
      : partId;
    hoverTooltipEl.style.display = 'block';
    hoverTooltipEl.style.left = `${e.clientX}px`;
    hoverTooltipEl.style.top = `${e.clientY}px`;
    canvas.style.cursor = 'pointer';
  } else {
    hoverTooltipEl.style.display = 'none';
    canvas.style.cursor = 'grab';
  }
});

canvas.addEventListener('pointerup', (e) => {
  const moved = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  const threshold = e.pointerType === 'touch' ? 14 : 6;
  if (moved > threshold) return;
  const partId = raycastAtScreenXY(e.clientX, e.clientY);
  if (partId) {
    selectPart(selectedPartId === partId ? null : partId, true);
  }
});

// ============================================================================
// 11. WEBCAM HAND GESTURES (MEDIAPIPE HANDS)
// ============================================================================
const spherical = new THREE.Spherical();
const offsetVec = new THREE.Vector3();

function applyOrbitDelta(deltaAzimuth, deltaPolar) {
  offsetVec.copy(camera.position).sub(controls.target);
  spherical.setFromVector3(offsetVec);
  spherical.theta += deltaAzimuth;
  spherical.phi = Math.max(0.25, Math.min(Math.PI * 0.85, spherical.phi + deltaPolar));
  offsetVec.setFromSpherical(spherical);
  camera.position.copy(controls.target).add(offsetVec);
  controls.update();
}

function applyZoomDelta(deltaRadius) {
  offsetVec.copy(camera.position).sub(controls.target);
  spherical.setFromVector3(offsetVec);
  spherical.radius = Math.max(
    controls.minDistance,
    Math.min(controls.maxDistance, spherical.radius + deltaRadius)
  );
  offsetVec.setFromSpherical(spherical);
  camera.position.copy(controls.target).add(offsetVec);
  controls.update();
}

const gestureController = createGestureController({
  videoEl: document.getElementById('webcam-video'),
  overlayCanvas: document.getElementById('hand-overlay'),
  placeholderEl: document.getElementById('cam-placeholder'),
  statusEl: document.getElementById('gesture-status'),
  reticleEl: document.getElementById('hand-reticle'),
  legendEls: {
    orbit: document.getElementById('legend-orbit'),
    zoom: document.getElementById('legend-zoom'),
    select: document.getElementById('legend-select'),
    reset: document.getElementById('legend-reset')
  },
  onOrbitDelta: (dTheta, dPhi) => applyOrbitDelta(dTheta, dPhi),
  onZoomDelta: (dR) => applyZoomDelta(dR),
  onHoverScreenPoint: (x, y) => {
    const partId = raycastAtScreenXY(x, y);
    hoveredPartId = partId;
    if (partId) {
      const part = lookupCatalogItem(partId);
      hoverTooltipEl.textContent = part ? part.name : partId;
      hoverTooltipEl.style.display = 'block';
      hoverTooltipEl.style.left = `${x}px`;
      hoverTooltipEl.style.top = `${y}px`;
    } else {
      hoverTooltipEl.style.display = 'none';
    }
  },
  onPinchSelectAtScreenPoint: (x, y) => {
    const partId = raycastAtScreenXY(x, y);
    if (partId) {
      selectPart(partId, true);
      return true;
    }
    return false;
  },
  onFistReset: () => {
    resetViewAndSelection();
  }
});

btnEnableAr.addEventListener('click', async () => {
  if (gestureController.isRunning()) {
    gestureController.stop();
    btnEnableAr.classList.remove('active');
    btnEnableAr.setAttribute('aria-pressed', 'false');
    btnEnableAr.textContent = 'Hand AR';
  } else {
    btnEnableAr.textContent = 'Starting…';
    const ok = await gestureController.start();
    btnEnableAr.classList.toggle('active', ok);
    btnEnableAr.setAttribute('aria-pressed', String(ok));
    btnEnableAr.textContent = 'Hand AR';
  }
});

// ============================================================================
// 12. LIVE ECG WAVEFORM CANVAS & 3D SELECTED CALLOUT PIN
// ============================================================================
const ecgCanvas = document.getElementById('ecg-canvas');
const ecgCtx = ecgCanvas.getContext('2d');
const ecgHistory = new Array(ecgCanvas.width).fill(0);

function drawEcgTrace(sample) {
  ecgHistory.push(sample);
  if (ecgHistory.length > ecgCanvas.width) ecgHistory.shift();

  const w = ecgCanvas.width;
  const h = ecgCanvas.height;
  ecgCtx.clearRect(0, 0, w, h);

  ecgCtx.strokeStyle = '#8f2d2d';
  ecgCtx.lineWidth = 1.4;
  ecgCtx.beginPath();
  for (let i = 0; i < ecgHistory.length; i++) {
    const x = i;
    const y = h * 0.65 - ecgHistory[i] * (h * 0.52);
    if (i === 0) ecgCtx.moveTo(x, y);
    else ecgCtx.lineTo(x, y);
  }
  ecgCtx.stroke();
}

const tempPinWorld = new THREE.Vector3();

function updateSelectedPin() {
  if (calloutOverlay.isEnabled() && window.innerWidth >= 769) {
    selectedPinEl.style.display = 'none';
    return;
  }
  if (!selectedPartId || !heartModel.partMeshes.has(selectedPartId)) {
    selectedPinEl.style.display = 'none';
    return;
  }
  const rec = heartModel.partMeshes.get(selectedPartId);
  rec.group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(rec.group);
  box.getCenter(tempPinWorld);
  tempPinWorld.project(camera);

  if (tempPinWorld.z > 1) {
    selectedPinEl.style.display = 'none';
    return;
  }

  const sx = (tempPinWorld.x * 0.5 + 0.5) * window.innerWidth;
  const sy = (-tempPinWorld.y * 0.5 + 0.5) * window.innerHeight;
  selectedPinEl.style.display = 'block';
  selectedPinEl.style.left = `${sx}px`;
  selectedPinEl.style.top = `${sy - 14}px`;
  selectedPinLabelEl.textContent = rec.meta.name;
}

// ============================================================================
// 13. RESIZE & MAIN ANIMATION LOOP
// ============================================================================
function syncResponsiveRails() {
  if (window.innerWidth >= 769 && window.innerWidth < 1200) {
    const leftCol = document.body.getAttribute('data-left-collapsed') === 'true';
    const rightCol = document.body.getAttribute('data-right-collapsed') === 'true';
    if (!leftCol && !rightCol) {
      toggleLeftRail(false);
    }
  }
}

syncResponsiveRails();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  syncResponsiveRails();
});

const PHASE_SENTENCE_MAP = {
  'ATRIAL SYSTOLE': 'Atrial contraction',
  'VENTRICULAR SYSTOLE': 'Ventricular systole',
  'DIASTOLIC RELAXATION': 'Isovolumetric relaxation',
  'DIASTOLIC FILLING': 'Diastolic filling'
};

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(0.05, clock.getDelta());
  const elapsed = clock.getElapsedTime();

  frameMonitor.recordFrame(dt);

  explodeCurrent += (explodeTarget - explodeCurrent) * 0.1;

  const { phaseLabel, ecgValue, phase, ventricularContract } = updateHeartCycle(
    heartModel,
    elapsed,
    bpm,
    beatEnabled,
    explodeCurrent,
    selectedPartId,
    hoveredPartId,
    { focusMode, reducedMotion: prefersReducedMotion }
  );

  updateHeartLayersAssembly(
    layersAssembly,
    elapsed,
    ventricularContract,
    layerSpread,
    selectedPartId,
    hoveredPartId,
    focusMode
  );

  sliceSystem.update();

  heartSounds.update(dt, phase, bpm, beatEnabled && soundEnabled);
  cardiacPhaseEl.textContent = beatEnabled
    ? PHASE_SENTENCE_MAP[phaseLabel] || phaseLabel
    : 'Paused';
  drawEcgTrace(ecgValue);

  if (qualityConfig.bloom) {
    const pulseBoost =
      beatEnabled && !prefersReducedMotion ? ventricularContract * 0.12 : 0;
    bloomPass.strength = qualityConfig.bloomStrength + pulseBoost;
  }

  if (atlasMode !== 'layers') {
    bloodFlow.update(dt, bpm, phase, flowEnabled);
  }

  controls.target.lerp(desiredCamTarget, 0.08);
  controls.update();

  calloutOverlay.update({
    camera,
    heartModel,
    layersAssembly,
    selectedPartId,
    hoveredPartId
  });

  updateSelectedPin();

  if (qualityConfig.bloom) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}

animate();
